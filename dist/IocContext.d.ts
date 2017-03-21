export declare const DefaultRegisterOption: RegisterOptions;
export interface RegisterOptions {
    /** default: true */
    singleton?: boolean;
    /** if data a class or function, auto new a instance. default: true */
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
export declare type RegKeyType = Function | string | undefined;
export declare class IocContext {
    private static defaultInstance;
    private components;
    static readonly DefaultInstance: IocContext;
    remove(keyOrType: string | Function): boolean;
    get<T>(keyOrType: string | Function): T;
    getSubClasses<T>(keyOrType: string | Function): T[];
    replace<T>(keyOrType: string | Function, newData: any, options?: RegisterOptions): void;
    append(keyOrType: string | Function, subData: any, options?: RegisterOptions): void;
    register(data: any, key?: RegKeyType, options?: RegisterOptions): void;
    private appendData(keyType, typeData, options, store);
    private newStore(data, options);
    private canBeKey(obj);
    private genValue(isFunction, options, data);
    private returnValue(data);
}
