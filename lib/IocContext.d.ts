export declare const DefaultRegisterOption: RegisterOptions;
export interface RegisterOptions {
    /** default: true */
    singleton?: boolean;
    /** if data a class, auto new a instance.
     *  if data a function, auto run(lazy).
     *  default: true */
    autoNew?: boolean;
    /**
     * register in superclass, you can get use superclass with getSubClasses method.
     * This setting is not inherited.
     * default: false
     * */
    regInSuperClass?: boolean;
}
export declare type InterceptorType = () => void;
export declare type KeyType = Function | string;
export declare type RegKeyType = KeyType | undefined;
export declare class IocContext {
    private static defaultInstance;
    private components;
    static readonly DefaultInstance: IocContext;
    remove(keyOrType: KeyType): boolean;
    get<T>(keyOrType: KeyType): T;
    getSubClasses<T>(keyOrType: KeyType): T[];
    replace<T>(keyOrType: KeyType, newData: any, options?: RegisterOptions): void;
    append(keyOrType: KeyType, subData: any, options?: RegisterOptions): void;
    register(data: any, key?: RegKeyType, options?: RegisterOptions): void;
    private appendData(keyType, typeData, options, store);
    private newStore(data, options);
    private canBeKey(obj);
    private genValue(data, options);
    private returnValue(data);
}
