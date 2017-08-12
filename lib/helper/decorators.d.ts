import { IocContext, RegisterOptions, KeyType, RegKeyType } from '../IocContext';
export declare class Decorators {
    private context;
    constructor(ioc?: IocContext);
    /**
     * register class
     * @param target need a class
     * @param options RegisterOptions
     */
    register(key?: RegKeyType, options?: RegisterOptions): (target: any) => void;
    /**
     * register subClass, the abbreviation of register
     * @param target need a class
     * @param options RegisterOptions
     */
    registerSubClass(key?: RegKeyType, options?: RegisterOptions): (target: any) => void;
    /**
     * append class to subClass list by key
     * @param key class or string
     * @param options RegisterOptions
     */
    append(key?: KeyType, options?: RegisterOptions): (target: any) => void;
    /**
     * inject
     * @param type class or string
     */
    inject(type: any): (target: any, key: any) => void;
    /**
     * lazy inject
     * @param type class or string
     * @param always always read from context. default: false
     * @param subClass getSubClasses. default: false
     */
    lazyInject(type: any, always?: boolean, subClass?: boolean): (target: any, key: any) => void;
    /**
     * lazy inject subClass, the abbreviation of lazy inject
     * @param type class or string
     * @param always always read from context. default: false
     */
    lazyInjectSubClass(type: any, always?: boolean): (target: any, key: any) => void;
}
export declare function getDecorators(ioc?: IocContext): Decorators;
