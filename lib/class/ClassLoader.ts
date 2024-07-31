import { ClassType, KeyType } from '../utils/types';
import { ClassInfo } from './ClassInfo';
import { getMetadata } from './metadata';
import { getGlobalType, getSuperClassInfo } from '../utils';

type ExtendAndInterface = KeyType;
export interface TypeWithInfo {
  type: ClassType;
  info: ClassInfo;
}

export class DuplicateRegistrationError extends Error {
  constructor(type: ClassType) {
    super(`Type ${type.name} is already registration.`);
  }
}

export class ClassLoader {
  constructor(
    protected classInfoMap: Map<ClassType, ClassInfo> = new Map(),
    protected implementCacheMap: Map<ExtendAndInterface, TypeWithInfo[]> = new Map(),
    public callback: {
      onRegisterClass?: (type: ClassType, info: ClassInfo) => void;
      onUnregisterClass?: (type: ClassType, info: ClassInfo) => void;
    } = {}
  ) {}

  /** has class */
  hasClass(type: ClassType) {
    return this.classInfoMap.has(type);
  }

  /** register class */
  registerClass(type: ClassType, info?: ClassInfo) {
    if (this.classInfoMap.has(type)) {
      throw new DuplicateRegistrationError(type);
    }
    const metadata = getMetadata(type);
    metadata.injectable = true;
    const clsInfo = info || metadata.classInfo;

    if (!clsInfo.name) {
      clsInfo.name = type.name;
    }
    if (!clsInfo.extends?.length) {
      const superClasses = getSuperClassInfo(type);
      clsInfo.extends = superClasses.map(c => c.class);
    }
    this.classInfoMap.set(type, clsInfo);

    if (!clsInfo.implements) {
      clsInfo.implements = [];
    }

    // add cache
    [...clsInfo.extends, ...clsInfo.implements].forEach(ext => {
      const impls = this.getImplCacheByType(ext);
      if (impls.every(impl => impl.type !== type)) {
        impls.push({
          type,
          info: clsInfo,
        });
      }
    });

    this.callback.onRegisterClass?.(type, clsInfo);
    return this;
  }

  /** unregister class */
  unregisterClass(type: ClassType) {
    const info = this.classInfoMap.get(type);
    if (info) {
      // remove from cache
      [...info.extends, ...info.implements].forEach(ext => {
        const cache = this.getImplCacheByType(ext);
        const index = cache.findIndex(c => c.type === type);
        /* istanbul ignore else */
        if (index >= 0) {
          cache.splice(index, 1);
        }
      });
      const ret = this.classInfoMap.delete(type);
      this.callback.onUnregisterClass?.(type, info);
      return ret;
    }
    return false;
  }

  /** get class info */
  getClassInfo(type: ClassType) {
    return this.classInfoMap.get(type);
  }

  /** filter classes by info */
  filterClasses(pattern: (info: TypeWithInfo) => boolean) {
    const classes: TypeWithInfo[] = [];
    this.classInfoMap.forEach((info, type) => {
      const typeWithInfo = { type, info };
      if (pattern(typeWithInfo)) {
        classes.push(typeWithInfo);
      }
    });
    return classes;
  }

  /** classes of extends/implements type */
  getImplementClasses(type: ExtendAndInterface) {
    return this.getImplCacheByType(type);
  }

  clearAll() {
    this.classInfoMap.clear();
    this.implementCacheMap.clear();
    return this;
  }

  /** return new instance from this */
  clone() {
    const Constructor = this.constructor as typeof ClassLoader;
    const newInst = new Constructor();
    newInst.initWith(this);
    return newInst;
  }

  /**
   * init maps from instance
   * @param oldLoader source loader
   */
  initWith(oldLoader: ClassLoader) {
    this.classInfoMap = new Map(oldLoader.classInfoMap);
    this.implementCacheMap = this.cloneImplCacheMap(oldLoader.implementCacheMap);
    this.callback = oldLoader.callback;
  }

  protected cloneImplCacheMap(map: Map<KeyType, TypeWithInfo[]>) {
    return new Map(Array.from(map.entries()).map(([k, v]) => [k, [...v]]));
  }

  protected getImplCacheByType(type: ExtendAndInterface): TypeWithInfo[] {
    const key = getGlobalType(type);
    if (!this.implementCacheMap.has(key)) {
      this.implementCacheMap.set(key, []);
      return this.getImplCacheByType(type);
    }
    return this.implementCacheMap.get(key)!;
  }
}

export const classLoader = new ClassLoader();
