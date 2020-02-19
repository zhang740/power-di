export type ClassType = Function | (new (...args: any[]) => any);
export type InterceptorType = () => void;
export type KeyType = Function | Symbol | string;
export type RegKeyType = KeyType | undefined;
export type GetReturnType<T, ClsType> = T extends undefined ?
  (ClsType extends new (...args: any[]) => infer R ? R : any)
  : T;
