import { getGlobalType, isClass, symbolString } from './utils';
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
  conflictHandler?: (
    type: KeyType,
    implCls: TypeWithInfo[],
    sourceCls?: TypeWithInfo
  ) => ClassType | undefined;
  /** create instance hook, return value will replace instance */
  createInstanceHook?: (inst: any, ioc: IocContext) => any;
  /** parent ioc context */
  parentContext?: IocContext;
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

/** ioc context */
export class IocContext {
  private static defaultInstance: IocContext;
  readonly classLoader = classLoader;
  private components = new Map<string | symbol, Store>();
  public static get DefaultInstance() {
    return (
      this.defaultInstance || ((this.defaultInstance = new IocContext()), this.defaultInstance)
    );
  }

  constructor(readonly config: Readonly<Config> = {}) {
    this.config = Object.assign({}, new Config(), config);
    if (config.useClassLoader instanceof ClassLoader) {
      this.classLoader = config.useClassLoader;
    }
  }

  /**
   * merge config
   * @param config new partial config
   */
  public setConfig(config: Partial<Config>) {
    Object.assign(this.config, config);
  }

  /**
   * remove instance of key
   * @param keyOrType key
   */
  public remove(keyOrType: KeyType) {
    const key = getGlobalType(keyOrType);
    if (this.components.has(key)) {
      this.preDestroyInstance(this.components.get(key));
    }
    return this.components.delete(key);
  }

  /** clear all */
  public clear() {
    Array.from(this.components.values()).forEach(ele => {
      this.preDestroyInstance(ele);
    });
    this.components.clear();
  }

  /**
   * get instance of key
   * @param keyOrType key
   * @param opt
   */
  public get<T = undefined, KeyOrType = any>(
    keyOrType: KeyOrType,
    opt: {
      /** always get new instance */
      forceNew?: boolean;
      /** source of invoke cls */
      sourceCls?: ClassType;
      /** use classLoader */
      useClassLoader?: boolean;
    } = {}
  ): GetReturnType<T, KeyOrType> {
    const key = getGlobalType(keyOrType);

    if (this.components.has(key)) {
      return this.returnValue(this.components.get(key), opt.forceNew);
    }

    if (this.config.notFoundHandler) {
      const data = this.config.notFoundHandler(keyOrType as any);
      if (data !== undefined) {
        return data;
      }
    }

    if (opt.useClassLoader || this.config.useClassLoader) {
      const type = keyOrType as any;
      const classes = this.classLoader.getImplementClasses(type);
      switch (classes.length) {
        case 1:
          // class loader is only responsible for matching and not for registration.
          return this.get(classes[0].type as any, opt);

        case 0:
          break;

        default:
          if (this.config.conflictHandler) {
            const one = this.config.conflictHandler(
              type,
              classes,
              opt.sourceCls
                ? {
                    type: opt.sourceCls,
                    info: classLoader.getClassInfo(opt.sourceCls),
                  }
                : undefined
            );
            if (one !== undefined) {
              // class loader is only responsible for matching and not for registration.
              return this.get(one as any, opt);
            }
          }
          // BaseClass has @injectable
          if (isClass(keyOrType) && getMetadata(type).injectable) {
            this.register(type);
            return this.get(type, opt);
          }
          throw new MultiImplementError(type, key);
      }
    }

    if (this.config.parentContext) {
      return this.config.parentContext.get(keyOrType);
    }

    const canAutoRegister =
      isClass(keyOrType) &&
      (this.config.autoRegisterSelf || getMetadata(keyOrType as any).injectable);
    if (canAutoRegister) {
      this.register(keyOrType);
      return this.get(keyOrType, opt);
    }

    throw new NotfoundTypeError(keyOrType, key);
  }

  /**
   * get instances for key
   * @param keyOrType key (super class or interface, use `@classInfo`)
   * @param opt
   */
  public getImports<T = undefined, KeyOrType = any>(
    keyOrType: KeyOrType,
    {
      cache,
    }: {
      /** peer cache */
      cache?: boolean;
    } = {}
  ): GetReturnType<T, KeyOrType>[] {
    const type = keyOrType as any;
    if (cache && this.has(type)) {
      return this.get(type);
    }
    const data = this.classLoader.getImplementClasses(type).map(clsInfo => {
      return this.get(clsInfo.type, {
        useClassLoader: true,
      });
    });
    if (cache) {
      this.register(data, type);
    }
    return data;
  }

  /**
   * instance of key in context
   * @param keyOrType key
   */
  public has(keyOrType: KeyType): boolean {
    return this.components.has(getGlobalType(keyOrType));
  }

  public replace(
    keyOrType: KeyType,
    newData: any,
    options?: RegisterOptions,
    registerIfNotExist = false
  ) {
    const key = getGlobalType(keyOrType);
    const data = this.components.get(key);
    if (data) {
      data.inited = false;
      data.factory = this.genValueFactory(newData, options || data.options);
      data.value = undefined;
    } else if (registerIfNotExist) {
      this.register(newData, keyOrType, options);
    } else {
      throw new NoRegistryError(key);
    }
  }

