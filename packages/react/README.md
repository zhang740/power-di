# @power-di/react

[![NPM version][npm-image]][npm-url] [![license][license-image]][license-url]

React bindings for [Power DI](https://github.com/zhang740/power-di) — provide an `IocContext`
through the React tree and resolve services via base components, consumers, or hooks.

- Depends on [`@power-di/di`](https://npmjs.org/package/@power-di/di)
- Peer dependency: `react >= 16`

## Install

```bash
npm i @power-di/react @power-di/di react
```

## Usage

```tsx
import { inject, injectable, IocContext } from '@power-di/di';
import { Component, IocProvider, useInstanceHook } from '@power-di/react';
import * as React from 'react';

@injectable()
class MessageService {
  text() {
    return 'hello';
  }
}

const ctx = new IocContext();
ctx.register(MessageService);

// Class component — inject via decorator
class ClassView extends Component {
  @inject({ type: MessageService })
  service!: MessageService;

  render() {
    return <div>{this.service.text()}</div>;
  }
}

// Function component — resolve via hook
function HookView() {
  const service = useInstanceHook(MessageService);
  return <div>{service.text()}</div>;
}

export function App() {
  return (
    <IocProvider context={ctx}>
      <ClassView />
      <HookView />
    </IocProvider>
  );
}
```

## API

- `IocProvider` — provides an `IocContext` (`context` prop) to the subtree
- `Component` / `PureComponent` — base classes that resolve `@inject` fields from context
- `IocConsumer` / `createConsumerComponent` / `BaseConsumerComponent` — consumer-style access
- `useInstanceHook(keyOrType)` — resolve an instance from the nearest context
- `Context` / `ContextSymbol` — the underlying React context (defaults to `IocContext.DefaultInstance`)

## License

MIT

[npm-image]: https://img.shields.io/npm/v/@power-di/react.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@power-di/react
[license-image]: https://img.shields.io/npm/l/@power-di/react.svg?style=flat-square
[license-url]: https://github.com/zhang740/power-di/blob/master/LICENSE
