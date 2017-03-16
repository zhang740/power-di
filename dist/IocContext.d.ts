export declare const DefaultRegisterOption: RegisterOptions;
export interface RegisterOptions {
    /** Default:true */
    singleton?: boolean;
    /** if data a class, auto gen a instance, Default:true */
    autoNew?: boolean;
}
export declare type InterceptorType = () => void;
export declare type KeyType = Function | string | undefined;
export declare class IocContext {
    private static defaultInstance;
    private components;
    static readonly DefaultInstance: IocContext;
    remove(keyOrType: string | Function): boolean;
    get<T>(keyOrType: string | Function): T;
    replace<T>(keyOrType: string | Function, newData: any): void;
    register(data: any, key?: KeyType, options?: RegisterOptions): void;
    private genValue(dataIsFunction, options, data);
}
