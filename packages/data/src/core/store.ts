import type { Operation, Reaction } from './reaction';

// 存储观察对象与反应的关系
const connectionStore = new WeakMap();
const ITERATION_KEY = Symbol('iteration key');

/**
 * 存储可观察对象
 */
export function storeObservable(obj: object) {
  connectionStore.set(obj, new Map());
}

/**
 * 为操作注册反应
 */
export function registerReactionForOperation(
  reaction: Reaction,
  { target, key, type }: { target: any; key?: any; type: string; receiver?: any },
) {
  // 迭代操作使用特殊键
  if (type === 'iterate') {
    key = ITERATION_KEY;
  }

  const reactionsForObj = connectionStore.get(target);
  let reactionsForKey = reactionsForObj.get(key);

  if (!reactionsForKey) {
    reactionsForKey = new Set();
    reactionsForObj.set(key, reactionsForKey);
  }

  if (!reactionsForKey.has(reaction)) {
    reactionsForKey.add(reaction);
    reaction.cleaners?.push(reactionsForKey);
  }
}

/**
 * 获取对应操作的所有反应
 */
export function getReactionsForOperation({ target, key, type }: Operation) {
  const reactionsForTarget = connectionStore.get(target);
  const reactionsForKey = new Set();

  if (type === 'clear') {
    // 清除操作触发所有键的反应
    reactionsForTarget.forEach((_: any, key: any) => {
      addReactionsForKey(reactionsForKey, reactionsForTarget, key);
    });
  }
  else {
    // 常规操作只触发相关键的反应
    addReactionsForKey(reactionsForKey, reactionsForTarget, key);
  }

  // 添加/删除/清除操作会影响迭代
  if (type === 'add' || type === 'delete' || type === 'clear') {
    const iterationKey = Array.isArray(target) ? 'length' : ITERATION_KEY;
    addReactionsForKey(reactionsForKey, reactionsForTarget, iterationKey);
  }

  return reactionsForKey;
}

/**
 * 添加指定键的所有反应
 */
function addReactionsForKey(
  reactionsForKey: Set<unknown>,
  reactionsForTarget: { get: (arg0: any) => any },
  key: string | typeof ITERATION_KEY,
) {
  const reactions = reactionsForTarget.get(key);
  if (reactions) {
    reactions.forEach(reactionsForKey.add, reactionsForKey);
  }
}

/**
 * 释放反应的所有连接
 */
export function releaseReaction(reaction: {
  (...args: any[]): unknown;
  unobserved?: any;
  cleaners?: any;
}) {
  if (reaction.cleaners) {
    reaction.cleaners.forEach(releaseReactionKeyConnection, reaction);
  }
  reaction.cleaners = [];
}

/**
 * 从反应集合中移除当前反应
 */
function releaseReactionKeyConnection(this: any, reactionsForKey: { delete: (arg0: any) => void }) {
  reactionsForKey.delete(this);
}
