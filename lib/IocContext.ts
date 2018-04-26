import { getGlobalType, getSuperClassInfo, isClass, getMetadata, getInjects } from './utils'
import { logger } from '../utils'

export class Config {
  /** auto register class, when class not found. default: false */
  autoRegister?: boolean = false
  /** constructor inject, MUST in TypeScript with emitDecoratorMetadata and use decorator with class, default: true */
  constructorInject?: boolean = true
  // onNotFound: (globalType: string) => any
  // onGetValue: (data: Store) => any
}

export const DefaultRegisterOption: RegisterOptions = {
  singleton: true,
  autoNew: true,
  regInSuperClass: false,
}
export interface RegisterOptions {
  /** default: true */
  singleton?: boolean
  /** if data a class, auto new a instance.
   *  if data a function, auto run(lazy).
   *  default: true */
  autoNew?: boolean
  /**
   * register in superclass, you can get use superclass with getSubClasses method.
   * This setting is not inherited.
   * default: false
   * */
  regInSuperClass?: boolean
}
export type InterceptorType = () => void
export type KeyType = Function | string // typeof Object
export type RegKeyType = KeyType | undefined
export interface Store {
  inited: boolean,
  value: any,
  options: RegisterOptions,
  subClasses: Store[],
}
export class IocContext {
  private static defaultInstance: IocContext
  private components = new Map<string, Store>()
  public static get DefaultInstance() {
    return this.defaultInstance ||
      (this.defaultInstance = new IocContext(), this.defaultInstance)
  }

  constructor(
    private config = new Config
  ) {
  }

  public remove(keyOrType: KeyType) {
    return this.components.delete(getGlobalType(keyOrType))
  }

  public get<T>(keyOrType: KeyType): T {
    const key = getGlobalType(keyOrType)

    if (this.components.has(key)) {
      return this.returnValue(this.components.get(key))
    } else if (this.config.autoRegister && isClass(keyOrType)) {
      this.register(keyOrType)
      return this.get(keyOrType)
    } else {
      return
    }
  }

  public has(keyOrType: KeyType): boolean {
    return this.components.has(getGlobalType(keyOrType))
  }

  public getSubClasses<T>(keyOrType: KeyType): T[] {
    const data = this.components.get(getGlobalType(keyOrType))
    if (!data) return
    return data.subClasses.map(sc => this.returnValue(sc))
  }

  public replace(keyOrType: KeyType, newData: any, options?: RegisterOptions, force = false) {
    const key = getGlobalType(keyOrType)
    const data = this.components.get(key)
    if (data) {
      data.inited = false
      data.value = this.genValue(newData, options || data.options)
    } else if (force) {
      this.register(newData, keyOrType, options)
    } else {
      throw new Error(`the key:[${key}] is not register.`)
    }
  }

  public append(keyOrType: KeyType, subData: any, options = DefaultRegisterOption) {
    if (!this.canBeKey(keyOrType)) {
      throw new Error('key require a string or a class.')
    }
    let store: Store
    if (isClass(subData)) {
      this.register(subData, undefined, options)
      store = this.components.get(getGlobalType(subData))
    } else {
      store = this.newStore(subData, options)
    }
    this.appendData(getGlobalType(keyOrType), keyOrType, options, store)
  }

  public register(data: any, key?: RegKeyType, options = DefaultRegisterOption) {
    if (key) {
      if (!this.canBeKey(key)) {
        throw new Error('key require a string or a class.')
      }
    } else {
      if (!this.canBeKey(data)) {
        throw new Error('when data is not a class or string, require a key.')
      }
    }
    const dataType = (key && getGlobalType(key)) || (data && getGlobalType(data))

    if (this.components.has(dataType)) {
      throw new Error(`the key:[${dataType}] is already register.`)
    }
    options = {
      ...DefaultRegisterOption,
      ...options,
    }
    const store: Store = this.newStore(data, options)
    this.components.set(dataType, store)

    if (options.regInSuperClass) {
      if (!(data instanceof Function)) {
        throw new Error('if need regInSuperClass, data MUST be a class.')
      }
      const newOptions: RegisterOptions = { ...options, regInSuperClass: false }
      const superClasses = getSuperClassInfo(data)
      superClasses.forEach(sc => this.appendData(sc.type, sc.class, newOptions, store))
    }
  }

  public inject(instance: any, notFoundHandler?: (globalType: string, typeCls?: any) => any) {
    const classType = instance.constructor.prototype
    getInjects(classType)
      .forEach(inject => {
        const { key, typeCls, globalType } = inject
        switch (inject.type) {
          case 'inject':
            let data = this.get(typeCls)
            if (data === undefined) {
              if (notFoundHandler) {
                data = notFoundHandler(globalType, typeCls)
              }
              if (data === undefined) {
                logger.warn('Notfound:' + globalType)
              }
            }
            Object.defineProperty(instance, key, {
              configurable: true,
              writable: true,
              value: data,
            })
            break

          case 'lazyInject':
            const { always, subClass } = inject
            let defaultValue: any = instance[key]
            Object.defineProperty(instance, key, {
              configurable: true,
              get: () => {
                let data = subClass ? this.getSubClasses(typeCls) : this.get(typeCls)
                if (data === undefined) {
                  if (notFoundHandler) {
                    data = notFoundHandler(globalType, typeCls)
                  }
                  if (data === undefined) {
                    logger.warn(`Notfound: ${globalType}, use defaultValue.`)
                  }
                } else {
                  defaultValue = undefined
                  if (!always) {
                    Object.defineProperty(instance, key, {
                      configurable: true,
                      writable: true,
                      value: data
                    })
                  }
                }
                return data || defaultValue
              },
              set: (value) => {
                defaultValue = value
              }
            })
            break
        }
      })
  }

  private appendData(keyType: string, typeData: any, options: RegisterOptions, store: Store) {
    let superClass = this.components.get(keyType)
    if (!superClass) {
      this.register(typeData, undefined, options)
      superClass = this.components.get(keyType)
    }
    superClass.subClasses.push(store)
  }

  private newStore(data: any, options: RegisterOptions) {
    return {
      inited: false,
      value: this.genValue(data, options),
      options,
      subClasses: []
    } as Store
  }

  private canBeKey(obj: any) {
    return obj instanceof Function || typeof obj === 'string'
  }

  private genValue(data: any, options: RegisterOptions) {
    const dataIsFunction = data instanceof Function
    const dataIsClass = dataIsFunction && isClass(data)

    return () => {
      if (dataIsFunction && options.autoNew) {
        if (dataIsClass) {
          let args: any[] = [this]
          if (this.config.constructorInject && Reflect && Reflect.getMetadata) {
            const paramTypes = Reflect.getMetadata('design:paramtypes', data)
            if (paramTypes) {
              args = paramTypes.map((type: any) => {
                if (type === data ||
                  type === undefined ||
                  type === null ||
                  type === Number ||
                  type === Error ||
                  type === Object ||
                  type === String ||
                  type === Boolean ||
                  type === Array ||
                  type === Function
                ) {
                  return null
                }
                return this.get(type)
              })
            }
          }
          const value = new data(...args)
          this.inject(value)
          return value
        } else {
          return data(this)
        }
      } else {
        return data
      }
    }
  }

  private returnValue(data: Store) {
    if (data.options.singleton) {
      return data.inited ? data.value :
        (
          data.inited = true,
          data.value = data.value(),
          data.value
        )
    } else {
      return data.value()
    }
  }
}
