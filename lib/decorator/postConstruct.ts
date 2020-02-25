import { getMetadata } from '../class/metadata';

/** run method after create instance */
export function postConstruct(): MethodDecorator {
  return (target, key) => {
    getMetadata(target.constructor).postConstruct.push({ key });
  };
}
