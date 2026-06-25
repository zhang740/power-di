import { afterEach, describe, expect, it, vi } from 'vitest';
import { BaseEvent, BaseMQEvent, EventBus } from '../src';

afterEach(() => {
  vi.useRealTimers();
});

describe('事件总线测试用例', () => {
  describe('普通事件', () => {
    it('基础事件使用', () => {
      class TestEvent extends BaseEvent<{ message: string }> {}

      const eb = new EventBus();
      let received: TestEvent | undefined;
      eb.on(TestEvent, (e) => {
        received = e;
      });
      eb.emit(new TestEvent({ message: 'Hello, World!' }));

      expect(received).toBeInstanceOf(TestEvent);
      expect(received!.data.message).toBe('Hello, World!');
    });

    it('单次监听', () => {
      class TestEvent extends BaseEvent<{ message: string }> {}

      const eb = new EventBus();
      const handler = vi.fn();
      eb.once(TestEvent, handler);

      const event = new TestEvent({ message: 'Hello, Test!' });
      eb.emit(event);
      eb.emit(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('事件移除', () => {
      class TestEvent extends BaseEvent<{ message: string }> {}

      const eb = new EventBus();
      const handler = vi.fn();
      eb.on(TestEvent, handler);
      eb.emit(new TestEvent({ message: 'Hello, Remove!' }));

      eb.off(TestEvent, handler);
      eb.emit(new TestEvent({ message: 'This should not be called' }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('多事件类型互不干扰', () => {
      class EventA extends BaseEvent<{ a: number }> {}
      class EventB extends BaseEvent<{ b: string }> {}

      const eb = new EventBus();
      const hA = vi.fn();
      const hB = vi.fn();
      eb.on(EventA, hA);
      eb.on(EventB, hB);

      eb.emit(new EventA({ a: 42 }));
      eb.emit(new EventB({ b: 'test' }));

      expect(hA).toHaveBeenCalledTimes(1);
      expect(hB).toHaveBeenCalledTimes(1);
    });

    it('事件多次触发累加', () => {
      class TestEvent extends BaseEvent<{ count: number }> {}

      const eb = new EventBus();
      let callCount = 0;
      eb.on(TestEvent, (e) => {
        callCount += e.data.count;
      });

      eb.emit(new TestEvent({ count: 1 }));
      eb.emit(new TestEvent({ count: 2 }));

      expect(callCount).toBe(3);
    });

    it('emitAsync 等待异步处理完成', async () => {
      class AsyncEvent extends BaseEvent<{ message: string }> {}

      const eb = new EventBus();
      const order: string[] = [];
      eb.on(AsyncEvent, async (e) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        order.push(e.data.message);
      });

      await eb.emitAsync(new AsyncEvent({ message: 'Async Hello' }));
      expect(order).toEqual(['Async Hello']);
    });

    it('多个一次性监听触发后全部移除（覆盖 once 删除修复）', () => {
      class TestEvent extends BaseEvent<number> {}

      const eb = new EventBus();
      const h1 = vi.fn();
      const h2 = vi.fn();
      const h3 = vi.fn();
      eb.once(TestEvent, h1);
      eb.once(TestEvent, h2);
      eb.once(TestEvent, h3);

      eb.emit(new TestEvent(1));
      eb.emit(new TestEvent(2));

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
      expect(h3).toHaveBeenCalledTimes(1);
    });

    it('一次性与持久监听混合', () => {
      class TestEvent extends BaseEvent<number> {}

      const eb = new EventBus();
      const onceH = vi.fn();
      const persistH = vi.fn();
      eb.once(TestEvent, onceH);
      eb.on(TestEvent, persistH);

      eb.emit(new TestEvent(1));
      eb.emit(new TestEvent(2));

      expect(onceH).toHaveBeenCalledTimes(1);
      expect(persistH).toHaveBeenCalledTimes(2);
    });
  });

  describe('消息队列', () => {
    it('基础使用：单订阅 + ack 截断后续', async () => {
      class TestMQEvent extends BaseMQEvent<{ message: string }> {}

      const eb = new EventBus();
      const h1 = vi.fn(() => ({ ack: true }));
      const h2 = vi.fn(() => ({ ack: true }));
      eb.on(TestMQEvent, h1);
      eb.on(TestMQEvent, h2);

      await eb.emitAsync(new TestMQEvent({ message: 'Hello, MQ World!' }));

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).not.toHaveBeenCalled();
    });

    it('先发布后监听（积压补偿）', () => {
      class TestMQEvent extends BaseMQEvent<{ message: string }> {}

      const eb = new EventBus();
      eb.emit(new TestMQEvent({ message: 'Delayed Listen' }));

      let received: TestMQEvent | undefined;
      eb.on(TestMQEvent, (e) => {
        received = e;
        return { ack: true };
      });

      expect(received).toBeInstanceOf(TestMQEvent);
      expect(received!.msg.message).toBe('Delayed Listen');
    });

    it('ack:false 时按序触发全部处理器', async () => {
      class TestMQEvent extends BaseMQEvent<{ message: string }> {}

      const eb = new EventBus();
      const h1 = vi.fn(() => ({ ack: false }));
      const h2 = vi.fn(() => ({ ack: false }));
      eb.on(TestMQEvent, h1);
      eb.on(TestMQEvent, h2);

      await eb.emitAsync(new TestMQEvent({ message: 'Hello, MQ Ack!' }));

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it('单次监听（ack 后移除）', async () => {
      class TestEvent extends BaseMQEvent<{ message: string }> {}

      const eb = new EventBus();
      const handler = vi.fn(() => ({ ack: true }));
      eb.once(TestEvent, handler);

      const event = new TestEvent({ message: 'Hello, Test!' });
      await eb.emitAsync(event);
      await eb.emitAsync(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('单次监听未 ack 时第二次仍可触发', async () => {
      class TestEvent extends BaseMQEvent<{ message: string }> {}

      const eb = new EventBus();
      const handler = vi.fn(() => ({ ack: false }));
      eb.once(TestEvent, handler);

      const event = new TestEvent({ message: 'Hello, Test!' });
      await eb.emitAsync(event);
      await eb.emitAsync(event);

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('事件移除', async () => {
      class TestEvent extends BaseMQEvent<{ message: string }> {}

      const eb = new EventBus();
      const handler = vi.fn(() => ({ ack: true }));
      eb.on(TestEvent, handler);
      await eb.emitAsync(new TestEvent({ message: 'Hello, Remove!' }));

      eb.off(TestEvent, handler);
      await eb.emitAsync(new TestEvent({ message: 'This should not be called' }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('超时消息不再补偿', () => {
      class TimeoutEvent extends BaseMQEvent<{ message: string }> {
        timeout = 100;
      }

      const eb = new EventBus();
      vi.useFakeTimers();
      // 无监听者，消息入队，expireTime = now + 100
      eb.emit(new TimeoutEvent({ message: 'will expire' }));
      // 推进超过 timeout
      vi.advanceTimersByTime(101);

      const handler = vi.fn(() => ({ ack: true }));
      eb.on(TimeoutEvent, handler); // 补偿时过滤掉已过期消息

      expect(handler).not.toHaveBeenCalled();
    });

    it('未超时消息可补偿', () => {
      class TimeoutEvent extends BaseMQEvent<{ message: string }> {
        timeout = 100;
      }

      const eb = new EventBus();
      vi.useFakeTimers();
      eb.emit(new TimeoutEvent({ message: 'within' }));
      vi.advanceTimersByTime(50); // 未过期

      const handler = vi.fn(() => ({ ack: true }));
      eb.on(TimeoutEvent, handler);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('信号量', () => {
    it('先通知后等待', async () => {
      const eb = new EventBus();
      eb.semSignal('TestSignal');
      await eb.semWait('TestSignal');
      expect(true).toBe(true);
    });

    it('先等待后通知', async () => {
      const eb = new EventBus();
      const waiting = eb.semWait('TestSignal');
      eb.semSignal('TestSignal');
      await waiting;
      expect(true).toBe(true);
    });

    it('超时未收到信号则拒绝', async () => {
      const eb = new EventBus();
      await expect(eb.semWait('NeverSignaled', 10)).rejects.toBeTruthy();
    });
  });

  describe('总线 API', () => {
    it('清空所有监听', () => {
      class TestEvent extends BaseEvent<{ message: string }> {}

      const eb = new EventBus();
      const handler = vi.fn();
      eb.on(TestEvent, handler);
      eb.emit(new TestEvent({ message: 'Hello, World!' }));

      eb.clearAll();
      eb.emit(new TestEvent({ message: 'Hello, World!' }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('清除指定类型的监听', () => {
      class TestAEvent extends BaseEvent<{ message: string }> {}
      class TestBEvent extends BaseEvent<{ message: string }> {}

      const eb = new EventBus();
      const hA = vi.fn();
      const hB = vi.fn();
      eb.on(TestAEvent, hA);
      eb.on(TestBEvent, hB);

      eb.emit(new TestAEvent({ message: 'A' }));
      eb.emit(new TestBEvent({ message: 'B' }));

      eb.clearByType(TestAEvent);
      eb.emit(new TestAEvent({ message: 'A2' }));
      eb.emit(new TestBEvent({ message: 'B2' }));

      expect(hA).toHaveBeenCalledTimes(1);
      expect(hB).toHaveBeenCalledTimes(2);
    });

    it('onEmit 在广播时触发', () => {
      class TestEvent extends BaseEvent<{ message: string }> {}

      const eb = new EventBus();
      const spy = vi.fn();
      eb.onEmit.on(spy);

      const event = new TestEvent({ message: 'hi' });
      eb.emit(event);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(event);
    });

    it('getEC 通过字符串获取/创建事件类', () => {
      const eb = new EventBus();
      const Evt = eb.getEC('my-event');

      expect(Evt.name).toBe('my-event');
      // 同 key 返回同一个类
      expect(eb.getEC('my-event')).toBe(Evt);
      // createIfNotExist=false 且不存在时返回 undefined
      expect(eb.getEC('not-exist', BaseEvent, false)).toBeUndefined();
    });

    it('字符串事件类可监听与广播', () => {
      const eb = new EventBus();
      const Evt = eb.getEC('str-event');
      const handler = vi.fn();
      eb.on(Evt, handler);

      eb.emit(new Evt());

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('removeEC 移除字符串事件类', () => {
      const eb = new EventBus();
      eb.getEC('tmp');
      eb.removeEC('tmp');

      expect(eb.getEC('tmp', BaseEvent, false)).toBeUndefined();
    });
  });
});
