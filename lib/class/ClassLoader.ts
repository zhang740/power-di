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
    protected implementCacheMap: Map<ExtendAndInterface, TypeWithInfo[]> = new Map()
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
    info = info || metadata.classInfo;
    if (!info.name) {
      info.name = type.name;
    }
    if (!info.extends?.length) {
      const superClasses = getSuperClassInfo(type);
      info.extends = superClasses.map(c => c.class);
    }
    this.classInfoMap.set(type, info);

    if (!info.implements) {
      info.implements = [];
    }

    // add cache
    [...info.extends, ...info.implements].forEach(ext => {
      const impls = this.getImplCacheByType(ext);
      if (impls.every(impl => impl.type !== type)) {
        impls.push({
          type,
          info,
        });
      }
    });
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

      this.classInfoMap.delete(type);
    }
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
    return new ClassLoader(
      new Map(this.classInfoMap),
      this.cloneImplCacheMap(this.implementCacheMap)
    );
  }

  /**
   * init maps from instance
   * @param classLoader source loader
   */
  initWith(classLoader: ClassLoader) {
    this.classInfoMap = new Map(classLoader.classInfoMap);
    this.implementCacheMap = this.cloneImplCacheMap(classLoader.implementCacheMap);
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
    return this.implementCacheMap.get(key);
  }
}

export const classLoader = new ClassLoader();
