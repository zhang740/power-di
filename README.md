# Power DI

[![codecov](https://img.shields.io/codecov/c/github/zhang740/power-di/next?style=flat-square&logo=codecov&label=codecov)](https://codecov.io/github/zhang740/power-di)
[![Version](https://img.shields.io/npm/v/power-di.svg?style=flat-square)](https://www.npmjs.com/package/power-di)
[![License](https://img.shields.io/npm/l/power-di.svg?style=flat-square)](https://github.com/zhang740/power-di/blob/master/LICENSE)

A lightweight Dependency Injection / IoC library for TypeScript & JavaScript.

This repository is a pnpm workspace. It ships a set of composable packages and also keeps the legacy `power-di` entry for compatibility. Core features:

- `IocContext` container (supports parent/child contexts)
- Decorator-based DI (`@injectable` / `@inject` / `@imports`)
- Lifecycle hooks (`@postConstruct` / `@preDestroy`)
- AOP (`@aspect`, supports sync/Promise/Generator)
- React bindings (Provider/Consumer, base components, hooks)

## Packages

- `power-di`: legacy entry (re-export facade)
- `@power-di/di`: IoC container and decorators (also re-exports class-loader APIs)
- `@power-di/class-loader`: class info collection and implementation lookup (extends/implements)
- `@power-di/react`: React bindings (Provider/base components/hooks)
- `@power-di/aspect`: AOP entry (thin wrapper)

## Install

Legacy entry (good for upgrading existing projects):

```shell
npm i power-di
```

Modular install (recommended for new projects):

```shell
npm i @power-di/di @power-di/react
```

## TypeScript Setup

Enable decorators:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

## Quick Start

```ts
import { IocContext } from 'power-di';

class AService { }

const context = IocContext.DefaultInstance;
context.register(AService);
const aService = context.get(AService);
```

## Register With Key

```ts
import { IocContext } from 'power-di';

class AService { }

const ctx = new IocContext();
ctx.register(AService, 'XService');

const service = ctx.get('XService');
```

## Decorators

```ts
import { IocContext, inject, injectable } from 'power-di';

@injectable()
class NRService {}

@injectable()
class LITestService {
  @inject({ type: NRService })
  public testService!: NRService;
}

const ctx = new IocContext();
const inst = ctx.get(LITestService);
```

## Collect Implementations / Subclasses

Use `@imports({ type })` to inject all implementations/subclasses of a base type (runtime key).

```ts
import { IocContext, imports, injectable } from 'power-di';

abstract class A {}

@injectable()
class B extends A {}

@injectable()
class C extends A {}

@injectable()
class LITestService {
  @imports({ type: A })
  public testService!: A[];
}

const ctx = new IocContext();
const inst = ctx.get(LITestService);
const all = inst.testService;
```

## Lifecycle

```ts
import { IocContext, injectable, postConstruct, preDestroy } from 'power-di';

@injectable()
class Service {
  public started = false;
  public stopped = false;

  @postConstruct()
  start() {
    this.started = true;
  }

  @preDestroy()
  stop() {
    this.stopped = true;
  }
}

const ctx = new IocContext();
const s = ctx.get(Service);
ctx.remove(Service);
```

## Aspect (AOP)

```ts
import { IocContext, injectable, aspect } from 'power-di';

@injectable()
class Svc {
  @aspect({
    before: ctx => {
      ctx.data.tag = 'before';
    },
    after: ctx => {
      ctx.data.tag = 'after';
    },
  })
  run(x: string) {
    return x;
  }
}

const ctx = new IocContext();
ctx.get(Svc).run('ok');
```

## React

If you installed the legacy `power-di` entry, you can replace `@power-di/di` with `power-di` and `@power-di/react` with `power-di/react`.

```tsx
import * as React from 'react';
import { IocContext, inject, injectable } from '@power-di/di';
import { IocProvider, Component, useInstanceHook } from '@power-di/react';

@injectable()
class NRService {}

const ctx = new IocContext();
ctx.register(NRService);

class TestComponent extends Component {
  @inject({ type: NRService })
  service!: NRService;

  render() {
    return null;
  }
}

function HookComp() {
  const service = useInstanceHook(NRService);
  return null;
}

export function App() {
  return (
    <IocProvider context={ctx}>
      <TestComponent />
      <HookComp />
    </IocProvider>
  );
}
```

## Dev

```shell
pnpm install
pnpm test
pnpm build
```

Tests live under `packages/**/test`.
