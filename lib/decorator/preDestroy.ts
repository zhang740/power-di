import { getMetadata } from '../class/metadata';

/** run method before destroy instance */
export function preDestroy(): MethodDecorator {
  return (target, key) => {
    getMetadata(target.constructor).preDestroy.push({ key });
  };
}
