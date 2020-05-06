export type ClassType = Function | (new (...args: any[]) => any);
export type KeyType = ClassType | Symbol | string;
export type RegKeyType = KeyType | undefined;
export type GetReturnType<T, ClsType> = T extends undefined ?
  ClsType extends { prototype: infer R } ? R
  : any
  : T;
