import { isClass, getGlobalType } from './getGlobalType';

export interface TypeInfo {
  type: string | symbol;
  class: Function;
}

export function getSuperClassInfo(classType: Function) {
  if (!isClass(classType)) {
    throw new Error('need a classType.');
  }
  const superClasses: TypeInfo[] = [];
  let tmpType = Object.getPrototypeOf(classType);
  while (isClass(tmpType)) {
    const type = getGlobalType(tmpType);
    superClasses.push({
      type,
      class: tmpType
    });
    tmpType = Object.getPrototypeOf(tmpType);
  }
  return superClasses;
}