  /**
   * register key
   * @param data value of key (maybe instance, class, factory function or value)
   * @param key key
   * @param options register option
   */
  public register(data: any, key?: RegKeyType, options = DefaultRegisterOption) {
    if (key) {
      if (!this.canBeKey(key)) {
        throw new Error('key require string, symbol or class.');
      }
    } else {
      if (!this.canBeKey(data)) {
        throw new Error('when data is not string, symbol or class, require a key.');
      }
    }
    const dataType = (key && getGlobalType(key)) || (data && getGlobalType(data));

    if (this.components.has(dataType)) {
      throw new AlreadyRegistryError(dataType);
    }
    options = {
      ...DefaultRegisterOption,
      ...options,
    };
    const store: Store = this.newStore(data, options);
    this.components.set(dataType, store);
  }

  /**
   * complete instance inject
   * @param instance
   * @param opt
   */
  public inject(
    instance: any,
    opt = {
      autoRunPostConstruct: true,
    }
  ) {
    const iocSelf = this;
    const classType = instance.constructor;

    getMetadataField(classType, 'injects').forEach(inject => {
      const { key, typeCls, optional, singleton } = inject;

      const descriptor = Object.getOwnPropertyDescriptor(instance, key);
      let defaultValue: any = descriptor && descriptor.value;
      const allowOptional = optional || defaultValue !== undefined;

      if ('inject' === inject.type) {
        Object.defineProperty(instance, key, {
          configurable: true,
          writable: true,
          value: guard(
            () =>
              this.get(typeCls, {
                sourceCls: classType,
                ...(singleton ? {} : { forceNew: true }),
              }),
            {
              defaultValue,
              onError: err => {
                if (!allowOptional) {
                  err.message += `\n\tSource: ${classType.name}.${key.toString()}`;
                  throw err;
                }
              },
            }
          ),
        });
      }

      if (['lazyInject', 'imports'].includes(inject.type)) {
        const { always } = inject;
        Object.defineProperty(instance, key, {
          configurable: true,
          get: function () {
            let hasErr = false;
            const data = guard(
              () => {
                switch (inject.type) {
                  case 'lazyInject':
                    return iocSelf.get(typeCls, {
                      sourceCls: classType,
                      ...(singleton ? {} : { forceNew: true }),
                    });
                  case 'imports':
                    return iocSelf.getImports(typeCls, { cache: !always });
                }
              },
              {
                defaultValue,
                onError: err => {
                  hasErr = true;
                  if (!allowOptional) {
                    err.message += `\n\tSource: ${classType.name}.${key.toString()}`;
                    throw err;
                  }
                },
              }
            );
            if (!hasErr && !always) {
              Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                value: data,
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
          },
        });
      }
    });

    getMetadataField(classType, 'aspects').forEach(aspect => {
      const oriFn = instance[aspect.key];
      const newFn = genAspectWrapper(this, aspect.point, oriFn);
      Object.defineProperty(instance, aspect.key, {
        configurable: true,
        value: newFn,
      });
    });

    if (opt.autoRunPostConstruct) {
      this.runPostConstruct(instance);
    }
  }

  public runPostConstruct(instance: any) {
    const classType = instance.constructor;
    Array.from(new Set(getMetadataField(classType, 'postConstruct').map(p => p.key))).forEach(
      key => {
        instance[key]();
      }
    );
  }

  /**
   * create child context, inherit this context
   * @param config notFoundHandler is no useful
   */
  public createChildContext(config = this.config) {
    return new IocContext({
      ...config,
      parentContext: this,
    });
  }

  /**
   * run preDestroy method of instance
   * @param store instance store
   */
  private preDestroyInstance(store: Store) {
    if (!store.inited) {
      return;
    }
    const inst = store.value;
    Array.from(new Set(getMetadataField(inst.constructor, 'preDestroy').map(p => p.key))).forEach(
      key => {
        inst[key]();
      }
    );
  }

  private newStore(data: any, options: RegisterOptions) {
    return {
      inited: false,
      factory: this.genValueFactory(data, options),
      value: undefined,
      options,
    } as Store;
  }

  private canBeKey(obj: any) {
    const type = typeof obj;
    // ie11 symbol is object
    if (type === 'object') {
      return obj.toString() !== '[object Object]';
    }
    return ['function', 'string', 'symbol'].includes(type);
  }

  private genValueFactory(data: any, options: RegisterOptions) {
    const dataIsFunction = typeof data === 'function';
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
                if (
                  type === ClsType ||
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
          return this.config.createInstanceHook
            ? this.config.createInstanceHook(value, this)
            : value;
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
      return data.inited
        ? data.value
        : ((data.inited = true), (data.value = data.factory()), data.value);
    } else {
      // TODO use WeakMap collection for destroy
      return data.factory();
    }
  }

  toJSON() {
    return { type: 'power-di.IocContext', message: 'NoSerializable' };
  }
}

export class MultiImplementError extends Error {
  constructor(type: ClassType, key: string | symbol) {
    super(`Has multi Classes of implement type: ${type.name}(${symbolString(key)})`);
  }
}

export class NotfoundTypeError extends Error {
  constructor(type: any, key: string | symbol) {
    super(`Notfound type: ${type.name || type}(${symbolString(key)})`);
  }
}

export class NoRegistryError extends Error {
  constructor(key: string | symbol) {
    super(`the key:[${symbolString(key)}] is no registry.`);
  }
}

export class AlreadyRegistryError extends Error {
  constructor(key: string | symbol) {
    super(`the key:[${symbolString(key)}] is already registry.`);
  }
}
