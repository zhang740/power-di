import 'reflect-metadata'

import { IocContext, RegisterOptions, KeyType, RegKeyType } from '../IocContext'
import { getGlobalType, logger } from '../utils'
import { inject, lazyInject } from './direct'

export function getClsTypeByDecorator(
  type: any, target: any, key: string
) {
  if (!type && Reflect && Reflect.getMetadata) {
    type = Reflect.getMetadata('design:type', target, key)
  }
  return type
}

export function getGlobalTypeByDecorator(
  type: any, target: any, key: string
) {
  return getGlobalType(getClsTypeByDecorator(type, target, key))
}

export class Decorators {
  private _funcContext = false
  private _context: IocContext | (() => IocContext)
  protected get context(): IocContext {
    if (this._funcContext) {
      return (this._context as Function)()
    } else {
      return this._context as IocContext
    }
  }

  constructor(ioc: IocContext | (() => IocContext) = IocContext.DefaultInstance) {
    this._context = ioc
    this._funcContext = typeof this._context === 'function'

    this.register = this.register.bind(this)
    this.registerSubClass = this.registerSubClass.bind(this)
    this.append = this.append.bind(this)
    this.inject = this.inject.bind(this)
    this.lazyInject = this.lazyInject.bind(this)
    this.lazyInjectSubClass = this.lazyInjectSubClass.bind(this)
  }

  /**
   * register class
   * @param target need a class
   * @param options RegisterOptions
   */
  public register(key?: RegKeyType, options?: RegisterOptions) {
    return (target: any) => {
      this.context.register(target, key, options)
    }
  }

  /**
   * register subClass, the abbreviation of register
   * @param target need a class
   * @param options RegisterOptions
   */
  public registerSubClass(key?: RegKeyType, options?: RegisterOptions) {
    return (target: any) => {
      this.context.register(target, key, {
        ...options, regInSuperClass: true
      })
    }
  }

  /**
   * append class to subClass list by key
   * @param key class or string
   * @param options RegisterOptions
   */
  public append(key?: KeyType, options?: RegisterOptions) {
    return (target: any) => {
      this.context.append(key, target, options)
    }
  }

  /**
   * inject
   * type: class or string
   * @param {{ type: any }} { type }
   * @returns
   * @memberof Decorators
   */
  public inject(data: { type?: any } = {}) {
    const decoratorThis = this
    return (target: any, key: string) => {
      inject(data)(target, key)

      Object.defineProperty(target, key, {
        configurable: true,
        get: function () {
          decoratorThis.context.inject(this)
          return this[key]
        },
        set: function (value) {
          Object.defineProperty(this, key, {
            configurable: true,
            writable: true,
            value,
          })
        }
      })
    }
  }

  /**
   * lazy inject
   * type: class or string
   * always: always read from context. default: false
   * subClass: getSubClasses. default: false
   * @param {{ type: any, always: boolean, subClass: boolean }} { type, always = false, subClass = false }
   * @returns
   * @memberof Decorators
   */
  public lazyInject(data: {
    type?: any, always?: boolean, subClass?: boolean
  } = {}) {
    const decoratorThis = this
    return (target: any, key: string) => {
      lazyInject(data)(target, key)

      let defaultValue = target[key]
      Object.defineProperty(target, key, {
        configurable: true,
        get: function () {
          Object.defineProperty(target, key, {
            configurable: true,
            writable: true,
            value: defaultValue
          })
          decoratorThis.context.inject(target)
          return this[key]
        },
        set: function (value) {
          Object.defineProperty(this, key, {
            configurable: true,
            writable: true,
            value,
          })
        }
      })
    }
  }

  /**
   * lazy inject subClass, the abbreviation of lazy inject
   * type: class or string
   * always: always read from context. default: false
   * @deprecated use direct @lazyInjectSubClass instead.
   * @param {{ type: any, always: boolean }} { type, always = false }
   * @returns
   * @memberof Decorators
   */
  public lazyInjectSubClass({ type, always = false }: {
    type: any, always?: boolean
  } = { type: undefined }) {
    return this.lazyInject({ type, always, subClass: true })
  }

}

export function getDecorators(ioc: IocContext = IocContext.DefaultInstance) {
  return new Decorators(ioc)
}
