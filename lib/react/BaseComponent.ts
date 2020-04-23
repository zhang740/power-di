import * as React from 'react';
import { Context } from './context';
import { IocContext } from '../IocContext';


export abstract class Component<P = {}, S = {}> extends React.Component<P, S> {
  static contextType = Context;

  context: IocContext;

  constructor(props: P, context: IocContext) {
    super(props, context);

    const oriWillMount = this.componentWillMount;
    this.componentWillMount = () => {
      context.inject(this);
      oriWillMount && oriWillMount.bind(this)();
    };
  }
}

export abstract class PureComponent<P = {}, S = {}> extends React.PureComponent<P, S> {
  static contextType = Context;

  context: IocContext;

  constructor(props: P, context: IocContext) {
    super(props, context);

    const oriWillMount = this.componentWillMount;
    this.componentWillMount = () => {
      context.inject(this);
      oriWillMount && oriWillMount.bind(this)();
    };
  }
}
