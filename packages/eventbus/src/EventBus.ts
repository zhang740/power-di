import type { EventClass, EventHandler, MQEventClass, MQEventHandler } from './type';
import { BaseEvent } from './BaseEvent';
import { BaseMQEvent } from './BaseMQEvent';
import { EventDelegate } from './EventDelegate';

/** 处理者信息 */
interface HandlerInfo {
  /** 事件处理者 */
  handlers: {
    once: boolean;
    handler: EventHandler | MQEventHandler;
  }[];
  /** 积压消息队列 */
  mqEvents: { evt: BaseMQEvent; expireTime: number }[];
}

/** 事件总线实现 */
export class EventBus {
  /** 处理器映射 */
  protected handleMap = new Map<EventClass | MQEventClass, HandlerInfo>();
  /** 事件映射 */
  protected eventMap = new Map<string, EventClass | MQEventClass>();

  /** 广播事件时触发 */
  public readonly onEmit = new EventDelegate<BaseEvent | BaseMQEvent>();

  public getEC(key: string): EventClass;
  public getEC(key: string, type: EventClass): EventClass;
  public getEC(key: string, type: EventClass, createIfNotExist: boolean): EventClass | undefined;
  public getEC(key: string, type: MQEventClass): MQEventClass;
  public getEC(
    key: string,
    type: MQEventClass,
    createIfNotExist: boolean
  ): MQEventClass | undefined;
  /**
   * 通过字符串获取事件类
   *
   * @param key key
   * @param type 事件/消息类型
   * @param createIfNotExist 不存在则创建
   */
  public getEC(key: string, type?: EventClass | MQEventClass, createIfNotExist = true) {
    if (!this.eventMap.has(key) && createIfNotExist) {
      const finalType = type || BaseEvent;
      /** 占位类型，用于初始化队列 */
      const CLS: EventClass | MQEventClass = class extends finalType {
        /** 数据 */
        public data: unknown;
      };
      Object.defineProperty(CLS, 'name', { value: key });
      this.eventMap.set(key, CLS);
    }
    return this.eventMap.get(key);
  }

  /**
   * 移除事件类
   *
   * @param key key
   */
  public removeEC(key: string) {
    this.eventMap.delete(key);
    return this;
  }

  public emit<T extends BaseEvent>(event: T): EventBus;
  public emit<T extends BaseMQEvent>(event: T): EventBus;
  /**
   * 广播事件（同步，不允许广播异步事件）
   *
   * @param event 事件，需要继承自 {@link BaseEvent} 或 {@link BaseMQEvent}
   */
  public emit<T extends BaseEvent | BaseMQEvent>(event: T): EventBus {
    const handlers
      = event instanceof BaseMQEvent
        ? this.getMQHandlers(event)
        : event instanceof BaseEvent
          ? this.getEvtHandlers(event)
          : [];

    handlers.forEach((handler) => {
      handler(event as never);
    });
    this.onEmit.emit(event);
    return this;
  }

  public async emitAsync<T extends BaseEvent>(event: T): Promise<EventBus>;
  public async emitAsync<T extends BaseMQEvent>(event: T): Promise<EventBus>;
  /**
   * 广播事件（异步，可等待 handler 执行结束，不返回 handler 返回值）
   *
   * @param event 事件，需要继承自 {@link BaseEvent} 或 {@link BaseMQEvent}
   */
  public async emitAsync<T extends BaseEvent | BaseMQEvent>(event: T) {
    const handlers
      = event instanceof BaseMQEvent
        ? this.getMQHandlers(event)
        : event instanceof BaseEvent
          ? this.getEvtHandlers(event)
          : [];

    await Promise.all(
      handlers.map((handler) => {
        return handler(event as never);
      }),
    );
    this.onEmit.emit(event);
    return this;
  }

  public on<T extends EventClass>(type: T, handler: EventHandler<T>): EventBus;
  public on<T extends MQEventClass>(type: T, handler: MQEventHandler<T>): EventBus;
  /**
   * 监听事件
   *
   * @param type 事件类型，需要继承自 {@link BaseEvent}
   * @param handler 事件处理函数
   */
  public on<T extends EventClass, K extends MQEventClass>(
    type: T | K,
    handler: EventHandler<T> | MQEventHandler<K>,
  ) {
    return this.commonOn(type, handler, false);
  }

  public once<T extends EventClass>(type: T, handler: EventHandler<T>): EventBus;
  public once<T extends MQEventClass>(type: T, handler: MQEventHandler<T>): EventBus;
  /**
   * 一次性监听事件
   *
   * @param type 事件类型，需要继承自 {@link BaseEvent}
   * @param handler 事件处理函数
   */
  public once<T extends EventClass, K extends MQEventClass>(
    type: T | K,
    handler: EventHandler<T> | MQEventHandler<K>,
  ) {
    return this.commonOn(type, handler, true);
  }

  public off<T extends EventClass>(type: T, handler: EventHandler<T>): EventBus;
  public off<T extends MQEventClass>(type: T, handler: MQEventHandler<T>): EventBus;
  /**
   * 取消监听事件
   *
   * @param type 事件类型，需要继承自 {@link BaseEvent}
   * @param handler 事件处理函数
   */
  public off<T extends EventClass, K extends MQEventClass>(
    type: T | K,
    handler: EventHandler<T> | MQEventHandler<K>,
  ) {
    const info = this.getByKey(type);
    const index = info.handlers.findIndex(h => h.handler === handler);
    if (index >= 0) {
      info.handlers.splice(index, 1);
    }
    return this;
  }

