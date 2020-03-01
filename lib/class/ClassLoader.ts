import { ClassType } from '../utils/types';
import { ClassInfo } from './ClassInfo';
import { getMetadata } from './metadata';
import { getSuperClassInfo } from '../utils';

type ExtendAndInterface = ClassType | symbol;
export interface TypeWithInfo {
  type: ClassType;
  info: ClassInfo;
}

export class DuplicateRegistrationError extends Error {
  constructor(type: ClassType) {
    super(`Type ${type.name} is already registration.`);
  }
}

class ClassLoader {
  private classInfoMap: Map<ClassType, ClassInfo> = new Map();
  private implementCacheMap: Map<ExtendAndInterface, TypeWithInfo[]> = new Map();

  /** register class */
  registerClass(type: ClassType) {
    if (this.classInfoMap.has(type)) {
      throw new DuplicateRegistrationError(type);
    }
    const info = getMetadata(type).classInfo;
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
      this.getImplCacheByType(ext).push({
        type,
        info,
      });
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

  /** get classes by info */
  getClassesByInfo(pattern: (info: TypeWithInfo) => boolean) {
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

  private getImplCacheByType(type: ExtendAndInterface): TypeWithInfo[] {
    if (!this.implementCacheMap.has(type)) {
      this.implementCacheMap.set(type, []);
      return this.getImplCacheByType(type);
    }
    return this.implementCacheMap.get(type);
  }
}

export const classLoader = new ClassLoader();
