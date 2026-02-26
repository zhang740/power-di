import { getMetadataField } from '../class/metadata';
import { getGlobalType, symbolString } from './getGlobalType';

export interface RefMapType {
  [key: string]: RefMetadataType;
}

export interface RefMetadataType {
  count: number;
  deps: { type: string; prop: string | symbol }[];
}

export function getRefMap(clsType: any, initMaps = {}) {
  const maps: RefMapType = initMaps;

  function scan(clsType: any) {
    const type = symbolString(getGlobalType(clsType));
    if (maps[type]) {
      return;
    }

    const refs: RefMetadataType = (maps[type] = {
      count: 0,
      deps: [],
    });

    getMetadataField(clsType, 'injects').forEach((inj) => {
      const globalType = symbolString(inj.globalType);
      scan(inj.typeCls);
      maps[globalType].count++;

      refs.deps.push({
        prop: inj.key,
        type: globalType,
      });
    });
  }

  scan(clsType);
  return maps;
}
