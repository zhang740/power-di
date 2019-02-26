import * as React from 'react'
import * as PropTypes from 'prop-types'
import { IocContext } from '../IocContext'

export interface PropsDefine {
  context?: IocContext
}
export class IocProvider extends React.Component<PropsDefine, {}> {
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
    return React.Children.only(this.props.children)
  }
}
