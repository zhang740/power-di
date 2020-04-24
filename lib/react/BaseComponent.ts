import * as React from 'react';
import { Context, ContextSymbol as ContextInProps } from './context';
import { IocContext } from '../IocContext';

function injectInstance(instance: any, context: IocContext) {
  context.inject(instance, { autoRunPostConstruct: false });

  const oriWillMount = instance.componentWillMount;
  instance.componentWillMount = function () {
    context.runPostConstruct(instance);
    oriWillMount && oriWillMount.bind(instance)();
  };
}

export abstract class Component<P = {}, S = {}> extends React.Component<P, S> {
  static contextType = Context;

  context: IocContext;

  constructor(props: P, context: IocContext) {
    super(props, context);

    injectInstance(this, context);
  }
}

export abstract class PureComponent<P = {}, S = {}> extends React.PureComponent<P, S> {
  static contextType = Context;

  context: IocContext;

  constructor(props: P, context: IocContext) {
    super(props, context);

    injectInstance(this, context);
  }
}

interface IocProps {
  [ContextInProps]?: IocContext;
}

export abstract class BaseConsumerComponent<P = {}, S = {}> extends React.Component<P & IocProps, S> {
  constructor(props: IocProps, context: any) {
    super(props as any, context);

    injectInstance(this, props[ContextInProps]);
  }
}

export function createConsumerComponent(Comp: any) {
  return class ConsumerComponent extends Comp {

    constructor(props: IocProps, context: any) {
      super(props, context);

      injectInstance(this, props[ContextInProps]);
    }
  };
}
