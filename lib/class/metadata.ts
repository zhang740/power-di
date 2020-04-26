import { ClassInfo } from './ClassInfo';
import { ClassType } from '../utils/types';
import { IocContext } from '../IocContext';

export const metaSymbol = Symbol('power-di-metadata');
export interface InjectMetadataType {
  type: 'inject' | 'lazyInject' | 'imports';
  key: string | symbol;
  globalType: string;
  typeCls: ClassType;
  singleton?: boolean;
  /** with lazyInject */
  always?: boolean;
  optional?: boolean;
}

export interface PostConstructMetadataType {
  key: string | symbol;
}

export interface FunctionContext<T extends Object = {}, K = {}> {
  readonly ioc: IocContext;
  readonly inst: K;
  readonly functionName: string;
  data: Partial<T>;
  args: any[];
  ret: any;
  err: Error;
}

export interface AspectPoint<T = any> {
  before?: (context: FunctionContext<T>) => void;
  after?: (context: FunctionContext<T>) => void;
  error?: (context: FunctionContext<T>) => void;
}

export class MetadataType {
  injectable: boolean;
  classInfo: ClassInfo = {
    extends: [],
    implements: [],
  };
  injects: InjectMetadataType[] = [];
  postConstruct: PostConstructMetadataType[] = [];
  aspects: { key: string | symbol; point: AspectPoint; }[] = [];
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
