import { getGlobalType } from './getGlobalType';

declare global {
  namespace Reflect {
    function getMetadata(metadataKey: any, target: Object): any;
    function getMetadata(metadataKey: any, target: Object, propertyKey: string | symbol): any;
  }
}

try {
  require('reflect-metadata');
} catch (error) {}

export function getReflectMetadata(metadataKey: any, target: Object, key?: string | symbol) {
  /* istanbul ignore else */
  if (Reflect && Reflect.getMetadata) {
    return Reflect.getMetadata(metadataKey, target, key);
  }
}

export function getClsTypeByDecorator(type: any, target: any, key: string | symbol) {
  if (type === undefined) {
    type = getReflectMetadata('design:type', target, key);
  }
  return type;
}

export function getGlobalTypeByDecorator(type: any, target: any, key: string | symbol) {
  return getGlobalType(getClsTypeByDecorator(type, target, key));
}