  /**
   * 信号量等待
   *
   * @param sem 信号量，需保证单次唯一
   * @param timeout 超时时间
   * @param destroy 接收后是否销毁信号量
   */
  public async semWait(sem: string, timeout?: number, destroy = true) {
    sem = `$SEM_${sem}`;
    const CLS = this.getEC(sem, BaseMQEvent);

    return new Promise<void>((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined | number;

      /** 完成处理 */
      const ok = () => {
        timer && clearTimeout(timer);
        destroy && this.removeEC(sem);
        setTimeout(() => this.off(CLS, ok), 0);
        resolve();
        return { ack: destroy };
      };

      if (timeout && destroy) {
        timer = setTimeout(() => {
          this.removeEC(sem);
          this.off(CLS, ok);
          reject(new Error(`signal ${sem} timeout`));
        }, timeout);
      }

      this.once(CLS, ok);
    });
  }

  /**
   * 信号量通知
   *
   * @param sem 信号量，需保证单次唯一
   * @param createIfNotExist 如果不存在，是否创建，默认为 true，如 否 则未先等待信号量会丢弃通知
   */
  public semSignal(sem: string, createIfNotExist = true) {
    sem = `$SEM_${sem}`;
    const CLS = this.getEC(sem, BaseMQEvent, createIfNotExist);
    CLS && this.emit(new CLS());
  }

  /**
   * 清除指定类型的事件监听
   *
   * @param type 事件类型，需要继承自 {@link BaseEvent}
   */
  public clearByType<T extends EventClass>(type: T) {
    this.handleMap.delete(type);
    return this;
  }

  /** 清除所有事件监听 */
  public clearAll() {
    this.handleMap.clear();
    return this;
  }

  /**
   * 通用监听
   *
   * @param type 事件类型
   * @param handler 事件处理器
   * @param once 是否仅一次性监听
   */
  protected commonOn<T extends EventClass, K extends MQEventClass>(
    type: T | K,
    handler: EventHandler<T> | MQEventHandler<K>,
    once: boolean,
  ) {
    const info = this.getByKey(type);
    // 防止重复添加
    if (info.handlers.every(h => h.handler !== handler)) {
      info.handlers.push({ handler, once });
    }
    // 如果该事件消息队列中有积压事件，则消息补偿
    if (info.mqEvents.length) {
      // 过滤过期事件
      info.mqEvents = info.mqEvents.filter(data => data.expireTime > Date.now());
      // 执行消息队列中的事件
      info.mqEvents.forEach(data => this.emit(data.evt));
    }

    return this;
  }

  /**
   * 获取待执行消息处理器
   *
   * @param event 事件
   */
  protected getMQHandlers<T extends BaseMQEvent>(event: T) {
    const EventCls = event.constructor as MQEventClass;
    const info = this.getByKey(EventCls);

    // 消息默认入队
    if (info.mqEvents.findIndex(e => e.evt === event) < 0) {
      info.mqEvents.push({ evt: event, expireTime: Date.now() + event.timeout });
    }

    /** 执行器 */
    const runner: MQEventHandler = async () => {
      for (let i = 0; i < info.handlers.length; i++) {
        const handlerInfo = info.handlers[i]!;
        const handler = handlerInfo.handler as MQEventHandler;
        // 防并发命中，先删后补
        if (handlerInfo.once) {
          info.handlers.splice(i, 1);
        }
        const result = await handler(event);
        if (result?.ack) {
          const mqIndex = info.mqEvents.findIndex(e => e.evt === event);
          if (mqIndex >= 0) {
            info.mqEvents.splice(mqIndex, 1);
          }
          break;
        }
        else if (handlerInfo.once) {
          // no ack, 补偿加回去
          info.handlers.push(handlerInfo);
        }
      }
      return { ack: true };
    };
    return [runner];
  }

  /**
   * 获取待执行事件处理器
   *
   * @param event 事件
   */
  protected getEvtHandlers<T extends BaseEvent>(event: T) {
    const EventCls = event.constructor as EventClass;
    const info = this.getByKey(EventCls);
    const waitToRunHandlers = info.handlers.map(h => h.handler);
    // 移除本次执行过的一次性 handler。
    // 注：原实现按升序 index 收集后逐个 splice，多个 once handler 时会因索引位移删错元素，
    // 这里改为一次性 filter，保证只移除 once handler 且保留其余 handler 顺序。
    info.handlers = info.handlers.filter(h => !h.once);
    return waitToRunHandlers;
  }

  /**
   * 获取事件对应的 handler 队列，如果没有则创建空队列
   *
   * @param type 事件
   */
  protected getByKey<T extends EventClass, K extends MQEventClass>(type: T | K): HandlerInfo {
    if (!this.handleMap.has(type)) {
      this.handleMap.set(type, {
        handlers: [],
        mqEvents: [],
      });
    }
    // 上面保证了 map 中一定有对象
    return this.handleMap.get(type)!;
  }
}
