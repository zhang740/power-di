import { ClassType, KeyType } from '../utils/types';
import { ClassInfo } from './ClassInfo';
import { getMetadata } from './metadata';
import { getSuperClassInfo } from '../utils';

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
  private classInfoMap: Map<ClassType, ClassInfo> = new Map();
  private implementCacheMap: Map<ExtendAndInterface, TypeWithInfo[]> = new Map();

  /** has class */
  hasClass(type: ClassType) {
    return this.classInfoMap.has(type);
  }

  /** register class */
  registerClass(type: ClassType, info?: ClassInfo) {
    if (this.classInfoMap.has(type)) {
      throw new DuplicateRegistrationError(type);
    }
    info = info || getMetadata(type).classInfo;
    if (!info.name) {
      info.name = type.name;
    }
    if (!info.extends.length) {
      const superClasses = getSuperClassInfo(type);
      info.extends = superClasses.map(c => c.class);
    }
    this.classInfoMap.set(type, info);

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

  private getImplCacheByType(type: ExtendAndInterface): TypeWithInfo[] {
    if (!this.implementCacheMap.has(type)) {
      this.implementCacheMap.set(type, []);
      return this.getImplCacheByType(type);
    }
    return this.implementCacheMap.get(type);
  }
}

export const classLoader = new ClassLoader();
