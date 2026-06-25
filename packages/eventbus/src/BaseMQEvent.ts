import type { WhateverType } from './type';

/**
 * 消息队列事件定义
 *
 * 消息队列模式，暂时只支持最简单的「发布 -> 单订阅者接收」模式：
 * 消息会先入队，被某个 handler `ack` 后才从队列移除；未 ack 的消息会保留，
 * 供后续注册的 handler 补偿消费（参见 {@link EventBus}）。
 *
 * @template T 消息携带的数据类型
 */
export class BaseMQEvent<T extends WhateverType = unknown> {
  /** 消息超时时间，单位毫秒，超时后不再补偿消费 */
  readonly timeout = Infinity;

  constructor(msg: T);
  constructor(msg?: void);
  /**
   * @param msg 消息数据
   */
  constructor(public readonly msg: T) {}
}
