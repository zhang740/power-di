import * as React from 'react';
import { Context } from './context';
import { IocContext } from '../IocContext';


export abstract class Component<P = {}, S = {}> extends React.Component<P, S> {
  static contextType = Context;

  constructor(props: P, context: IocContext) {
    super(props, context);
    context.inject(this);
  }
}

export abstract class PureComponent<P = {}, S = {}> extends React.PureComponent<P, S> {
  static contextType = Context;

  constructor(props: P, context: IocContext) {
    super(props, context);
    context.inject(this);
  }
}
