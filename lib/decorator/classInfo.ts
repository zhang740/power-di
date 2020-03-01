import { ClassInfo } from '../class';
import { getMetadata } from '../class/metadata';
import { classLoader } from '../class/ClassLoader';

export function classInfo(info: ClassInfo = {}): ClassDecorator {
  return target => {
    Object.assign(getMetadata(target).classInfo, {
    } as ClassInfo, info);
    classLoader.registerClass(target);
  };
}
