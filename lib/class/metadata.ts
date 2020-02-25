import { ClassInfo } from './ClassInfo';
import { ClassType } from '../utils/types';

export const metaSymbol = Symbol('power-di-metadata');
export interface InjectMetadataType {
  type: 'inject' | 'lazyInject' | 'imports';
  key: string | symbol;
  globalType: string;
  typeCls: ClassType;
  /** with lazyInject */
  always?: boolean;
  optional?: boolean;
}

export interface PostConstructMetadataType {
  key: string | symbol;
}

export class MetadataType {
  injectable: boolean;
  classInfo: ClassInfo = {};
  injects: InjectMetadataType[] = [];
  postConstruct: PostConstructMetadataType[] = [];
}

export function getMetadata(type: ClassType): MetadataType {
  const metadata = Object.getOwnPropertyDescriptor(type, metaSymbol);
  if (!metadata || !metadata.value) {
    Object.defineProperty(type, metaSymbol, {
      enumerable: false,
      configurable: false,
      value: new MetadataType,
    });
    return getMetadata(type);
  }
  return metadata.value;
}

export function getMetadataField<T extends keyof MetadataType>(type: ClassType, key: T): MetadataType[T] {
  const field = getMetadata(type)[key];
  const superType = Object.getPrototypeOf(type);
  if (superType && Array.isArray(field)) {
    return field.concat(getMetadataField(superType, key)) as any;
  }
  return field;
}
