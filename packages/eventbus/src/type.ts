import type { BaseEvent } from './BaseEvent';
import type { BaseMQEvent } from './BaseMQEvent';

/** 任意类型（事件可携带任意数据，亦可不携带） */
export type WhateverType = void | unknown | undefined;

/**
 * 事件委托处理器
 *
 * @template T 入参类型
 * @template R 返回值类型
 */
export type IEventHandler<T, R> = (event: T) => R;

/** 事件类（构造出继承自 {@link BaseEvent} 的实例） */
export interface EventClass {
  new (...args: never[]): BaseEvent<WhateverType>;
}

/**
 * 事件处理器
 *
 * @template T 事件类，需继承自 {@link BaseEvent}
 */
export type EventHandler<T extends EventClass = EventClass> = (
  event: InstanceType<T>,
) => WhateverType | Promise<WhateverType>;

/** 消息队列事件类（构造出继承自 {@link BaseMQEvent} 的实例） */
export interface MQEventClass {
  new (...args: never[]): BaseMQEvent<WhateverType>;
}

/**
 * 消息队列事件处理器
 *
 * @template T 消息事件类，需继承自 {@link BaseMQEvent}
 */
export type MQEventHandler<T extends MQEventClass = MQEventClass> = (
  event: InstanceType<T>,
) => MQEventHandlerResult | Promise<MQEventHandlerResult>;

/** 消息队列事件处理结果 */
export interface MQEventHandlerResult {
  /** 是否确认消费：为 true 时停止后续 handler 并从队列移除该消息 */
  ack: boolean;
}
