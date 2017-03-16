import { RegisterOptions, KeyType } from '../IocContext';
/**
 * register class
 * @param target need a class
 */
export declare function register(key?: KeyType, options?: RegisterOptions): (target: any) => void;
/**
 * inject
 * @param type class or string
 */
export declare function inject(type: any): (target: any, key: any) => void;
/**
 * lazy inject
 * @param type class or string
 * @param always always read from context. default: false
 */
export declare function lazyInject(type: any, always?: boolean): (target: any, key: any) => void;
