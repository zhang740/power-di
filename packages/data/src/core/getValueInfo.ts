const infoSymbol = Symbol('ValueInfo');
/**
 * 获取信息
 *
 * @param symbol
 * @param obj
 * @param key
 * @param defaultValue
 */
export function getValueInfo(obj: Record<string | symbol, any>): {
  [key: string | symbol | number]: {
    value?: any;
  };
} {
  if (!obj[infoSymbol]) {
    Object.defineProperty(obj, infoSymbol, {
      value: {},
      enumerable: false,
    });
  }
  return obj[infoSymbol];
}
