import { getMetadata } from '@power-di/class-loader';

/** run method after create instance */
export function postConstruct(): MethodDecorator {
  return (target, key) => {
    getMetadata(target.constructor).postConstruct.push({ key });
  };
}
