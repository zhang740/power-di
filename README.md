# Power DI

[![CI status][github-action-image]][github-action-url] [![codecov][codecov-image]][codecov-url] [![NPM downloads][download-image]][download-url] [![bundlephobia][bundlephobia-image]][bundlephobia-url] [![license][license-image]][license-url]

Lightweight, decorator-first Dependency Injection / IoC for TypeScript and JavaScript.

`power-di` is a pnpm workspace with modular packages and a legacy compatibility entry.

## Why Power DI

- 🧩 Clean IoC container with parent/child contexts
- 🎯 Decorator-based injection (`@injectable`, `@inject`, `@imports`)
- 🔁 Lifecycle hooks (`@postConstruct`, `@preDestroy`)
- 🪄 AOP hooks (`@aspect`) for sync/async/generator methods
- ⚛️ React integration (`IocProvider`, base components, hooks)

## Packages

| Package                  | Version                              | Description                                        | Notes                                                                 |
| ------------------------ | ------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------- |
| `power-di`               | [![NPM version][npm-image]][npm-url] | Legacy facade package                              | Re-exports `@power-di/di`, plus `power-di/react` and `power-di/utils` |
| `@power-di/di`           | [![NPM version][npm-image]][npm-url] | Core IoC container + decorators                    | Also re-exports class-loader APIs                                     |
| `@power-di/react`        | [![NPM version][npm-image]][npm-url] | React bindings                                     | Depends on `@power-di/di`, peer `react >= 16`                         |
| `@power-di/class-loader` | [![NPM version][npm-image]][npm-url] | Class metadata and implementation lookup utilities | Used internally by DI, can be used directly                           |

## Quick Start

### 1) Install

Legacy (compatible with existing projects):

```bash
npm i power-di
```

Modular (recommended for new projects):

```bash
npm i @power-di/di @power-di/react
```

### 2) Enable decorators in TypeScript

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

### 3) Create and resolve services

```ts
import { inject, injectable, IocContext } from '@power-di/di';

@injectable()
class UserService {
  getName() {
    return 'power-di';
  }
}

@injectable()
class UserController {
  @inject({ type: UserService })
  service!: UserService;
}

const ctx = new IocContext();
const controller = ctx.get(UserController);
controller.service.getName();
```

## React Example

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

class ClassView extends Component {
  @inject({ type: MessageService })
  service!: MessageService;

  render() {
    return <div>{this.service.text()}</div>;
  }
}

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

## API Highlights

### Container

- `register(valueOrClass, key?, options?)`
- `get(typeOrKey, options?)`
- `has(typeOrKey, includeParent?, includeMapped?)`
- `remove(typeOrKey)` / `clear()`
- `createChildContext(options?)`
- `inject(instance, options?)`

### Decorators

- `@injectable()` — mark classes for IoC management
- `@inject({ type, lazy?, optional?, always? })` — inject by class/token/key
- `@imports({ type })` — inject all implementations/subclasses
- `@postConstruct()` / `@preDestroy()` — lifecycle hooks
- `@aspect({ before?, after?, error? })` — AOP interception

## Legacy vs Modular Usage

- Legacy import style:

  ```ts
  import { injectable, IocContext } from 'power-di';
  import { IocProvider } from 'power-di/react';
  ```

- Modular import style:

  ```ts
  import { injectable, IocContext } from '@power-di/di';
  import { IocProvider } from '@power-di/react';
  ```

## Development

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

Useful workspace scripts:

- `pnpm test:ui` — run Vitest UI
- `pnpm clean` — clean all package build outputs

Tests are located under `packages/**/test`.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/power-di.svg?style=flat-square
[npm-url]: https://npmjs.org/package/power-di
[github-action-image]: https://github.com/zhang740/power-di/actions/workflows/ci.yaml/badge.svg
[github-action-url]: https://github.com/zhang740/power-di/actions/workflows/ci.yaml
[codecov-image]: https://img.shields.io/codecov/c/github/zhang740/power-di?style=flat-square&logo=codecov&label=codecov
[codecov-url]: https://codecov.io/gh/zhang740/power-di
[download-image]: https://img.shields.io/npm/dm/power-di.svg?style=flat-square
[download-url]: https://npmjs.org/package/power-di
[bundlephobia-image]: https://img.shields.io/bundlephobia/min/power-di?style=flat-square
[bundlephobia-url]: https://bundlephobia.com/package/power-di
[license-image]: https://img.shields.io/npm/l/power-di.svg?style=flat-square
[license-url]: https://github.com/zhang740/power-di/blob/master/LICENSE
