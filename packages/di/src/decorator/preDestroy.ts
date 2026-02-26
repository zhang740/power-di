import { getMetadata } from '@power-di/class-loader';

/** run method before destroy instance */
export function preDestroy(): MethodDecorator {
  return (target, key) => {
    getMetadata(target.constructor).preDestroy.push({ key });
  };
}
