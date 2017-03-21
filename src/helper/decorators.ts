import { IocContext, RegisterOptions, KeyType, RegKeyType } from '../IocContext'
import { getGlobalType, logger } from '../utils'

const context = IocContext.DefaultInstance

/**
 * register class
 * @param target need a class
 * @param options RegisterOptions
 */
export function register(key?: RegKeyType, options?: RegisterOptions) {
    return function (target: any) {
        context.register(target, key, options)
    }
}

/**
 * register subClass, the abbreviation of register
 * @param target need a class
 * @param options RegisterOptions
 */
export function registerSubClass(key?: RegKeyType, options?: RegisterOptions) {
    return function (target: any) {
        context.register(target, key, {
            ...options, regInSuperClass: true
        })
    }
}

/**
 * append class to subClass list by key
 * @param key class or string
 * @param options RegisterOptions
 */
export function append(key?: KeyType, options?: RegisterOptions) {
    return function (target: any) {
        context.append(key, target, options)
    }
}

/**
 * inject
 * @param type class or string
 */
export function inject(type: any) {
    const globalType = getGlobalType(type)
    return function (target: any, key: any): void {
        target[key] = context.get(globalType)
        if (!target[key]) {
            logger.warn('Notfound:' + globalType)
        }
    }
}

/**
 * lazy inject
 * @param type class or string
 * @param always always read from context. default: false
 * @param subClass getSubClasses. default: false
 */
export function lazyInject(type: any, always = false, subClass = false) {
    const globalType = getGlobalType(type)
    return function (target: any, key: any): void {
        Object.defineProperty(target, key, {
            configurable: !always,
            get: () => {
                const data = subClass ? context.getSubClasses(globalType) : context.get(globalType)
                if (!data) {
                    logger.warn('Notfound:' + globalType)
                } else if (!always) {
                    Object.defineProperty(target, key, {
                        value: data
                    })
                }
                return data
            }
        })
    }
}

/**
 * lazy inject subClass, the abbreviation of lazy inject
 * @param type class or string
 * @param always always read from context. default: false
 */
export function lazyInjectSubClass(type: any, always = false) {
    return lazyInject(type, always, true)
}