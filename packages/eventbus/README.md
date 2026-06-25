# @power-di/eventbus

[![NPM version][npm-image]][npm-url] [![license][license-image]][license-url]

A lightweight, strongly-typed event bus and event delegate for
[Power DI](https://github.com/zhang740/power-di). Zero runtime dependencies, pure TypeScript.

- **`EventDelegate`** — a typed multicast delegate (broadcast or chained pipe).
- **`EventBus`** — a class-keyed pub/sub hub with sync / async emit, one-shot listeners,
  message-queue events (backlog + ack), and semaphores.

## Install

```bash
npm i @power-di/eventbus
```

Enable decorators is **not** required — this package is plain classes.

## EventDelegate

```ts
import { EventDelegate } from '@power-di/eventbus';

const onChange = new EventDelegate<{ value: number }>();

const handler = e => console.log(e.value);
onChange.on(handler);
onChange.emit({ value: 1 }); // logs 1
onChange.off(handler);

// `once` auto-removes after the first emit
onChange.once(e => console.log('first only', e.value));

// `invoke` pipes each handler's return value into the next
const pipe = new EventDelegate<number, number>();
pipe.on(n => n + 1);
pipe.on(n => n * 2);
pipe.invoke(21); // -> 44
```

### API

`emit`, `invoke`, `on` / `addHandler`, `off` / `removeHandler`, `once`.

## EventBus

Events are keyed by **class**. Extend `BaseEvent` for normal events, or `BaseMQEvent` for
message-queue events.

```ts
import { BaseEvent, EventBus } from '@power-di/eventbus';

class UserLogin extends BaseEvent<{ id: string }> {}

const bus = new EventBus();
bus.on(UserLogin, e => console.log('login', e.data.id));

bus.emit(new UserLogin({ id: 'u1' })); // sync
await bus.emitAsync(new UserLogin({ id: 'u2' })); // awaits async handlers
```

### Message queue (single-consumer + ack)

```ts
import { BaseMQEvent, EventBus } from '@power-di/eventbus';

class Job extends BaseMQEvent<{ task: string }> {}

const bus = new EventBus();
// Emit before any listener — the message is backlogged...
bus.emit(new Job({ task: 'build' }));

// ...and delivered (compensated) once a handler subscribes.
bus.on(Job, (e) => {
  console.log('handle', e.msg.task);
  return { ack: true }; // ack removes it from the queue; ack:false leaves it for the next handler
});
```

Override `timeout` (ms) on an `BaseMQEvent` subclass to drop backlogged messages after expiry.

### Semaphores

```ts
const bus = new EventBus();
const waiting = bus.semWait('ready', 1000); // optional timeout (rejects on expiry)
bus.semSignal('ready');
await waiting;
```

### API

- Listeners: `on`, `once`, `off`, `clearByType`, `clearAll`
- Emit: `emit`, `emitAsync`, `onEmit` (an `EventDelegate` fired on every broadcast)
- String-keyed event classes: `getEC`, `removeEC`
- Semaphores: `semWait`, `semSignal`

### Exports

`EventDelegate`, `EventBus`, `BaseEvent`, `BaseMQEvent`, and the supporting types
(`EventClass`, `EventHandler`, `MQEventClass`, `MQEventHandler`, `MQEventHandlerResult`,
`IEventHandler`, `WhateverType`).

## License

MIT

[npm-image]: https://img.shields.io/npm/v/@power-di/eventbus.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@power-di/eventbus
[license-image]: https://img.shields.io/npm/l/@power-di/eventbus.svg?style=flat-square
[license-url]: https://github.com/zhang740/power-di/blob/master/LICENSE
