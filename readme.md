# Power DI

[![CI](https://img.shields.io/travis/zhang740/power-di.svg)](https://travis-ci.org/zhang740/power-di)
[![Coverage](https://img.shields.io/coveralls/zhang740/power-di.svg)](https://coveralls.io/github/zhang740/power-di)
[![Version](https://img.shields.io/npm/v/power-di.svg)](https://www.npmjs.com/package/power-di)
[![License](https://img.shields.io/npm/l/power-di.svg)](https://github.com/zhang740/power-di/blob/master/LICENSE)

A lightweight Dependency Injection library. Using es6 and other features, remove unnecessary concepts, easy and convenient to use.

## Install
```shell
npm i power-di --save
```

## Example

### a simple example
```ts
import { IocContext } from 'power-di'

class AService { }

// default instance, you can also new IocContext to get a instance.
const context = IocContext.DefaultInstance
context.register(AService)
const aService = context.get(AService) // a instance of AService
```

### inject with key
```ts
class AService { }

const context = IocContext.DefaultInstance
context.register(AService, 'XService') // key need a string or class, e.g super class or whatever class.
context.get('XService')
```

### use with decorators
```ts
import { register, inject, lazyInject } from 'power-di/helper'

@register()
class AService { }

class SomeClass {
    @inject(AService) // set right now
    private aService: AService

    @lazyInject(AService) // set when using
    private bService: AService
}

context.get(AService)
```

### use in react
```tsx
import { IocProvider, Component } from 'power-di/react'

@register()
class AService { }

class TestComponent extends Component<{}, {}> {
    componentWillMount() {
        this.GetComponent(AService)
    }

    render(): any {
        return null
    }
}

// parent component, the IocProvider is not necessary.
<IocProvider context={context}>
    <TestComponent />
</IocProvider>
```

### collect some kind of object
```ts
class A { }

@register(undefined, { regInSuperClass: true })
class B extends A { }

@registerSubClass() // the abbreviation of above
class C extends A { }

@append(A)
class D { }

class LITestService {
    @lazyInject(A, false, true)
    public testService1: A[] // [b, c, d], the type is A[] or any[] (D may be not instance of A)

    @lazyInjectSubClass(A)
    public testService2: A[] // the abbreviation of above
}
```

### [See the test case for details.](https://github.com/zhang740/power-di/tree/master/src/__tests__)