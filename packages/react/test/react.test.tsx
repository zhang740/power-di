import { test as vitestTest, expect } from 'vitest';
import * as React from 'react';
import { create } from 'react-test-renderer';
import { IocContext, inject, postConstruct, preDestroy } from '@power-di/di';
import {
  IocProvider,
  Component,
  PureComponent,
  useInstanceHook,
  BaseConsumerComponent,
  iocConsumer,
} from '@power-di/react';

const test = (name: string, fn: (t: any) => any) => vitestTest(name, () => fn(createAssert()));

function createAssert() {
  return {
    true: (value: any) => expect(value).toBe(true),
    false: (value: any) => expect(value).toBe(false),
    is: (value: any, expected: any) => expect(value).toBe(expected),
    deepEqual: (value: any, expected: any) => expect(value).toEqual(expected),
    throws: (fn: () => any, opts?: any) => {
      if (opts?.instanceOf) {
        return expect(fn).toThrow(opts.instanceOf);
      }
      return expect(fn).toThrow();
    },
    notThrows: (fn: () => any) => expect(fn).not.toThrow(),
    throwsAsync: async (fn: () => Promise<any>) => {
      await expect(fn()).rejects.toThrow();
    },
    notThrowsAsync: async (fn: () => Promise<any>) => {
      await expect(fn()).resolves.toBeUndefined();
    },
    pass: () => expect(true).toBe(true),
    assert: (value: any) => expect(!!value).toBe(true),
    fail: () => expect(false).toBe(true),
  };
}

test('only component.', t => {
  const context = IocContext.DefaultInstance;
  class NRServiceDI {}
  context.register(NRServiceDI);

  class TestComponent extends Component<{}, {}> {
    @inject({ type: NRServiceDI })
    service: NRServiceDI;

    componentDidMount() {
      t.true(this.service instanceof NRServiceDI);
    }

    render(): any {
      t.true(this.service instanceof NRServiceDI);
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

test('has componentWillMount.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends Component {
    @inject({ type: NRService })
    service: NRService;

    UNSAFE_componentWillMount() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

test('has componentWillMount, PureComponent.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends PureComponent {
    @inject({ type: NRService })
    service: NRService;

    UNSAFE_componentWillMount() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

test('postConstruct.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends Component {
    @inject({ type: NRService })
    service: NRService;

    @postConstruct()
    init() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

test('postConstruct, subclass.', t => {
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
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

test('preDestroy.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  class TestComponent extends Component {
    @inject({ type: NRService })
    service: NRService;

    @preDestroy()
    destroy() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  const root = create(
    React.createElement(IocProvider, { context }, React.createElement(TestComponent, null))
  );
  root.unmount();
});

test('preDestroy, subclass.', t => {
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
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  const root = create(
    React.createElement(IocProvider, { context }, React.createElement(TestComponent, null))
  );
  root.unmount();
});

test('has componentWillMount, manual extends BaseConsumerComponent.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  @iocConsumer({ manualExtendsBaseClass: true })
  class TestComponent extends BaseConsumerComponent {
    @inject({ type: NRService })
    service: NRService;

    @postConstruct()
    init() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

test('consumer, manual extends.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  @iocConsumer({ manualExtendsBaseClass: true })
  class TestComponent extends React.Component {
    @inject({ type: NRService })
    service: NRService;

    @postConstruct()
    init() {
      t.fail();
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

test('consumer, manual extends BaseConsumerComponent.', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  @iocConsumer({ manualExtendsBaseClass: true })
  class TestComponent extends BaseConsumerComponent {
    @inject({ type: NRService })
    service: NRService;

    @postConstruct()
    init() {
      t.true(this.service instanceof NRService);
    }

    render(): any {
      return null;
    }
  }

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
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

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

test('use hooks', t => {
  const context = new IocContext();
  class NRService {}
  context.register(NRService);

  const TestComponent = (): any => {
    t.true(useInstanceHook(NRService) instanceof NRService);
    return null;
  };

  create(React.createElement(IocProvider, { context }, React.createElement(TestComponent, null)));
});

test('use hooks, symbol', t => {
  const context = new IocContext();
  class NRService {}
  type INRService = NRService;
  const INRService = Symbol('INRService');

  context.register(NRService, INRService);

  const TestComponent = (): any => {
    t.true(useInstanceHook<INRService>(INRService) instanceof NRService);
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
