import { getGlobalType } from '../utils/getGlobalType'

export function getClsTypeByDecorator(
  type: any, target: any, key: string
) {
  if (!type && Reflect && Reflect.getMetadata) {
    type = Reflect.getMetadata('design:type', target, key)
  }
  return type
}

export function getGlobalTypeByDecorator(
  type: any, target: any, key: string
) {
  return getGlobalType(getClsTypeByDecorator(type, target, key))
}
