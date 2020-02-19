import { ClassInfo } from '../class';
import { getMetadata } from '../class/metadata';
import { getSuperClassInfo } from '../utils';
import { classLoader } from '../class/ClassLoader';

export function classInfo(info: ClassInfo = {}): ClassDecorator {
  return target => {
    Object.assign(getMetadata(target).classInfo, {
      name: target.name,
      extends: getSuperClassInfo(target).map(c => c.class),
    } as ClassInfo, info);
    classLoader.registerClass(target);
  };
}
