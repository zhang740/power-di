import type { IEventHandler } from './type';

/**
 * 事件委托
 *
 * 一个轻量的强类型多播委托：维护一组处理器，支持广播（{@link emit}）与
 * 链式调用（{@link invoke}，将上一个处理器的返回值作为下一个的入参）。
 *
 * @template T 事件入参类型
 * @template R 处理器返回值类型，链式调用时需可回填为 T（默认为 void）
 */
export class EventDelegate<T = void, R extends T | void = void> {
  /** 处理器列表 */
  protected handlers: IEventHandler<T, R>[] = [];

  /**
   * 广播事件，依次调用所有处理器（忽略返回值）
   *
   * @param event 事件
   */
  public emit(event: T) {
    this.handlers.forEach(h => h(event));
  }

  /**
   * 链式调用：以 event 为初值，将每个处理器的返回值作为下一个处理器的入参，
   * 返回最终结果
   *
   * @param event 事件初值
   */
  public invoke(event: T): T {
    return this.handlers.reduce((pv, cv) => cv(pv) as unknown as T, event);
  }

  /**
   * 添加事件处理函数（重复添加同一引用会被忽略）
   *
   * @param handler 事件处理函数
   */
  public addHandler(handler: IEventHandler<T, R>) {
    if (!this.handlers.includes(handler)) {
      this.handlers.push(handler);
    }
    return this;
  }

  /**
   * 移除事件处理函数
   *
   * @param handler 事件处理函数
   */
  public removeHandler(handler: IEventHandler<T, R>) {
    this.handlers = this.handlers.filter(h => h !== handler);
    return this;
  }

  /**
   * 添加事件处理函数（{@link addHandler} 别名）
   *
   * @param handler 事件处理函数
   */
  public on(handler: IEventHandler<T, R>) {
    return this.addHandler(handler);
  }

  /**
   * 移除事件处理函数（{@link removeHandler} 别名）
   *
   * @param handler 事件处理函数
   */
  public off(handler: IEventHandler<T, R>) {
    return this.removeHandler(handler);
  }

  /**
   * 添加只执行一次的事件处理函数（执行后自动移除）
   *
   * @param handler 事件处理函数
   */
  public once(handler: IEventHandler<T, R>) {
    const onceHandler = ((event: T) => {
      this.removeHandler(onceHandler);
      return handler(event);
    }) as IEventHandler<T, R>;
    return this.addHandler(onceHandler);
  }
}
