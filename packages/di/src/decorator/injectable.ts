import { classLoader } from '@power-di/class-loader';

/** can be inject */
export function injectable(): ClassDecorator {
  return (target) => {
    if (!classLoader.hasClass(target)) {
      classLoader.registerClass(target);
    }
  };
}
