import { classLoader } from '../class/ClassLoader';
import { getMetadata } from '../class/metadata';

export function injectable(): ClassDecorator {
  return target => {
    getMetadata(target).injectable = true;
    classLoader.registerClass(target);
  };
}
