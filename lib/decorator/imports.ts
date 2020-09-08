import { getGlobalType, getClsTypeByDecorator } from '../utils';
import { getMetadata } from '../class/metadata';
import { KeyType } from '../utils/types';

/** subClasses/implements inject */
export function imports({ type, always = false }: {
  type: KeyType;
  /** always read from context. need lazy. @default false */
  always?: boolean;
}): PropertyDecorator {
  return (target, key) => {
    // if (getClsTypeByDecorator(undefined, target, key) !== Array) {
    //   throw new Error(`${target.constructor.name}.${key.toString()}'s type need 'Array<T>' or 'T[]'.`);
    // }
    getMetadata(target.constructor).injects.push({
      key,
      globalType: getGlobalType(type),
      type: 'imports',
      always,
      typeCls: type,
    });
  };
}
