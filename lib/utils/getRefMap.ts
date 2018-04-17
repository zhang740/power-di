import { getMetadata, getInjects } from './metadata'
import { getGlobalType } from './getGlobalType'

export interface RefMapType {
  [key: string]: RefMetadataType
}

export interface RefMetadataType {
  count: number
  deps: { type: string, prop: string }[]
}

export function getRefMap(clsType: any, initMaps = {}) {
  const maps: RefMapType = initMaps

  function scan(clsType: any) {
    const type = getGlobalType(clsType)
    if (maps[type]) {
      return
    }

    const refs: RefMetadataType = maps[type] = {
      count: 0,
      deps: [],
    }

    getInjects(clsType.prototype).forEach(inj => {
      scan(inj.typeCls)
      maps[inj.globalType].count++

      refs.deps.push({
        prop: inj.key,
        type: inj.globalType,
      })
    })
  }

  scan(clsType)
  return maps
}
