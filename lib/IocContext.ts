import { getGlobalType, isClass } from './utils';
import { GetReturnType, RegKeyType, KeyType, ClassType } from './utils/types';
import { getMetadata, getMetadataField } from './class/metadata';
import { classLoader, TypeWithInfo, ClassLoader } from './class/ClassLoader';
import { guard } from './utils/guard';
import { genAspectWrapper } from './decorator/aspect';

export class Config {
  /** auto register class self, when class not found. default: false */
  autoRegisterSelf?: boolean = false;
  /** constructor inject, MUST in TypeScript with emitDecoratorMetadata and use decorator with class, default: true */
  constructorInject?: boolean = true;
  /** use class loader for autowired default: true */
  useClassLoader?: boolean | ClassLoader = true;
  /** when implement class not found */
  notFoundHandler?: (type: KeyType) => any;
  /** when have multi implement class */
  conflictHandler?: (type: KeyType, implCls: TypeWithInfo[], sourceCls?: TypeWithInfo) => ClassType | undefined;
  /** create instance hook, return value will replace instance */
  createInstanceHook?: (inst: any, ioc: IocContext) => any;
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
  factory: any;
  value: any;
  options: RegisterOptions;
}
export class IocContext {
  private static defaultInstance: IocContext;
  readonly classLoader = classLoader;
  private components = new Map<string, Store>();
  public static get DefaultInstance() {
    return this.defaultInstance ||
      (this.defaultInstance = new IocContext(), this.defaultInstance);
  }

  constructor(
    private config: Config = {}
  ) {
    this.config = Object.assign({}, new Config, config);
    if (config.useClassLoader instanceof ClassLoader) {
      this.classLoader = config.useClassLoader;
    }
  }

  public setConfig(config: Partial<Config>) {
    Object.assign(this.config, config);
  }

  public remove(keyOrType: KeyType) {
    return this.components.delete(getGlobalType(keyOrType));
  }

  public clear() {
    this.components.clear();
  }

  public get<T = undefined, KeyOrType = any>(keyOrType: KeyOrType, opt?: {
    forceNew?: boolean,
    sourceCls?: ClassType,
  }): GetReturnType<T, KeyOrType> {
    const key = getGlobalType(keyOrType);

    if (this.components.has(key)) {
      return this.returnValue(this.components.get(key), opt?.forceNew);
    }

    if (this.config.notFoundHandler) {
      const data = this.config.notFoundHandler(keyOrType as any);
      if (data !== undefined) {
        return data;
      }
    }

    if (this.config.useClassLoader) {
      const type = keyOrType as any;
      const classes = this.classLoader.getImplementClasses(type);
      switch (classes.length) {
        case 1:
          this.register(classes[0].type, type);
          return this.get(type, opt);

        case 0:
          break;

        default:
          if (this.config.conflictHandler) {
            const one = this.config.conflictHandler(type, classes, opt?.sourceCls ? {
              type: opt.sourceCls,
              info: classLoader.getClassInfo(opt.sourceCls),
            } : undefined);
            if (one !== undefined) {
              this.register(one, type);
              return this.get(type, opt);
            }
          }
          throw new MultiImplementError(type, key);
      }
    }

    const canAutoRegister = isClass(keyOrType) && (
      this.config.autoRegisterSelf ||
      getMetadata(keyOrType as any).injectable
    );
    if (canAutoRegister) {
      this.register(keyOrType);
      return this.get(keyOrType, opt);
    }

    throw new NotfoundTypeError(keyOrType, key);
  }

  public getImports<T = undefined, KeyOrType = any>(keyOrType: KeyOrType, { cache }: {
    cache?: boolean;
  } = {}): GetReturnType<T, KeyOrType>[] {
    const type = keyOrType as any;
    if (cache && this.has(type)) {
      return this.get(type);
    }
    const data = this.classLoader.getImplementClasses(type).map(clsInfo => {
      if (this.has(clsInfo.type)) {
        return this.get(clsInfo.type);
      }
      this.register(clsInfo.type);
      return this.get(clsInfo.type);
    });
    if (cache) {
      this.register(data, type);
    }
    return data;
  }

