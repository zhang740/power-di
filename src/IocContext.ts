import getGlobalType from './utils/getGlobalType'

export const DefaultRegisterOption: RegisterOptions = {
    singleton: true,
    autoNew: true,
}
export interface RegisterOptions {
    /** default: true */
    singleton?: boolean
    /** if data a class, auto gen a instance. default: true */
    autoNew?: boolean
}
export type InterceptorType = () => void
export type KeyType = Function | string | undefined
interface Store {
    value: any,
    options: RegisterOptions
}
export class IocContext {
    private static defaultInstance: IocContext
    private components = new Map<string, Store>()
    public static get DefaultInstance() {
        return this.defaultInstance ||
            (this.defaultInstance = new IocContext(), this.defaultInstance)
    }

    public remove(keyOrType: string | Function) {
        return this.components.delete(getGlobalType(keyOrType))
    }

    public get<T>(keyOrType: string | Function): T {
        const data = this.components.get(getGlobalType(keyOrType))
        if (!data) return
        if (data.options.singleton) {
            return data.value
        } else {
            return data.value()
        }
    }

    public replace<T>(keyOrType: string | Function, newData: any) {
        const key = getGlobalType(keyOrType)
        const data = this.components.get(key)
        if (data) {
            const dataIsFunction = newData instanceof Function
            data.value = this.genValue(dataIsFunction, data.options, newData)
        } else {
            throw new Error(`the key:[${key}] is not register.`)
        }
    }

    public register(data: any, key?: KeyType, options = DefaultRegisterOption) {
        const dataIsFunction = data instanceof Function
        if (!dataIsFunction && !key) {
            throw new Error('when data is not a class, require a key.')
        }
        const keyIsOK = !key || key instanceof Function || typeof key === 'string'
        if (!keyIsOK) {
            throw new Error('key require a string or a class.')
        }
        const dataKey = getGlobalType(key) || getGlobalType(data)
        if (this.components.has(dataKey)) {
            throw new Error(`the key:[${dataKey}] is already register.`)
        }
        options = Object.assign({}, DefaultRegisterOption, options)
        this.components.set(dataKey, {
            value: this.genValue(dataIsFunction, options, data),
            options
        })
    }

    private genValue(dataIsFunction: boolean, options: RegisterOptions, data: any) {
        const genData = () => dataIsFunction && options.autoNew ? new data : data
        if (options.singleton) {
            return genData()
        } else {
            return genData
        }
    }
}