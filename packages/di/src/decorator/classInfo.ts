import type { ClassInfo } from '@power-di/class-loader';
import { classLoader, getMetadata, nameSymbol } from '@power-di/class-loader';

export function classInfo(info: ClassInfo = {}): ClassDecorator {
  return (target) => {
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
      info,
    );
    classLoader.registerClass(target);
  };
}
