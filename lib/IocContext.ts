import { getGlobalType, isClass } from './utils';
import { logger } from '../utils';
import { GetReturnType, RegKeyType, KeyType, ClassType } from './utils/types';
import { getInjects, getMetadata } from './class/metadata';
import { classLoader } from './class/ClassLoader';
import { guard } from './utils/guard';

export class Config {
  /** auto register class self, when class not found. default: false */
  autoRegisterSelf?: boolean = false;
  /** constructor inject, MUST in TypeScript with emitDecoratorMetadata and use decorator with class, default: true */
  constructorInject?: boolean = true;
  /** use class loader for autowired default */
  useClassLoader?: boolean = true;
  notFoundHandler?: (type: KeyType) => any;
}

export const DefaultRegisterOption: RegisterOptions = {
  singleton: true,
  autoNew: true,
};

export interface RegisterOptions {
  /** default: true */
  singleton?: boolean;
  /** if data a class, auto new a instance.
   *  if data a function, auto run(lazy).
   *  default: true */
  autoNew?: boolean;
}
export interface Store {
  inited: boolean;
  value: any;
  options: RegisterOptions;
}
export class IocContext {
  private static defaultInstance: IocContext;
  private components = new Map<string, Store>();
  public static get DefaultInstance() {
    return this.defaultInstance ||
      (this.defaultInstance = new IocContext(), this.defaultInstance);
  }

  constructor(
    private config = new Config
  ) {
  }

  public remove(keyOrType: KeyType) {
    return this.components.delete(getGlobalType(keyOrType));
  }

  public clear() {
    this.components.clear();
  }

  public get<T = undefined, KeyOrType = any>(keyOrType: KeyOrType): GetReturnType<T, KeyOrType> {
    const key = getGlobalType(keyOrType);

    if (this.components.has(key)) {
      return this.returnValue(this.components.get(key));
    }

    if (this.config.notFoundHandler) {
      const data = this.config.notFoundHandler(keyOrType as any);
      if (data) {
        return data;
      }
    }

    if (this.config.useClassLoader) {
      const type = keyOrType as any;
      const classes = classLoader.getImplementClasses(type);
      switch (classes.length) {
        case 1:
          this.register(classes[0], type);
          return this.get(type);

        case 0:
          break;

        default:
          throw new MultiImplementError(type, key);
      }
    }

    const canAutoRegister = isClass(keyOrType) && (
      this.config.autoRegisterSelf ||
      getMetadata(keyOrType as any).injectable
    );
    if (canAutoRegister) {
      this.register(keyOrType);
      return this.get(keyOrType);
    }

    throw new NotfoundTypeError(keyOrType, key);
  }

  public getImports<T = undefined, KeyOrType = any>(keyOrType: KeyOrType, { cache }: {
    cache?: boolean;
  } = {}): GetReturnType<T, KeyOrType>[] {
    const key = getGlobalType(keyOrType);
    if (this.has(key)) {
      return this.get(key);
    } else {
      const type = keyOrType as any;
      const data = classLoader.getImplementClasses(type).map(cls => {
        if (this.has(cls)) {
          return this.get(cls);
        }
        return this.genValueFactory(cls)();
      });
      if (cache) {
        this.register(data, key);
      }
      return data;
    }
  }

  public has(keyOrType: KeyType): boolean {
    return this.components.has(getGlobalType(keyOrType));
  }

  public replace(keyOrType: KeyType, newData: any, options?: RegisterOptions, force = false) {
    const key = getGlobalType(keyOrType);
    const data = this.components.get(key);
    if (data) {
      data.inited = false;
      data.value = this.genValueFactory(newData, options || data.options);
    } else if (force) {
      this.register(newData, keyOrType, options);
    } else {
      throw new Error(`the key:[${key}] is not register.`);
    }
  }

