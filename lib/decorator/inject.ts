import { getGlobalTypeByDecorator, getClsTypeByDecorator } from '../utils';
import { getMetadata } from '../class/metadata';
import { KeyType } from '../utils/types';

/**
 * inject
 */
export function inject({
  type,
  lazy = true,
  always,
  optional,
  singleton = true,
}: {
  type?: KeyType;
  /** lazy inject @default true */
  lazy?: boolean;
  /** single instance. @default true */
  singleton?: boolean;
  /** always read from context. need lazy. @default false */
  always?: boolean;
  /** allow notfound. @default false */
  optional?: boolean;
} = {}): PropertyDecorator {
  return (target, key) => {
    const typeCls = getClsTypeByDecorator(type, target, key);
    if (typeCls === undefined || typeCls === Object) {
      throw new Error(
        `CANNOT inject undefined! source: ${target.constructor.name}.${key.toString()}`
      );
    }
    getMetadata(target.constructor).injects.push({
      key,
      globalType: getGlobalTypeByDecorator(type, target, key),
      type: lazy ? 'lazyInject' : 'inject',
      always,
      typeCls,
      optional,
      singleton,
    });
  };
}
