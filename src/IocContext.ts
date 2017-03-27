import { getGlobalType, getSuperClassInfo } from './utils'

export const DefaultRegisterOption: RegisterOptions = {
    singleton: true,
    autoNew: true,
    regInSuperClass: false,
}
export interface RegisterOptions {
    /** default: true */
    singleton?: boolean
    /** if data a class or function, auto new a instance. default: true */
    autoNew?: boolean
    /**
     * register in superclass, you can get use superclass with getSubClasses method.
     * This setting is not inherited.
     * default: false
     * */
    regInSuperClass?: boolean
}
export type InterceptorType = () => void
export type KeyType = Function | string // typeof Object
export type RegKeyType = KeyType | undefined
interface Store {
    inited: boolean,
    value: any,
    options: RegisterOptions,
    subClasses: Store[],
}
export class IocContext {
    private static defaultInstance: IocContext
    private components = new Map<string, Store>()
    public static get DefaultInstance() {
        return this.defaultInstance ||
            (this.defaultInstance = new IocContext(), this.defaultInstance)
    }

    public remove(keyOrType: KeyType) {
        return this.components.delete(getGlobalType(keyOrType))
    }

    public get<T>(keyOrType: KeyType): T {
        const data = this.components.get(getGlobalType(keyOrType))
        if (!data) return
        return this.returnValue(data)
    }

    public getSubClasses<T>(keyOrType: KeyType): T[] {
        const data = this.components.get(getGlobalType(keyOrType))
        if (!data) return
        return data.subClasses.map(sc => this.returnValue(sc))
    }

    public replace<T>(keyOrType: KeyType, newData: any, options?: RegisterOptions) {
        const key = getGlobalType(keyOrType)
        const data = this.components.get(key)
        if (data) {
            const dataIsFunction = newData instanceof Function
            data.inited = false
            data.value = this.genValue(dataIsFunction, options || data.options, newData)
        } else {
            throw new Error(`the key:[${key}] is not register.`)
        }
    }

    public append(keyOrType: KeyType, subData: any, options = DefaultRegisterOption) {
        if (subData instanceof Function) {
            this.register(subData, undefined, options)
        }
        this.appendData(
            getGlobalType(keyOrType),
            keyOrType,
            options,
            this.components.get(getGlobalType(subData)) || this.newStore(subData, options)
        )
    }

    public register(data: any, key?: RegKeyType, options = DefaultRegisterOption) {
        if (key) {
            if (!this.canBeKey(key)) {
                throw new Error('key require a string or a class.')
            }
        } else {
            if (!this.canBeKey(data)) {
                throw new Error('when data is not a class or string, require a key.')
            }
        }
        const dataType = (key && getGlobalType(key)) || (data && getGlobalType(data))

        if (this.components.has(dataType)) {
            throw new Error(`the key:[${dataType}] is already register.`)
        }
        options = Object.assign({}, DefaultRegisterOption, options)
        const store: Store = this.newStore(data, options)
        this.components.set(dataType, store)

        if (options.regInSuperClass) {
            if (!(data instanceof Function)) {
                throw new Error('if need regInSuperClass, data MUST be a class.')
            }
            const newOptions: RegisterOptions = { ...options, regInSuperClass: false }
            const superClasses = getSuperClassInfo(data)
            superClasses.forEach(sc => this.appendData(sc.type, sc.class, newOptions, store))
        }
    }

    private appendData(keyType: string, typeData: any, options: RegisterOptions, store: Store) {
        let superClass = this.components.get(keyType)
        if (!superClass) {
            this.register(typeData, undefined, options)
            superClass = this.components.get(keyType)
        }
        superClass.subClasses.push(store)
    }

    private newStore(data: any, options: RegisterOptions) {
        return {
            inited: false,
            value: this.genValue(data instanceof Function, options, data),
            options,
            subClasses: []
        } as Store
    }

    private canBeKey(obj: any) {
        return obj instanceof Function || typeof obj === 'string'
    }

    private genValue(isFunction: boolean, options: RegisterOptions, data: any) {
        const genData = () => isFunction && options.autoNew ? new data() : data
        if (options.singleton) {
            return () => genData()
        } else {
            return genData
        }
    }

    private returnValue(data: Store) {
        if (data.options.singleton) {
            return data.inited ? data.value :
                (
                    data.inited = true,
                    data.value = data.value(),
                    data.value
                )
        } else {
            return data.value()
        }
    }
}