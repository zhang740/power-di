# @power-di/data

[![NPM version][npm-image]][npm-url] [![license][license-image]][license-url]

A lightweight, **Proxy-based reactive data flow** for
[Power DI](https://github.com/zhang740/power-di) — a mobx-like `observable` / `computed` /
`action` engine with **decoupled** React bindings. Zero runtime dependencies in the core; the
React layer is a separate entry point and `react` is an optional peer dependency.

- **Core** (`@power-di/data`) — `observable`, `computed`, `action`, `observe` / `reaction`,
  `runInAction`, `toJS`, `BaseViewModel`. No React, no dependencies.
- **React** (`@power-di/data/react`) — `observer` (HOC) and `useObserver` (hook) that subscribe
  components to observable state and re-render on change.

## Install

```bash
npm i @power-di/data
# React bindings additionally need react as a peer:
npm i react
```

Requires `experimentalDecorators` + `emitDecoratorMetadata` in your `tsconfig.json` to use the
`@observable` / `@computed` / `@action` decorators.

## Core

```ts
import { action, computed, observable, observe, runInAction } from '@power-di/data';

class CounterVM {
  @observable count = 0;

  @computed get double() {
    return this.count * 2;
  }

  @action('increment') inc() {
    this.count += 1;
  }
}

const vm = new CounterVM();

// observe re-runs whenever a tracked dependency changes
const dispose = observe(() => console.log('double =', vm.double));
vm.inc(); // logs: double = 2
dispose();

// mutate outside a decorated action via runInAction
runInAction(() => (vm.count = 10));
```

`observable` works on plain objects, arrays, `Map`, and `Set`. By default mutations are only
allowed inside an `action` (configurable via `setMoConfig`).

### Core exports

`observable`, `computed`, `action`, `actionAsync`, `observe`, `reaction`, `autorun`,
`runInAction`, `transaction`, `toJS`, `deepWatch`, `raw`, `isObservable`, `unobserve`,
`BaseViewModel`, `setMoConfig`, `InternalConfig`, `setDebugFlagData`.

## React (`@power-di/data/react`)

```tsx
import { observer } from '@power-di/data/react';

const Counter = observer(() => {
  // reads vm.count / vm.double during render -> auto re-renders on change
  return <button onClick={() => vm.inc()}>{vm.double}</button>;
});
```

- `observer(Comp, opts?)` — wrap a function or class component; supports `delay` (debounce),
  `deepMode`, `memo`, and `debugger` via `ConnectOptions`.
- `observerWithName(name, Comp, opts?)` — same, with an explicit display name.
- `useObserver(fn, name?, opts?, args?)` — the underlying hook for function components.

### React exports

`observer`, `observerWithName`, `useObserver`, `connect`, `ConnectOptions`, `IReactComponent`.

## Configuration

```ts
import { setMoConfig } from '@power-di/data';

setMoConfig({
  skipSameValueChange: true, // skip reactions when a write doesn't change the value
  onlyAllowChangeInAction: true, // enforce mutations happen inside an action
  defaultConnectDelay: 0, // default debounce (ms) for React updates
  // Optional: tie @computed tracker disposal to your DI/instance lifecycle.
  registerInstanceDispose: (instance, dispose) => {
    /* e.g. register `dispose` on @power-di/di preDestroy */
  },
});
```

## License

MIT

[npm-image]: https://img.shields.io/npm/v/@power-di/data.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@power-di/data
[license-image]: https://img.shields.io/npm/l/@power-di/data.svg?style=flat-square
[license-url]: https://github.com/zhang740/power-di/blob/master/LICENSE
