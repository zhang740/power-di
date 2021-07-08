import * as React from 'react';
import { Context, ContextSymbol } from './context';
import { createConsumerComponent } from './BaseComponent';

export interface IocConsumerOpt {
  /** manual extends BaseClass: BaseConsumerComponent */
  manualExtendsBaseClass?: boolean;
}

export function iocConsumer(opt: IocConsumerOpt = {}): ClassDecorator {
  opt = Object.assign({ useBaseClass: false }, opt);

  return function (Comp: any): void {
    const NewComp: any = opt.manualExtendsBaseClass ? Comp : createConsumerComponent(Comp);

    class IoCComponent extends React.PureComponent {
      render() {
        return <Context.Consumer>
          {ctx => <NewComp {...Object.assign({}, this.props, {
            [ContextSymbol]: ctx
          })} />}
        </Context.Consumer>;
      }
    }

    (IoCComponent  as any).displayName = `IoCComponent(${getDisplayName(Comp)})`;
    return IoCComponent  as any;
  };
}

function getDisplayName(WrappedComponent: any) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
