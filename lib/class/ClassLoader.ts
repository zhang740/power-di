import { ClassType } from '../utils/types';
import { ClassInfo } from './ClassInfo';
import { getMetadata } from './metadata';
import { getSuperClassInfo } from '../utils';

class ClassLoader {
  private classInfoMap: Map<ClassType, ClassInfo> = new Map();

  /** register class */
  registerClass(type: ClassType) {
    const info = getMetadata(type).classInfo;
    if (!info.extends?.length) {
      const superClasses = getSuperClassInfo(type);
      info.extends = superClasses.map(c => c.class);
    }
    this.classInfoMap.set(type, info);
    return this;
  }

  /** get class info */
  getClassInfo(type: ClassType) {
    return this.classInfoMap.get(type);
  }

  /** get classes by info */
  getClassesByInfo(pattern: (info: ClassInfo) => boolean) {
    const classes: ClassType[] = [];
    this.classInfoMap.forEach((info, key) => {
      if (pattern(info)) {
        classes.push(key);
      }
    });
    return classes;
  }

  /** classes of extends/implements type */
  getImplementClasses(type: ClassType | symbol) {
    return this.getClassesByInfo(
      info => [...info.extends, ...info.implements || []].includes(type)
    );
  }
}

export const classLoader = new ClassLoader();
