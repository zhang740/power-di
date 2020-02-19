import { getGlobalTypeByDecorator, getClsTypeByDecorator } from '../utils';
import { getMetadata } from '../class/metadata';
import { KeyType } from '../utils/types';

/**
 * inject
 */
export function inject({ type, lazy = true, always = false, optional = false }: {
  type?: KeyType;
  /** lazy inject @default true */
  lazy?: boolean;
  /** always read from context. need lazy. @default false */
  always?: boolean;
  /** allow notfound. @default false */
  optional?: boolean;
} = {}): PropertyDecorator {
  return (target, key) => {
    getMetadata(target.constructor).injects.push({
      key,
      globalType: getGlobalTypeByDecorator(type, target, key),
      type: lazy ? 'lazyInject' : 'inject',
      always,
      typeCls: getClsTypeByDecorator(type, target, key),
      optional,
    });
  };
}
