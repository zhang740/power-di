import { createAction, createAsyncAction } from '../core/action';
import { decoratorFactory } from '../core/decoratorFactory';
import { topObservable } from '../core/observable';
import { createComputed } from './computed';

/** 推荐加上 actionName 便于排查 */
export const action = decoratorFactory<{
  (actionName?: string): any;
  /** 不要这么使用，这只是当 runInAction 用，所有变更都应该在 service 上 */
  <T extends Function = any>(fc?: T): T;
  (opts?: { actionName?: string; debugger?: boolean }): any;
  (target: any, key: any): any;
  bound: (...args: any[]) => any;
}>(createAction, createAction, {
  supportCustomParam: true,
});

/**
 * 异步函数的 action
 * 注意：异步过程内，被插入执行的其他函数执行，即使未包裹 action，如果有对 observable 的修改，也会被当作 action 处理，且算在当前 action 内
 */
export const actionAsync = decoratorFactory<{
  (actionName?: string): any;
  /** 不要这么使用，这只是当 runInAction 用，所有变更都应该在 service 上 */
  <T extends Function = any>(fc?: T): T;
  (opts?: { actionName?: string; debugger?: boolean }): any;
  (target: any, key: any): any;
}>(createAsyncAction, createAsyncAction, {
  supportCustomParam: true,
});

action.bound = (...args: any[]) => {
  return action(...args);
};

export const computed = decoratorFactory<{
  /** 不要这么使用，应该在 service 上 */
  <T extends Function = any>(fc?: T): T;
  (opts?: { debugger?: boolean }): any;
  (target: any, key: any): any;
}>(createComputed, undefined, { supportCustomParam: true });

export const observable = decoratorFactory<{
  (target: any): any;
  (target: any, key: any): any;
}>(topObservable, topObservable, { isObservableValue: true });
