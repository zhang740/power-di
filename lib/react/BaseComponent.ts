import * as React from 'react';
import { Context, ContextSymbol as ContextInProps } from './context';
import type { IocContext } from '../IocContext';

function injectInstance(instance: React.Component<any, any, any>, context: IocContext) {
  context.inject(instance, { autoRunPostConstruct: false });

  // process postConstruct
  const oriWillMount = instance.componentWillMount || instance.UNSAFE_componentWillMount;
  instance.componentWillMount = function () {
    context.runPostConstruct(instance);
    oriWillMount && oriWillMount.bind(instance)();
  };

  delete instance.UNSAFE_componentWillMount;

  // process preDe
  const oriWillUnmount = instance.componentWillUnmount;
  instance.componentWillUnmount = function () {
    context.runPreDestroy(instance);
    oriWillUnmount && oriWillUnmount.bind(instance)();
  };

  if (context.config.createInstanceHook) {
    instance = context.config.createInstanceHook(instance, context);
  }

  return instance;
}

export abstract class Component<P = {}, S = {}> extends React.Component<P, S> {
  static contextType = Context;

  context: IocContext;

  constructor(props: P, context: IocContext) {
    super(props, context);

    return injectInstance(this, context);
  }
}

export abstract class PureComponent<P = {}, S = {}> extends React.PureComponent<P, S> {
  static contextType = Context;

  context: IocContext;

  constructor(props: P, context: IocContext) {
    super(props, context);

    return injectInstance(this, context);
  }
}

interface IocProps {
  [ContextInProps]?: IocContext;
}

export abstract class BaseConsumerComponent<P = {}, S = {}> extends React.Component<
  P & IocProps,
  S
> {
  constructor(props: IocProps, context: any) {
    super(props as any, context);

    return injectInstance(this, props[ContextInProps]);
  }
}

export function createConsumerComponent(Comp: any) {
  return class ConsumerComponent extends Comp {
    constructor(props: IocProps, context: any) {
      super(props, context);

      return injectInstance(this as any, props[ContextInProps]);
    }
  };
}