  public register(data: any, key?: RegKeyType, options = DefaultRegisterOption) {
    if (key) {
      if (!this.canBeKey(key)) {
        throw new Error('key require a string or a class.');
      }
    } else {
      if (!this.canBeKey(data)) {
        throw new Error('when data is not a class or string, require a key.');
      }
    }
    const dataType = (key && getGlobalType(key)) || (data && getGlobalType(data));

    if (this.components.has(dataType)) {
      throw new Error(`the key:[${dataType}] is already register.`);
    }
    options = {
      ...DefaultRegisterOption,
      ...options,
    };
    const store: Store = this.newStore(data, options);
    this.components.set(dataType, store);
  }

  public inject(instance: any) {
    const iocSelf = this;
    const classType = instance.constructor;
    getInjects(classType)
      .forEach(inject => {
        const { key, typeCls, optional } = inject;

        const descriptor = Object.getOwnPropertyDescriptor(instance, key);
        let defaultValue: any = descriptor && descriptor.value;
        const allowOptional = optional || defaultValue !== undefined;

        if ('inject' === inject.type) {
          Object.defineProperty(instance, key, {
            configurable: true,
            writable: true,
            value: guard(() => this.get(typeCls), {
              defaultValue,
              onError: (err) => {
                if (!allowOptional) {
                  err.message += `\n\tSource: ${classType.name || classType}.${key.toString()}`;
                  throw err;
                }
              }
            }),
          });
        }

        if (['lazyInject', 'imports'].includes(inject.type)) {
          const { always } = inject;
          Object.defineProperty(instance, key, {
            configurable: true,
            get: function () {
              let hasErr = false;
              const data = guard(() => {
                switch (inject.type) {
                  case 'lazyInject':
                    return iocSelf.get(typeCls);
                  case 'imports':
                    return iocSelf.getImports(typeCls, { cache: !always });
                }
              }, {
                defaultValue,
                onError: (err) => {
                  hasErr = true;
                  if (!allowOptional) {
                    err.message += `\n\tSource: ${classType.name || classType}.${key.toString()}`;
                    throw err;
                  }
                }
              });
              if (!hasErr && !always) {
                Object.defineProperty(this, key, {
                  configurable: true,
                  writable: true,
                  value: data
                });
              }
              return data;
            },
            set: function (value) {
              Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                value,
              });
            }
          });
        }
      });
  }

  public createChildContext(config = this.config) {
    return new IocContext({
      ...config,
      notFoundHandler: type => this.get(type)
    });
  }

  private newStore(data: any, options: RegisterOptions) {
    return {
      inited: false,
      value: this.genValueFactory(data, options),
      options,
      subClasses: []
    } as Store;
  }

  private canBeKey(obj: any) {
    return obj instanceof Function || ['string', 'symbol'].includes(typeof obj);
  }

  private genValueFactory(data: any, options: RegisterOptions = DefaultRegisterOption) {
    const dataIsFunction = data instanceof Function;
    const dataIsClass = dataIsFunction && isClass(data);

    return () => {
      if (dataIsFunction && options.autoNew) {
        if (dataIsClass) {
          let args: any[] = [this];
          if (this.config.constructorInject && Reflect && Reflect.getMetadata) {
            const paramTypes = Reflect.getMetadata('design:paramtypes', data);
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
                  return null;
                }
                return this.get(type);
              });
            }
          }
          const value = new data(...args);
          this.inject(value);
          return value;
        } else {
          return data(this);
        }
      } else {
        return data;
      }
    };
  }

  private returnValue(data: Store) {
    if (data.options.singleton) {
      return data.inited ? data.value :
        (
          data.inited = true,
          data.value = data.value(),
          data.value
        );
    } else {
      return data.value();
    }
  }
}

export class MultiImplementError extends Error {
  constructor(type: ClassType, key: string) {
    super(`Has multi Classes of implement type: ${type.name}(${key})`);
  }
}

export class NotfoundTypeError extends Error {
  constructor(type: any, key: string) {
    super(`Notfound type: ${type.name || type}(${key})`);
  }
}
