import { inject, IocContext, postConstruct, preDestroy } from '@power-di/di';
import * as React from 'react';
import { create } from 'react-test-renderer';
import { it } from 'vitest';
import {
  BaseConsumerComponent,
  Component,
  iocConsumer,
  IocProvider,
  PureComponent,
  useInstanceHook,
} from '../src';

it('only component.', (t) => {
  const context = IocContext.DefaultInstance;
  class NRServiceDI {}
  context.register(NRServiceDI);

  class TestComponent extends Component<{}, {}> {
    @inject({ type: NRServiceDI })
    service: NRServiceDI;

    componentDidMount() {
      t.expect(this.service instanceof NRServiceDI).toBe(true);
    }

    render(): any {
      t.expect(this.service instanceof NRServiceDI).toBe(true);
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

it('has componentWillMount.', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends Component {
    @inject({ type: NRService })
    service: NRService;

    UNSAFE_componentWillMount() {
      t.expect(this.service instanceof NRService).toBe(true);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

it('has componentWillMount, PureComponent.', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends PureComponent {
    @inject({ type: NRService })
    service: NRService;

    UNSAFE_componentWillMount() {
      t.expect(this.service instanceof NRService).toBe(true);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

it('postConstruct.', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends Component {
    @inject({ type: NRService })
    service: NRService;

    @postConstruct()
    init() {
      t.expect(this.service instanceof NRService).toBe(true);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

it('postConstruct, subclass.', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class Base extends Component {
    @inject({ type: NRService })
    service: NRService;

    render(): any {
      return null;
    }
  }

  class TestComponent extends Base {
    @postConstruct()
    init() {
      t.expect(this.service instanceof NRService).toBe(true);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

it('preDestroy.', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends Component {
    @inject({ type: NRService })
    service: NRService;

    @preDestroy()
    destroy() {
      t.expect(this.service instanceof NRService).toBe(true);
    }

    render(): any {
      return null;
    }
  }

  const root = create(
    React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)),
  );
  root.unmount();
});

it('preDestroy, subclass.', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class Base extends Component {
    @inject({ type: NRService })
    service: NRService;

    render(): any {
      return null;
    }
  }

  class TestComponent extends Base {
    @preDestroy()
    destroy() {
      t.expect(this.service instanceof NRService).toBe(true);
    }

    render(): any {
      return null;
    }
  }

  const root = create(
    React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)),
  );
  root.unmount();
});

it('has componentWillMount, manual extends BaseConsumerComponent.', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  @iocConsumer({ manualExtendsBaseClass: true })
  class TestComponent extends BaseConsumerComponent {
    @inject({ type: NRService })
    service: NRService;

    @postConstruct()
    init() {
      t.expect(this.service instanceof NRService).toBe(true);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

it('consumer, manual extends.', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  @iocConsumer({ manualExtendsBaseClass: true })
  class TestComponent extends React.Component {
    @inject({ type: NRService })
    service: NRService;

    @postConstruct()
    init() {
      t.expect(false).toBe(true);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

it('consumer, manual extends BaseConsumerComponent.', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  @iocConsumer({ manualExtendsBaseClass: true })
  class TestComponent extends BaseConsumerComponent {
    @inject({ type: NRService })
    service: NRService;

    @postConstruct()
    init() {
      t.expect(this.service instanceof NRService).toBe(true);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

it('has createInstanceHook', (t) => {
  const context = new IocContext({
    createInstanceHook(inst, ioc) {
      inst.x = 'test';
      return inst;
    },
  });
  class TestComponent extends Component {
    x: string;

    componentDidMount() {
      t.expect(this.x).toBe('test');
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

it('use hooks', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  const TestComponent = (): any => {
    t.expect(useInstanceHook(NRService) instanceof NRService).toBe(true);
    return null;
  };

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

it('use hooks, symbol', (t) => {
  const context = new IocContext();
  class NRService {}
  type INRService = NRService;
  const INRService = Symbol('INRService');

  context.register(NRService, INRService);

  const TestComponent = (): any => {
    t.expect(useInstanceHook<INRService>(INRService) instanceof NRService).toBe(true);
    return null;
  };

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>,
  );
});

it('postConstruct, subclass', (t) => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class Base extends Component {
    @inject({ type: NRService })
    service: NRService;

    render(): any {
      return null;
    }
  }

  class TestComponent extends Base {
    @postConstruct()
    init() {
      t.expect(this.service instanceof NRService).toBe(true);
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>,
  );
});
