import * as React from 'react'
import * as PropTypes from 'prop-types'
import { IocContext } from '../IocContext'


export class Component<P, S> extends React.Component<P, S> {
  public static contextTypes = {
    iocContext: PropTypes.any
  }
  private iocContext: IocContext
  protected GetComponent<T>(type: any): T {
    return this.iocContext && this.iocContext.get<T>(type)
  }

  constructor(props: P, context: any) {
    super(props, context)
    this.iocContext = (context && context.iocContext) || IocContext.DefaultInstance
  }
}
