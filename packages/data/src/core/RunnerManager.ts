import { getDebugFlagData } from './debugFlag';
import { queueReaction } from './reaction';
import { moLogger } from './util';

/**
 * 运行管理器
 */
export class RunnerManager {
  uuid = 0;
  runners = new Map();
  flush(actionName: string, uuid: any) {
    actionName = actionName || 'OB_UTIL_FLUSH';
    uuid = typeof uuid === 'undefined' ? this.uuid++ : uuid;

    const todoCopy = this.runners;
    this.runners = new Map();

    todoCopy.forEach((operation, reaction) => {
      if (getDebugFlagData('mo')) {
        moLogger.log('action:操作触发响应', uuid, reaction.__name, reaction.__gid, {
          reaction,
          operation,
        });
      }
      queueReaction(reaction, operation, actionName, uuid);
    });
  }

  /**
   * 添加反应到队列
   */
  add(reaction: any, operation: any) {
    this.runners.set(reaction, operation);
  }
}
