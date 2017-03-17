export declare const DefaultRegisterOption: RegisterOptions;
export interface RegisterOptions {
    /** default: true */
    singleton?: boolean;
    /** if data a class, auto gen a instance. default: true */
    autoNew?: boolean;
    /**
     * register in superclass, you can get use superclass with getSubClasses method.
     * This setting is not inherited.
     * default: false
     * */
    regInSuperClass?: boolean;
}
export declare type InterceptorType = () => void;
export declare type KeyType = Function | string | undefined;
export declare class IocContext {
    private static defaultInstance;
    private components;
    static readonly DefaultInstance: IocContext;
    remove(keyOrType: string | Function): boolean;
    get<T>(keyOrType: string | Function): T;
    getSubClasses<T>(keyOrType: string | Function): T[];
    replace<T>(keyOrType: string | Function, newData: any, options?: RegisterOptions): void;
    register(data: any, key?: KeyType, options?: RegisterOptions): void;
    private genValue(dataIsFunction, options, data);
    private returnValue(data);
}