  public has(keyOrType: KeyType): boolean {
    return this.components.has(getGlobalType(keyOrType));
  }

  public replace(keyOrType: KeyType, newData: any, options?: RegisterOptions, registerIfNotExist = false) {
    const key = getGlobalType(keyOrType);
    const data = this.components.get(key);
    if (data) {
      data.inited = false;
      data.factory = this.genValueFactory(newData, options || data.options);
      data.value = undefined;
    } else if (registerIfNotExist) {
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

  public inject(instance: any, opt = {
    autoRunPostConstruct: true,
  }) {
    const iocSelf = this;
    const classType = instance.constructor;

    getMetadataField(classType, 'injects')
      .forEach(inject => {
        const { key, typeCls, optional, singleton } = inject;

        const descriptor = Object.getOwnPropertyDescriptor(instance, key);
        let defaultValue: any = descriptor && descriptor.value;
        const allowOptional = optional || defaultValue !== undefined;

        if ('inject' === inject.type) {
          Object.defineProperty(instance, key, {
            configurable: true,
            writable: true,
            value: guard(() => this.get(typeCls, {
              sourceCls: classType,
              ...singleton ? {} : { forceNew: true }
            }), {
              defaultValue,
              onError: (err) => {
                if (!allowOptional) {
                  err.message += `\n\tSource: ${classType.name}.${key.toString()}`;
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
                    return iocSelf.get(typeCls, {
                      sourceCls: classType,
                      ...singleton ? {} : { forceNew: true }
                    });
                  case 'imports':
                    return iocSelf.getImports(typeCls, { cache: !always });
                }
              }, {
                defaultValue,
                onError: (err) => {
                  hasErr = true;
                  if (!allowOptional) {
                    err.message += `\n\tSource: ${classType.name}.${key.toString()}`;
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

    getMetadataField(classType, 'aspects').forEach(aspect => {
      const oriFn = instance[aspect.key];
      const newFn = genAspectWrapper(this, aspect.point, oriFn);
      Object.defineProperty(instance, aspect.key, {
        configurable: true,
        value: newFn
      });
    });

    if (opt.autoRunPostConstruct) {
      this.runPostConstruct(instance);
    }
  }

  public runPostConstruct(instance: any) {
    const classType = instance.constructor;
    getMetadataField(classType, 'postConstruct').forEach(post => {
      instance[post.key]();
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
      factory: this.genValueFactory(data, options),
      value: undefined,
      options,
      subClasses: []
    } as Store;
  }

  private canBeKey(obj: any) {
    return obj instanceof Function || ['string', 'symbol'].includes(typeof obj);
  }

  private genValueFactory(data: any, options: RegisterOptions) {
    const dataIsFunction = data instanceof Function;
    const dataIsClass = dataIsFunction && isClass(data);

    return () => {
      if (dataIsFunction && options.autoNew) {
        if (dataIsClass) {
          const ClsType = data;
          let args: any[] = [];
          if (this.config.constructorInject && Reflect && Reflect.getMetadata) {
            const paramTypes = Reflect.getMetadata('design:paramtypes', ClsType);
            if (paramTypes) {
              args = paramTypes.map((type: any) => {
                if (type === ClsType ||
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
          const value = new ClsType(...args);
          this.inject(value);
          return this.config.createInstanceHook ? this.config.createInstanceHook(value, this) : value;
        } else {
          const func = data;
          return func(this);
        }
      } else {
        return data;
      }
    };
  }

  private returnValue(data: Store, forceNew = false) {
    if (data.options.singleton && !forceNew) {
      return data.inited ? data.value :
        (
          data.inited = true,
          data.value = data.factory(),
          data.value
        );
    } else {
      return data.factory();
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
