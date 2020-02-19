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

export class MetadataType {
  injectable: boolean;
  classInfo: ClassInfo = {};
  injects: InjectMetadataType[] = [];
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

export function getInjects(type: ClassType): InjectMetadataType[] {
  const injects = getMetadata(type).injects;
  const superType = Object.getPrototypeOf(type);
  if (superType) {
    return injects.concat(getInjects(superType));
  }
  return injects;
}
