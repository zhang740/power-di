# @power-di/class-loader

[![NPM version][npm-image]][npm-url] [![license][license-image]][license-url]

Class metadata registry and implementation-lookup utilities for [Power DI](https://github.com/zhang740/power-di).

Used internally by `@power-di/di`, but usable standalone whenever you need to track class
inheritance / interface relationships or resolve all implementations of a base type.

## Install

```bash
npm i @power-di/class-loader
```

## Usage

```ts
import { classLoader, getGlobalType } from '@power-di/class-loader';

class Animal {}
class Dog extends Animal {}

classLoader.registerClass(Animal);
classLoader.registerClass(Dog); // `extends` is auto-derived from the prototype chain

// All registered classes that extend / implement Animal
classLoader.getImplementClasses(Animal); // -> [{ type: Dog, info }]

// Stable, unique key for any class / token
getGlobalType(Dog); // -> 'Dog'
```

## API

### `classLoader` / `ClassLoader`

A shared singleton (`classLoader`) plus the `ClassLoader` class:

- `registerClass(type, info?)` — register a class; `extends` is auto-derived when omitted
- `unregisterClass(type)` — remove a class from the registry
- `getClassInfo(type)` — read a class's registered metadata (`{ name, extends, implements, ... }`)
- `getImplementClasses(type)` — all registered classes extending / implementing `type`
- `filterClasses(pattern)` — filter registered classes by predicate
- `clearAll()` — reset the registry

### Utilities

- `getGlobalType(keyOrClass, prefix?)` — derive a stable string / symbol key
- `getGlobalTypeByDecorator` / `getClsTypeByDecorator` — decorator-based lookups
- `getSuperClassInfo(type)` — walk the prototype chain
- `getRefMap(...)` — build a reference map
- `isClass(v)` / `isExtendOf(a, b)` — type guards
- `getReflectMetadata`, `guard`, `symbolString`
- `logger`, `OutLevel` — leveled logger

### Types

`ClassType`, `KeyType`, `RegKeyType`, `GetReturnType`

## License

MIT

[npm-image]: https://img.shields.io/npm/v/@power-di/class-loader.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@power-di/class-loader
[license-image]: https://img.shields.io/npm/l/@power-di/class-loader.svg?style=flat-square
[license-url]: https://github.com/zhang740/power-di/blob/master/LICENSE
