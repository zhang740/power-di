export const proxyToRaw = new WeakMap();
export const rawToProxy = new WeakMap();

export function isObservable(obj: any) {
  return proxyToRaw.has(obj);
}

export function raw(obj: any) {
  return proxyToRaw.get(obj) || obj;
}
