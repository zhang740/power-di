/**
 * getGlobalType
 * @param thisConstructor thisConstructor class or string.
 * @param prefix the prefix of type.
 */
export declare const getGlobalType: (classOrString: any, prefix?: string) => string;
export interface TypeInfo {
    type: string;
    class: Function;
}
export declare function getSuperClassInfo(classType: Function): TypeInfo[];
