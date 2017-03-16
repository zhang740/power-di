# Power DI

<p>
  <a href="https://www.npmjs.com/package/power-di"><img src="https://img.shields.io/npm/v/power-di.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/power-di"><img src="https://img.shields.io/npm/l/power-di.svg" alt="License"></a>
</p>

A powerful Dependency Injection library. Using es6 and other features, easy and convenient to use.

## Install
```shell
npm i power-di --save
```

## Example

### a simple example
```typescript
class AService { }

// default instance, you can also new IocContext to get a instance.
const context = IocContext.DefaultInstance
context.register(AService)
const aService = context.get(AService) // a instance of AService
```

### inject with key
```typescript
class AService { }

const context = IocContext.DefaultInstance
context.register(AService, 'XService') // key need a string or class, e.g super class or whatever class.
context.get('XService')
```

### use with decorators
```typescript
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
