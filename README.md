# Power DI

[![CI](https://img.shields.io/travis/zhang740/power-di.svg?style=flat-square)](https://travis-ci.org/zhang740/power-di)
[![Coverage](https://img.shields.io/coveralls/zhang740/power-di.svg?style=flat-square)](https://coveralls.io/github/zhang740/power-di)
[![Version](https://img.shields.io/npm/v/power-di.svg?style=flat-square)](https://www.npmjs.com/package/power-di)
[![License](https://img.shields.io/npm/l/power-di.svg?style=flat-square)](https://github.com/zhang740/power-di/blob/master/LICENSE)

A lightweight Dependency Injection library. Using es6 and other features, remove unnecessary concepts, easy and convenient to use.

## Install
```shell
npm i power-di --save
```

## Example

### a simple example
```ts
import { IocContext } from 'power-di';

class AService { }

// default instance, you can also new IocContext to get a instance.
const context = IocContext.DefaultInstance;
context.register(AService);
const aService = context.get(AService); // a instance of AService
```

### inject with key
```ts
class AService { }

const context = IocContext.DefaultInstance;
context.register(AService, 'XService'); // key need a string or class, e.g super class or whatever class.
context.get('XService');
```

### use with decorators
```ts
const context = new IocContext();

@injectable()
class NRService { }

@injectable()
class LITestService {
  @inject()
  public testService: NRService;
}

const test = context.get(LITestService);
```

### collect impl or extends of some interface/base class
```ts
class A { }

@classInfo()
class B extends A { }

@classInfo()
class C extends A { }

@injectable()
class LITestService {
  @imports({ type: A })
  public testService: A[];
}

const test = context.get(LITestService); // test.testService as A[];
```

### use in react
```tsx
const context = new IocContext;
class NRService { }
context.register(NRService);

class TestComponent extends Component<{}, {}> {
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
```

## Class Loader
Power DI introduced the concept of class loader. We can customize the find rule of ioc.

#### [See the test case for details.](https://github.com/zhang740/power-di/tree/master/test)
