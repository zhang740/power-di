import { getGlobalType } from './getGlobalType';

declare global {
  namespace Reflect {
    function getMetadata(metadataKey: any, target: object): any;
    function getMetadata(metadataKey: any, target: object, propertyKey: string | symbol): any;
  }
}

export function getReflectMetadata(metadataKey: any, target: object, key?: string | symbol) {
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
