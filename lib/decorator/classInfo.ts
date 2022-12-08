import { ClassInfo, nameSymbol } from '../class';
import { getMetadata } from '../class/metadata';
import { classLoader } from '../class/ClassLoader';

export function classInfo(info: ClassInfo = {}): ClassDecorator {
  return target => {
    if (info.name) {
      Object.defineProperty(target, nameSymbol, {
        enumerable: false,
        writable: false,
        configurable: false,
        value: info.name,
      });
    }
    // prevent cache is incorrect
    if (classLoader.hasClass(target)) {
      classLoader.unregisterClass(target);
    }
    Object.assign(
      getMetadata(target).classInfo,
      {
        // default value
      } as ClassInfo,
      info
    );
    classLoader.registerClass(target);
  };
}
