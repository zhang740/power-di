export const metaSymbol = Symbol('power-di-metadata')
export interface InjectMetadataType {
  type: 'inject' | 'lazyInject',
  key: string,
  globalType: string,
  typeCls: any,
  /** with lazyInject */
  always?: boolean,
  /** with lazyInject */
  subClass?: boolean,
}
export class MetadataType {
  injects: InjectMetadataType[] = []
}

export function getMetadata(type: any): MetadataType {
  if (!type[metaSymbol]) {
    Object.defineProperty(type, metaSymbol, {
      enumerable: false,
      configurable: false,
      value: new MetadataType,
    })
  }
  return type[metaSymbol]
}
