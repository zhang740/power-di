import { IocContext, RegisterOptions, KeyType, RegKeyType } from '../IocContext'
import { getGlobalType, logger } from '../utils'

export function getGlobalTypeByDecorator(
    type: any, target: any, key: string
) {
    if (!type && Reflect && Reflect.getMetadata) {
        type = Reflect.getMetadata('design:type', target, key)
    }
    return getGlobalType(type)
}

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
     * type: class or string
     * @param {{ type: any }} { type }
     * @returns
     * @memberof Decorators
     */
    public inject({ type }: { type?: any } = {}) {
        return (target: any, key: string) => {
            let t = Reflect.getMetadata('design:type', target, key)
            const globalType = getGlobalTypeByDecorator(type, target, key)
            target[key] = this.context.get(globalType)
            if (!target[key]) {
                logger.warn('Notfound:' + globalType)
            }
        }
    }

    /**
     * lazy inject
     * type: class or string
     * always: always read from context. default: false
     * subClass: getSubClasses. default: false
     * @param {{ type: any, always: boolean, subClass: boolean }} { type, always = false, subClass = false }
     * @returns
     * @memberof Decorators
     */
    public lazyInject({ type, always = false, subClass = false }: {
        type?: any, always?: boolean, subClass?: boolean
    } = {}) {
        return (target: any, key: string) => {
            const globalType = getGlobalTypeByDecorator(type, target, key)
            let defaultValue = target[key]
            Object.defineProperty(target, key, {
                configurable: !always,
                get: () => {
                    const data = subClass ? this.context.getSubClasses(globalType) : this.context.get(globalType)
                    if (!data) {
                        logger.warn('Notfound:' + globalType)
                    } else {
                        defaultValue = undefined
                        if (!always) {
                            Object.defineProperty(target, key, {
                                value: data
                            })
                        }
                    }
                    return data || defaultValue
                },
                set: (value) => {
                    defaultValue = value
                }
            })
        }
    }

    /**
     * lazy inject subClass, the abbreviation of lazy inject
     * type: class or string
     * always: always read from context. default: false
     * @param {{ type: any, always: boolean }} { type, always = false }
     * @returns
     * @memberof Decorators
     */
    public lazyInjectSubClass({ type, always = false }: {
        type: any, always?: boolean
    } = { type: undefined }) {
        return this.lazyInject({ type, always, subClass: true })
    }

}

export function getDecorators(ioc: IocContext = IocContext.DefaultInstance) {
    return new Decorators(ioc)
}
