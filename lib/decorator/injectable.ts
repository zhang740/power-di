import { classLoader } from '../class/ClassLoader';
import { getMetadata } from '../class/metadata';

/** can be inject */
export function injectable(): ClassDecorator {
  return target => {
    if (!classLoader.hasClass(target)) {
      classLoader.registerClass(target);
    }
  };
}
