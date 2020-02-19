import 'reflect-metadata';
import { getGlobalType } from './getGlobalType';

export function getClsTypeByDecorator(
  type: any, target: any, key: string | symbol
) {
  if (!type && Reflect && Reflect.getMetadata) {
    type = Reflect.getMetadata('design:type', target, key);
  }
  return type;
}

export function getGlobalTypeByDecorator(
  type: any, target: any, key: string | symbol
) {
  return getGlobalType(getClsTypeByDecorator(type, target, key));
}
