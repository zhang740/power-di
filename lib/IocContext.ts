import { getGlobalType, getReflectMetadata, isClass, symbolString } from './utils';
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
  useClassLoader?: ClassLoader | boolean = true;
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
  /** create new instance in this context when is not exist */
  newInstanceInThisContext?: boolean;
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
  private _classLoader?: ClassLoader;
  public get classLoader() {
    return this._classLoader;
  }

  private components = new Map<string | symbol, Store>();
  public static get DefaultInstance() {
    return (
      this.defaultInstance || ((this.defaultInstance = new IocContext()), this.defaultInstance)
    );
  }

  constructor(readonly config: Readonly<Config> = {}) {
    this.setConfig(Object.assign(new Config(), config));
  }

  /**
   * merge config
   * @param config new partial config
   */
  public setConfig(config: Partial<Config>) {
    Object.assign(this.config, config);
    this._classLoader =
      this.config.useClassLoader === true
        ? classLoader
        : this.config.useClassLoader === false
        ? undefined
        : this.config.useClassLoader;
  }

  /**
   * remove instance of key
   * @param keyOrType key
   */
  public remove(keyOrType: KeyType) {
    const key = getGlobalType(keyOrType);
    const store = this.components.get(key);
    if (store) {
      this.preDestroyInstance(store);
      return this.components.delete(key);
    }
    return false;
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
      /** use classLoader */
      useClassLoader?: boolean;
      /** source of invoke cls */
      sourceCls?: ClassType;
      /** source of type */
      sourceType?: KeyOrType;
      /** deep get from parent context, default: true */
      deep?: boolean;
    } = {}
  ): GetReturnType<T, KeyOrType> {
    const key = getGlobalType(keyOrType);

    const store = this.components.get(key);
    if (store) {
      return this.returnValue(store, opt.forceNew);
    }

    if (this.config.notFoundHandler) {
      const data = this.config.notFoundHandler(keyOrType as any);
      if (data !== undefined) {
        return data;
      }
    }

    if (opt.useClassLoader !== false && this.classLoader) {
      const target = this.findClassByClassLoader(keyOrType as any, key, {
        sourceCls: opt.sourceCls,
        deep: opt.deep !== false,
      });
      if (target) {
        if (target.base) {
          this.register(target.type);
        }

        return this.get(target.type as any, {
          ...(target.ref
            ? {
                ...opt,
                sourceType: opt.sourceType || keyOrType,
              }
            : opt),
          useClassLoader: target.final ? false : true,
        });
      }
    }

    if (this.config.parentContext && opt.deep !== false) {
      if (!this.config.newInstanceInThisContext || this.config.parentContext.has(key, true, true)) {
        return this.config.parentContext.get(opt.sourceType || keyOrType, opt);
      }
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

  protected resolveConflict(
    type: KeyType,
    classes: TypeWithInfo[],
    sourceCls?: TypeWithInfo,
    deep?: boolean
  ): ClassType | undefined {
    if (this.config.conflictHandler) {
      const one = this.config.conflictHandler(type, classes, sourceCls);
      if (one !== undefined) {
        return one;
      }
    }
    if (deep) {
      return this.config.parentContext?.resolveConflict(type, classes, sourceCls);
    }
  }

  private findClassByClassLoader(
    type: KeyType,
    key: string | symbol,
    opt: {
      sourceCls?: ClassType;
      deep?: boolean;
    }
  ) {
    const classes = this.classLoader.getImplementClasses(type);

    if (classes.length === 0) {
      return;
    }

    if (classes.length === 1) {
      // class loader is only responsible for matching and not for registration.
      return { type: classes[0].type, ref: true };
    }

    // if an instance of one of the classes already exists, the match takes precedence
    const instances = classes.filter(ele => this.has(ele.type, true));
    if (instances.length === 1) {
      return { type: instances[0].type, final: true };
    }

    const resolved = this.resolveConflict(
      type,
      classes,
      opt.sourceCls
        ? {
            type: opt.sourceCls,
            info: this.classLoader.getClassInfo(opt.sourceCls),
          }
        : undefined,
      opt.deep
    );
    if (resolved !== undefined) {
      return { type: resolved, final: true };
    }

    // BaseClass has @injectable
    if (this.isInjectableBaseClass(type)) {
      return { type, base: true };
    }

    throw new MultiImplementError(type as any, key);
  }

  private isInjectableBaseClass(type: KeyType) {
    return isClass(type) && getMetadata(type).injectable;
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
      deep,
    }: {
      /** peer cache */
      cache?: boolean;
    } & Partial<Pick<Parameters<IocContext['get']>[1], 'deep'>> = {}
  ): GetReturnType<T, KeyOrType>[] {
    const type = keyOrType as any;
    if (cache && this.has(type)) {
      return this.get(type);
    }
    if (!this.classLoader) {
      return [];
    }
    const data = this.classLoader.getImplementClasses(type).map(clsInfo => {
      return this.get(clsInfo.type, { useClassLoader: false, deep });
    });
    if (cache) {
      this.register(data, type);
    }
    return data;
  }

  /**
   * instance of key in context
   * @param keyOrType key
   * @param deep deep search from parent context
   * @param useClassLoader use classLoader
   */
  public has(keyOrType: KeyType, deep = false, useClassLoader = false): boolean {
    const key = getGlobalType(keyOrType);

    if (this.components.has(key)) {
      return true;
    }

    if (useClassLoader && this.config.useClassLoader && this.classLoader) {
      const target = this.findClassByClassLoader(keyOrType, key, {
        deep,
      });
      if (target) {
        return this.has(target.type, deep);
      }
    }

    if (deep && this.config.parentContext) {
      return this.config.parentContext.has(key, deep);
    }

    return false;
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
      this.components.set(key, this.newStore(newData, options || data.options));
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
    Array.from(
      new Set(getMetadataField(instance.constructor, 'postConstruct').map(p => p.key))
    ).forEach(key => {
      instance[key]();
    });
  }

  public runPreDestroy(instance: any) {
    Array.from(
      new Set(getMetadataField(instance.constructor, 'preDestroy').map(p => p.key))
    ).forEach(key => {
      instance[key]();
    });
  }

  /**
   * create child context, inherit this context
   * @param config
   */
  public createChildContext(config?: Config) {
    return new IocContext({
      ...this.config,
      ...(config || {}),
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
    this.runPreDestroy(store.value);
  }

  private newStore(data: any, options: RegisterOptions) {
    const dataIsFunction = typeof data === 'function';
    const dataIsClass = dataIsFunction && isClass(data);
    const needFactory = dataIsFunction && options.autoNew;
    return {
      inited: needFactory ? false : true,
      factory: needFactory
        ? () => {
            if (dataIsClass) {
              const ClsType = data;
              let args: any[] = [];
              if (this.config.constructorInject) {
                const paramTypes = getReflectMetadata('design:paramtypes', ClsType);
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
          }
        : undefined,
      value: needFactory ? undefined : data,
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
    super(`Notfound type: ${type.name || symbolString(type)}(${symbolString(key)})`);
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
