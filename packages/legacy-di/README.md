# power-di

[![NPM version][npm-image]][npm-url] [![NPM downloads][download-image]][download-url] [![license][license-image]][license-url]

Legacy facade package for [Power DI](https://github.com/zhang740/power-di). It bundles the
modular `@power-di/*` packages behind the original `power-di` import paths so existing
projects keep working without changes.

> New projects should prefer the modular packages directly:
> [`@power-di/di`](https://npmjs.org/package/@power-di/di),
> [`@power-di/react`](https://npmjs.org/package/@power-di/react).

## Install

```bash
npm i power-di
```

## Entry points

Each `power-di` import path is a thin re-export of a modular package, so
`import { x } from 'power-di'` is equivalent to `import { x } from '@power-di/di'`.

| Import path      | Equivalent modular package | Contents                                                  |
| ---------------- | -------------------------- | --------------------------------------------------------- |
| `power-di`       | `@power-di/di`             | Core container + decorators (incl. class-loader APIs)     |
| `power-di/react` | `@power-di/react`          | React bindings                                            |
| `power-di/utils` | `@power-di/class-loader`   | Selected utilities (`getGlobalType`, `isClass`, `logger`) |

## Usage

```ts
import { inject, injectable, IocContext } from 'power-di';

@injectable()
class MessageService {
  text() {
    return 'hello';
  }
}

@injectable()
class MessageController {
  @inject({ type: MessageService })
  service!: MessageService;
}

const ctx = new IocContext();
ctx.get(MessageController).service.text(); // -> 'hello'
```

See the [main README](https://github.com/zhang740/power-di#readme) for the full API.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/power-di.svg?style=flat-square
[npm-url]: https://npmjs.org/package/power-di
[download-image]: https://img.shields.io/npm/dm/power-di.svg?style=flat-square
[download-url]: https://npmjs.org/package/power-di
[license-image]: https://img.shields.io/npm/l/power-di.svg?style=flat-square
[license-url]: https://github.com/zhang740/power-di/blob/master/LICENSE
