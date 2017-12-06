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
     * type: class or string
     * @param {{ type: any }} { type }
     * @returns
     * @memberof Decorators
     */
    inject({type}?: {
        type?: any;
    }): (target: any, key: string) => void;
    /**
     * lazy inject
     * type: class or string
     * always: always read from context. default: false
     * subClass: getSubClasses. default: false
     * @param {{ type: any, always: boolean, subClass: boolean }} { type, always = false, subClass = false }
     * @returns
     * @memberof Decorators
     */
    lazyInject({type, always, subClass}?: {
        type?: any;
        always?: boolean;
        subClass?: boolean;
    }): (target: any, key: string) => void;
    /**
     * lazy inject subClass, the abbreviation of lazy inject
     * type: class or string
     * always: always read from context. default: false
     * @param {{ type: any, always: boolean }} { type, always = false }
     * @returns
     * @memberof Decorators
     */
    lazyInjectSubClass({type, always}?: {
        type: any;
        always?: boolean;
    }): (target: any, key: string) => void;
    private getGlobalType(type, target, key);
}
export declare function getDecorators(ioc?: IocContext): Decorators;
