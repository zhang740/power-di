import { IocContext, RegisterOptions, KeyType, RegKeyType } from '../IocContext'
import { getGlobalType, logger } from '../utils'

export class Decorators {
    private context: IocContext

    constructor(ioc: IocContext = IocContext.DefaultInstance) {
        this.context = ioc

        this.register = this.register.bind(this)
        this.registerSubClass = this.registerSubClass.bind(this)
        this.append = this.append.bind(this)
        this.inject = this.inject.bind(this)
        this.lazyInject = this.lazyInject.bind(this)
        this.lazyInjectSubClass = this.lazyInjectSubClass.bind(this)
    }

    /**
     * register class
     * @param target need a class
     * @param options RegisterOptions
     */
    public register(key?: RegKeyType, options?: RegisterOptions) {
        return (target: any) => {
            this.context.register(target, key, options)
        }
    }

    /**
     * register subClass, the abbreviation of register
     * @param target need a class
     * @param options RegisterOptions
     */
    public registerSubClass(key?: RegKeyType, options?: RegisterOptions) {
        return (target: any) => {
            this.context.register(target, key, {
                ...options, regInSuperClass: true
            })
        }
    }

    /**
     * append class to subClass list by key
     * @param key class or string
     * @param options RegisterOptions
     */
    public append(key?: KeyType, options?: RegisterOptions) {
        return (target: any) => {
            this.context.append(key, target, options)
        }
    }

    /**
     * inject
     * @param type class or string
     */
    public inject(type: any) {
        const globalType = getGlobalType(type)
        return (target: any, key: any) => {
            target[key] = this.context.get(globalType)
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
    public lazyInject(type: any, always = false, subClass = false) {
        const globalType = getGlobalType(type)
        return (target: any, key: any) => {
            Object.defineProperty(target, key, {
                configurable: !always,
                get: () => {
                    const data = subClass ? this.context.getSubClasses(globalType) : this.context.get(globalType)
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
    public lazyInjectSubClass(type: any, always = false) {
        return this.lazyInject(type, always, true)
    }
}

export function getDecorators(ioc: IocContext = IocContext.DefaultInstance) {
    return new Decorators(ioc)
}