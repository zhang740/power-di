export declare function isClass(target: any): boolean;
/**
 * getGlobalType
 * @param classOrString class or string.
 * @param prefix the prefix of type.
 */
export declare function getGlobalType(classOrString: any, prefix?: string): string;
export interface TypeInfo {
    type: string;
    class: Function;
}
export declare function getSuperClassInfo(classType: Function): TypeInfo[];
export declare function isExtendOf(classType: Function, superClassType: Function): boolean;
