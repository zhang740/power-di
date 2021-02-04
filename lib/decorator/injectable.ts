import { classLoader } from '../class/ClassLoader';

/** can be inject */
export function injectable(): ClassDecorator {
  return target => {
    if (!classLoader.hasClass(target)) {
      classLoader.registerClass(target);
    }
  };
}
