import { describe, expect, it, vi } from 'vitest';
import { EventDelegate } from '../src';

describe('事件委托测试用例', () => {
  it('基础事件委托使用', () => {
    const delegate = new EventDelegate<{ message: string }>();
    const handler = vi.fn();
    delegate.on(handler);
    delegate.emit({ message: 'Hello, Delegate!' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ message: 'Hello, Delegate!' });
  });

  it('单次委托监听', () => {
    const delegate = new EventDelegate<{ message: string }>();
    const handler = vi.fn();
    delegate.once(handler);

    delegate.emit({ message: 'Hello, Once!' });
    delegate.emit({ message: 'This should not be called' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ message: 'Hello, Once!' });
  });

  it('委托移除', () => {
    const delegate = new EventDelegate<{ message: string }>();
    const handler = vi.fn();

    delegate.on(handler);
    delegate.emit({ message: 'Hello, Remove!' });

    delegate.off(handler);
    delegate.emit({ message: 'This should not be called' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ message: 'Hello, Remove!' });
  });

  it('重复添加同一处理器只生效一次', () => {
    const delegate = new EventDelegate<number>();
    const handler = vi.fn();

    delegate.on(handler);
    delegate.on(handler);
    delegate.emit(1);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('多处理器按添加顺序执行', () => {
    const delegate = new EventDelegate<number>();
    const calls: number[] = [];
    delegate.on(() => calls.push(1));
    delegate.on(() => calls.push(2));
    delegate.on(() => calls.push(3));

    delegate.emit(0);

    expect(calls).toEqual([1, 2, 3]);
  });

  it('事件委托获取返回值', () => {
    const delegate = new EventDelegate<number, number>();
    delegate.on(event => event * 2);

    const result = delegate.invoke(42);
    expect(result).toBe(84);
  });

  it('事件委托嵌套调用', () => {
    const delegate = new EventDelegate<number, number>();
    delegate.on(event => event + 1);
    delegate.on(event => event * 2);

    const result = delegate.invoke(21);
    expect(result).toBe(44); // (21 + 1) * 2
  });
});
