import test from 'ava';
import * as React from 'react';
import { create } from 'react-test-renderer';
import { IocContext } from '../lib/IocContext';
import {
  IocProvider,
  Component,
  PureComponent,
  useInstanceHook,
  BaseConsumerComponent,
} from '../lib/react';
import { inject, postConstruct, preDestroy } from '../lib';
import { iocConsumer } from '../react';

test('only component.', t => {
  const context = IocContext.DefaultInstance;
  class NRServiceDI {}
  context.register(NRServiceDI);

  class TestComponent extends Component<{}, {}> {
    @inject()
    service: NRServiceDI;

    componentDidMount() {
      t.true(this.service instanceof NRServiceDI);
    }

    render(): any {
      t.true(this.service instanceof NRServiceDI);
      return null;
    }
  }

  create(<TestComponent />);
});

test('IocProvider.', t => {
  const context = IocContext.DefaultInstance;
  class NRServiceDI {}
  context.register(NRServiceDI);

  class TestComponent extends Component {
    @inject()
    service: NRServiceDI;

    componentDidMount() {
      t.true(this.service instanceof NRServiceDI);
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider>
      <TestComponent />
    </IocProvider>
  );
});

test('IocProvider with context.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends PureComponent {
    @inject()
    service: NRService;

    componentDidMount() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('has componentWillMount.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends Component {
    @inject()
    service: NRService;

    UNSAFE_componentWillMount() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('has componentWillMount, PureComponent.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends PureComponent {
    @inject()
    service: NRService;

    UNSAFE_componentWillMount() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('postConstruct.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends Component {
    @inject()
    service: NRService;

    @postConstruct()
    init() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('consumer.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  @iocConsumer()
  class TestComponent extends React.Component {
    @inject()
    service: NRService;

    @postConstruct()
    init() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('consumer, PureComponent.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  @iocConsumer({ pureComponent: true })
  class TestComponent extends React.Component {
    @inject()
    service: NRService;

    @postConstruct()
    init() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('consumer, manual extends.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  @iocConsumer({ manualExtendsBaseClass: true })
  class TestComponent extends React.Component {
    @inject()
    service: NRService;

    @postConstruct()
    init() {
      t.fail();
    }

    render(): any {
      return null;
    }
  }

  @iocConsumer()
  class TestBComponent extends React.Component {
    @inject()
    service: NRService;

    @postConstruct()
    init() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
      <TestBComponent />
    </IocProvider>
  );
});

test('consumer, manual extends BaseConsumerComponent.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  @iocConsumer({ manualExtendsBaseClass: true })
  class TestComponent extends BaseConsumerComponent {
    @inject()
    service: NRService;

    @postConstruct()
    init() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('has createInstanceHook', t => {
  const context = new IocContext({
    createInstanceHook(inst, ioc) {
      inst.x = 'test';
      return inst;
    },
  });
  class TestComponent extends Component {
    x: string;

    componentDidMount() {
      t.deepEqual(this.x, 'test');
    }

    render(): any {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('use hooks', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  const TestComponent = (): any => {
    t.true(useInstanceHook(NRService) instanceof NRService);
    return null;
  };

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('use hooks, symbol', t => {
  const context = new IocContext();
  class NRService {}
  type INRService = NRService;
  const INRService = Symbol('INRService');

  context.register(NRService, INRService);

  const TestComponent = (): any => {
    t.true(useInstanceHook(INRService) instanceof NRService);
    return null;
  };

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('postConstruct, subclass', t => {
  const context = new IocContext();
  class NRService {
    test = 2;
  }
  context.register(NRService);

  class Base extends Component {
    test = 1;
  }

  class TestComponent extends Base {
    @inject()
    service: NRService;

    @postConstruct()
    init() {
      t.deepEqual(this.test, 1);
      t.deepEqual(this.service.test, 2);
    }

    render(): React.ReactNode {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('postConstruct, componentWillMount', t => {
  const context = new IocContext();

  class Base extends Component {
    test = 1;
  }

  class TestComponent extends Base {
    componentWillMount() {
      this.test++;
    }

    @postConstruct()
    init() {
      t.deepEqual(this.test, 1);
    }

    render(): React.ReactNode {
      return null;
    }
  }

  create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
});

test('preDestroy, componentWillUnmount', t => {
  const context = new IocContext();

  class Base extends Component {
    test = 1;
  }

  class TestComponent extends Base {
    componentWillUnmount() {
      this.test++;
    }

    @preDestroy()
    destroy() {
      t.deepEqual(this.test, 1);
    }

    render(): React.ReactNode {
      return null;
    }
  }

  const c = create(
    <IocProvider context={context}>
      <TestComponent />
    </IocProvider>
  );
  c.unmount();
});
