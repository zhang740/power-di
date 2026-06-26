import { createLogger } from '../core/logger';

const logger = createLogger('functionDebounceQueue');

let debounceTimer: any;
/** 函数队列 */
const functionQueue: {
  /** 执行函数 */
  fn: Function;
  /** 预期执行时间 */
  runTime: number;
}[] = [];

// 延迟函数
export function customDelayFunc(fn: () => any, delay?: number | Function | false) {
  if (delay === false) {
    return fn;
  }
  else if (typeof delay === 'number') {
    return addDebounceQueue(fn, delay);
    // return debounce(fn, delay);
  }
  else if (typeof delay === 'function') {
    return delay(fn);
  }
  return fn;
}

/**
 * 添加到队列中
 *
 * @param func 函数
 * @param wait 延迟时间
 */
export function addDebounceQueue(func: Function, wait: number) {
  const run = () => {
    const runTime = Date.now() + wait;
    functionQueue.push({ fn: func, runTime });
    runDebounceQueue();
  };

  const cancel = () => {
    const index = functionQueue.findIndex(item => item.fn === func);
    if (index !== -1) {
      functionQueue.splice(index, 1);
    }
  };

  const debounceFn = () => {
    cancel();
    run();
  };
  debounceFn.cancel = cancel;

  run();
  return debounceFn;
}

let delayTime = 0;
/**
 * 执行队列中的函数
 * 注意：此函数需要在合适的时机调用，例如在事件循环的空闲时间
 */
function runDebounceQueue(delay = 0) {
  const now = Date.now();
  if (!delayTime) {
    delayTime = now;
  }

  if (debounceTimer) {
    // 超过 16ms 则不再持续延后
    if (functionQueue.length && now - delayTime > 16) {
      logger.log(
        `runDebounceQueue: force run, delay: ${Date.now() - delayTime}ms`,
        functionQueue.length,
      );
      return;
    }
    // debounce 先取消
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }

  if (functionQueue.length === 0) {
    delayTime = 0;
    return;
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = undefined;
    logger.log(
      `runDebounceQueue: ${functionQueue.length} functions to run, delay: ${Date.now() - delayTime}ms`,
    );
    delayTime = 0;

    if (!functionQueue.length) {
      return;
    }

    const currentQueue = functionQueue.splice(0);

    const now = Date.now();
    let nextDelay: number | undefined;
    for (const item of currentQueue) {
      if (item.runTime > now) {
        // 如果函数的预期执行时间还未到，则不执行
        nextDelay = Math.min(item.runTime - now, nextDelay ?? Infinity);
        functionQueue.push(item);
        continue;
      }
      item.fn();
    }
    runDebounceQueue(nextDelay); // 递归调用以处理下一个函数
  }, delay);
}
