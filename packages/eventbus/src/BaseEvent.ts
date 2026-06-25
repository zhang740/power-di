import type { WhateverType } from './type';

/**
 * 基础事件定义
 *
 * 自定义事件继承本类，通过泛型约束 {@link data} 的类型。
 *
 * @template T 事件携带的数据类型
 */
export class BaseEvent<T extends WhateverType = unknown> {
  constructor(data: T);
  constructor(data?: void);
  /**
   * @param data 事件数据
   */
  constructor(public readonly data: T) {}
}
