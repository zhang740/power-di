import { InternalConfig } from './config';
import { DISABLE_WRITE_ERR, ObservableInfo } from './const';
import { RunnerManager } from './RunnerManager';
import { StackManager } from './StackManager';
import { moLogger } from './util';

// 创建管理器实例
export const runnerManager = new RunnerManager();
export const actionManager = new StackManager(runnerManager.flush.bind(runnerManager));

function joinName(restNames: any[]) {
  return restNames.filter(i => !!i).join(':');
}

/**
 * 检查是否可以写入
 */
function canWrite(target: any, key: string | number) {
  if (!InternalConfig.onlyAllowChangeInAction || actionManager.duringStack) {
    return true;
  }

  // 检查原型链上是否有可写标记
  const proto = Object.getPrototypeOf(target);
  return !!(proto && proto[ObservableInfo] && proto[ObservableInfo][key]);
}

/**
 * 检查是否可写，否则抛出错误
 */

export function writeAbleCheck(target: any, key?: string | number) {
  if (!canWrite(target, key)) {
    throw new Error(DISABLE_WRITE_ERR);
  }
}

/**
 * 创建同步 action
 */
export function createAction(
  originalFunc: Function,
  clsMethodNames?: string | string[],
  inst?: any,
  propKey?: string,
  descriptor?: PropertyDescriptor,
  opts?: string | { actionName?: string; debugger?: boolean },
) {
  if (typeof originalFunc !== 'function') {
    throw new TypeError(`action should must wrap on Function: ${typeof originalFunc}`);
  }

  const actionName = typeof opts === 'string' ? opts : opts?.actionName;

  const restNames = [actionName || ''].concat(clsMethodNames || '');
  const name = joinName(restNames);
  const identity = actionManager.genIdentity(name);

  function wrapper(...args: any[]) {
    const operations: any[] = [];
    if ((opts as any)?.debugger) {
      identity.onOperation = (operation) => {
        operations.push({ ...operation, actionId: identity });
      };
    }
    actionManager.start(identity);
    try {
      return originalFunc.apply(this, args);
    }
    finally {
      actionManager.end(identity);

      if ((opts as any)?.debugger) {
        moLogger.log(`Action: ${identity.identity} executed with operations:`, operations);
      }
    }
  }

  // 设置包装函数的名称
  if (restNames.length) {
    Object.defineProperty(wrapper, 'name', {
      configurable: true,
      writable: false,
      enumerable: false,
      value: name,
    });
  }

  return wrapper;
}

/**
 * 创建异步 action
 */
export function createAsyncAction(originalFunc: Function, ...restNames: any[]) {
  if (typeof originalFunc !== 'function') {
    throw new TypeError(`action should must wrap on Function: ${typeof originalFunc}`);
  }

  const name = joinName(restNames);
  const actionId = actionManager.genIdentity(name);

  function wrapper(...args: any[]) {
    const start = () => {
      actionManager.start(actionId);
    };

    const end = () => {
      actionManager.end(actionId);
    };

    let res;
    try {
      start();
      res = originalFunc.apply(this, args);

      if (!res || !res.then || typeof res.then !== 'function') {
        throw new Error(`asyncAction should must wrap on Async Function: ${originalFunc.name}`);
      }

      // 处理 Promise 完成时结束事务
      if (res.finally) {
        res.finally(end);
      }
      else {
        res.then(end);
        res.catch(end);
      }
    }
    catch (err) {
      end();
      throw err;
    }

    return res;
  }

  // 设置包装函数的名称
  if (restNames.length) {
    Object.defineProperty(wrapper, 'name', {
      configurable: true,
      writable: false,
      enumerable: false,
      value: name,
    });
  }

  return wrapper;
}

/**
 * 在一个临时 action 中运行函数
 *
 * @deprecated 不要使用该方法, 请在 service 实现, 并使用 action 装饰器
 */
export function runInAction(fn: any, actionName?: string) {
  return createAction(fn, actionName)();
}

export function execSyncAndRunObserverImmediately(
  fn: () => any,
  opts: { before: () => void; actionName: string; after: () => void },
) {
  try {
    opts.before();
    const duringStack = actionManager.duringStack;
    const modified = runnerManager.runners.size > 0;
    const res = fn();
    if (!duringStack || (duringStack && !modified)) {
      flush(opts.actionName);
    }
    opts.after();
    return res;
  }
  catch (e) {
    opts.after();
    throw e;
  }
}

export function flush(actionName: string, uuid?: string) {
  runnerManager.flush(actionName, uuid);
}
