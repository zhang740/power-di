import type { StackItem } from './StackManager';
import { actionManager, runnerManager } from './action';
import { getDebugFlagData } from './debugFlag';
import { getReactionsForOperation, registerReactionForOperation, releaseReaction } from './store';
import { moLogger } from './util';

export interface Operation {
  target: any;
  key?: any;
  value?: any;
  type: string;
  oldValue?: any;
  oldTarget?: Map<any, any> | Set<any>;
  receiver?: any;
}

// 反应栈
const reactionStack: Reaction[] = [];
let isDebugging = false;

export const IS_REACTION = Symbol('is reaction');

export interface ReactionScheduler {
  (r: () => any, ...args: any[]): void;
  add?: (reaction: Reaction) => void;
  delete?: (reaction: Reaction) => void;
}

export interface Reaction {
  /** 销毁反应 */
  (...args: any[]): unknown;
  unobserved?: boolean;
  /** 反应依赖 */
  cleaners?: Set<Reaction>[];
  /** 反应执行器 */
  scheduler?:
    | ReactionScheduler
    | { add: (reaction: Reaction) => void; delete: (reaction: Reaction) => void };
  /** 标记 */
  tag?: string[];
  /** 反应执行中触发操作 */
  debugger?: (op: Operation) => void;
  /** 在 action 中触发了反应 */
  reactionInAction?: (op: Operation, action: StackItem) => void;
  /** 在反应过程中触发了新反应 */
  reactionInReaction?: (reaction: Reaction) => void;
  __gid?: number;
  __name?: string;
  [IS_REACTION]: boolean;
}

/**
 * 作为反应运行函数
 */
export function runAsReaction(
  reaction: Reaction,
  fn: {
    (this: any, ...args: readonly any[]): unknown;
  },
  context: any,
  args: IArguments | readonly any[],
): Reaction | undefined {
  if (reaction.unobserved) {
    return Reflect.apply(fn, context, args);
  }

  if (!reactionStack.includes(reaction)) {
    releaseReaction(reaction);
    try {
      onReactionInReaction(reaction);
      reactionStack.push(reaction);
      if (getDebugFlagData('mo')) {
        moLogger.log('runAsReaction:运行反应', reaction.__name, reaction.__gid);
      }
      const result = Reflect.apply(fn, context, args);
      if (getDebugFlagData('mo')) {
        moLogger.log('runAsReaction:反应结束', reaction.__name, reaction.__gid);
      }
      return result;
    }
    finally {
      reactionStack.pop();
    }
  }
}

export function onReactionInReaction(reaction: Reaction) {
  reactionStack.forEach(r => r.reactionInReaction?.(reaction));
}

/**
 * 注册当前运行的反应
 */
export function registerRunningReactionForOperation(operation: {
  target: any;
  key?: any;
  type: string;
  receiver?: any;
}) {
  const runningReaction = reactionStack[reactionStack.length - 1];
  if (runningReaction) {
    debugOperation(runningReaction, operation);
    registerReactionForOperation(runningReaction, operation);
  }
}

/**
 * 为操作队列反应
 */
export function queueReactionsForOperation(operation: Operation) {
  const duringStack = actionManager.duringStack;
  actionManager.debugOnOperation(operation);

  const inDebugMode = getDebugFlagData('mo');
  if (inDebugMode) {
    moLogger.log('action:操作数据', operation, [...actionManager.stacks]);
  }

  getReactionsForOperation(operation).forEach((reaction: Reaction) => {
    // 如果反应在观测中，后续不触发执行
    if (reactionStack.includes(reaction)) {
      if (inDebugMode) {
        moLogger.log('action:反应已在运行栈中', reaction.__name, reaction.__gid);
      }
      return;
    }
    if (duringStack) {
      runnerManager.add(reaction, operation);
      reaction.reactionInAction?.(operation, actionManager.currentStack!);
    }
    else {
      queueReaction(reaction, operation);
    }
  });
}

/**
 * 队列反应执行
 */
export function queueReaction(
  reaction: Reaction,
  operation: any,
  actionName?: string,
  uuid?: string,
) {
  debugOperation(reaction, operation);

  if (typeof reaction.scheduler === 'function') {
    reaction.scheduler(reaction, actionName, uuid);
  }
  else if (reaction.scheduler && typeof reaction.scheduler === 'object') {
    reaction.scheduler.add(reaction);
  }
  else {
    reaction(actionName, uuid);
  }
}

/**
 * 调试操作
 */
export function debugOperation(reaction: Reaction, operation: any) {
  if (reaction.debugger && !isDebugging) {
    try {
      isDebugging = true;
      reaction.debugger(operation);
    }
    finally {
      isDebugging = false;
    }
  }
}

/**
 * 是否有正在运行的反应
 */
export function hasRunningReaction() {
  return reactionStack.length > 0;
}
