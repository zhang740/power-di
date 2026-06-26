import type { Operation } from './reaction';
import { getDebugFlagData } from './debugFlag';
import { moLogger } from './util';

export interface StackItem {
  identity: string;
  suffix: string;
  onOperation?: (operation: Operation) => void;
}

/**
 * 栈管理器，用于管理事务栈
 */
export class StackManager {
  uuid = 0;
  stacks: StackItem[] = [];
  onFlush: ((actionName: any, uuid: any) => void) | null = null;

  constructor(onFlush: ((actionName: any, uuid: any) => void) | null) {
    this.onFlush = onFlush;
  }

  /**
   * 生成唯一ID
   */
  genIdentity(suffix: any) {
    const current = this.uuid++;
    return {
      identity: [current, suffix || ''].join('@@'),
      suffix: suffix || '',
    } as StackItem;
  }

  /**
   * 开始事务
   */
  start(target: StackItem) {
    this.stacks.push(target);
    if (getDebugFlagData('mo') && this.stacks.length === 1) {
      moLogger.log('action:事务开始', target?.identity);
    }
  }

  /**
   * 结束事务
   */
  end(target: StackItem) {
    if (getDebugFlagData('mo') && this.stacks.length === 1) {
      moLogger.log('action:事务结束', target?.identity);
    }
    const lastStack = this.stacks[this.stacks.length - 1];

    // 处理嵌套事务的情况
    if (lastStack !== target) {
      const targetIndex = this.stacks.findIndex(s => s === target);
      if (targetIndex !== -1) {
        if (targetIndex === 0) {
          throw new Error('transaction flush with task left');
        }
        this.stacks.splice(targetIndex, 1);
      }
      else {
        throw new Error('transaction end not found');
      }
    }
    else {
      this.stacks.pop();
    }

    // 如果栈已清空，触发刷新
    if (!this.duringStack) {
      this.onFlush && this.onFlush(target?.suffix, target?.identity);
    }
  }

  /**
   * 是否有正在进行的事务
   */
  get duringStack() {
    return this.stacks.length > 0;
  }

  get currentStack() {
    return this.stacks[this.stacks.length - 1];
  }

  debugOnOperation(operation: Operation) {
    this.currentStack?.onOperation?.(operation);
  }
}
