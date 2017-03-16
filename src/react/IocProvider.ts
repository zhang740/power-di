import { Component, Children, PropTypes } from 'react'
import { IocContext } from '../IocContext'

export interface PropsDefine {
    context?: IocContext
}
export class IocProvider extends Component<PropsDefine, {}> {
    public static childContextTypes: any = {
        iocContext: PropTypes.any
    }

    private iocContext: IocContext

    constructor(props: PropsDefine, context: any) {
        super(props, context)
        this.iocContext = props.context || IocContext.DefaultInstance
    }

    getChildContext() {
        return { iocContext: this.iocContext }
    }

    render() {
        return Children.only(this.props.children)
    }
}