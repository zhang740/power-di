# @power-di/di

[![NPM version][npm-image]][npm-url] [![license][license-image]][license-url]

Core IoC container and decorators for [Power DI](https://github.com/zhang740/power-di) — a
lightweight, decorator-first Dependency Injection library for TypeScript and JavaScript.

This package also re-exports the [`@power-di/class-loader`](https://npmjs.org/package/@power-di/class-loader) APIs.

## Install

```bash
npm i @power-di/di
```

Enable decorators in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

## Usage

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
ctx.get(UserController).service.getName(); // -> 'power-di'
```

## API

### Container — `IocContext`

- `register(valueOrClass, key?, options?)`
- `get(typeOrKey, options?)` / `getImports(type)`
- `has(typeOrKey, includeParent?, includeMapped?)`
- `remove(typeOrKey)` / `clear()`
- `createChildContext(options?)` — parent / child scopes
- `inject(instance, options?)` — inject into an existing instance
- `IocContext.DefaultInstance` — shared default container

### Decorators

- `@injectable()` — mark a class for IoC management
- `@inject({ type, lazy?, optional?, always? })` — inject by class / token / key
- `@imports({ type })` — inject all implementations / subclasses of a base type
- `@postConstruct()` / `@preDestroy()` — lifecycle hooks
- `@aspect({ before?, after?, error? })` — AOP interception for sync / async / generator methods
- `classInfo(...)` — attach class metadata

## License

MIT

[npm-image]: https://img.shields.io/npm/v/@power-di/di.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@power-di/di
[license-image]: https://img.shields.io/npm/l/@power-di/di.svg?style=flat-square
[license-url]: https://github.com/zhang740/power-di/blob/master/LICENSE
