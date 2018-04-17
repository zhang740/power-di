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
  const metadata = Object.getOwnPropertyDescriptor(type, metaSymbol)
  if (!metadata || !metadata.value) {
    Object.defineProperty(type, metaSymbol, {
      enumerable: false,
      configurable: false,
      value: new MetadataType,
    })
  }
  return type[metaSymbol]
}

export function getInjects(type: any): InjectMetadataType[] {
  const injects = getMetadata(type).injects
  const superType = Object.getPrototypeOf(type)
  if (superType) {
    return injects.concat(getInjects(superType))
  }
  return injects
}
