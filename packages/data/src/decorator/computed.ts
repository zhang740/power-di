import type { Operation, Reaction } from '../core/reaction';
import { actionManager, runInAction } from '../core/action';
import { InternalConfig } from '../core/config';
import { getDebugFlagData } from '../core/debugFlag';
import { observable, observe } from '../core/observable';
import { onReactionInReaction } from '../core/reaction';
import { deleteMetadata, getMetadata, moLogger } from '../core/util';

/** 计算属性 */
export function createComputed(
  fn: Function,
  names?: [string, string],
  target?: any,
  propKey?: any,
  descriptor?: PropertyDescriptor,
  opts: { debugger?: boolean } = {},
) {
  const debugName = `#COMPUTED__${names ? names.join('.') : fn.name || 'anonymous'}`;
  if (!opts.debugger) {
    opts.debugger = false;
  }
  const ComputedData = Symbol(`ComputedData_${debugName}`);
  const getDefaultMetadata = () => ({
    data: observable({ ver: 0 }) as Partial<{
      result: any;
    }>,
    deps: [] as Operation[],
    oldValues: [] as any[],
    opts,
    lastReason: '',
    tracker: undefined as
      | (ReturnType<typeof observe> & {
        $reaction: {
          changed?: boolean;
        };
      })
      | undefined,
    computedDeps: [] as (Reaction & { changed?: boolean })[],
  });
  return function (this: any) {
    const metadata = getMetadata(this ?? {}, ComputedData, getDefaultMetadata);

    // 只会执行一次
    if (!metadata.tracker) {
      let inTracking = false;

      const runner = () => {
        try {
          if (metadata.tracker) {
            metadata.tracker.$reaction.changed = false;
          }
          metadata.computedDeps = [];
          metadata.deps = [];
          metadata.oldValues = [];
          inTracking = true;

          const result = fn.apply(this);

          runInAction(() => {
            metadata.data.result = result;
          }, `${debugName}_computedTracker`);
        }
        catch (error) {
          console.error(debugName, '计算属性执行出错:', error, fn);
          throw error;
        }
        finally {
          inTracking = false;
        }
        if (opts.debugger) {
          moLogger.log(debugName, '计算依赖:', metadata.deps);
        }
      };
      Object.defineProperty(runner, 'name', {
        value: `${debugName}_runner`,
      });
      metadata.tracker = observe(runner, {
        tag: ['@computed'],
        scheduler: (r, actionName) => {
          metadata.lastReason = actionName;
          if (opts.debugger) {
            moLogger.log(debugName, '有依赖变更, 触发源:', actionName);
          }
          if (metadata.tracker?.$reaction.changed === true) {
            r();
          }
        },
        debugger: (op) => {
          if (!inTracking) {
            return;
          }

          metadata.deps.push(op);
          metadata.oldValues.push(op.target[op.key]);

          if (op.type === 'set') {
            console.error('计算属性中有赋值操作！', fn.name, op, fn);
          }
        },
        reactionInAction: (op) => {
          if (metadata.tracker) {
            metadata.tracker.$reaction.changed = true;
          }
        },
        reactionInReaction: (r) => {
          if (!r.tag?.includes('@computed')) {
            return;
          }
          metadata.computedDeps.push(r);
        },
      });

      const computedDestroy = () => {
        if (metadata.tracker) {
          if (getDebugFlagData('mo') || opts.debugger) {
            moLogger.log(debugName, '销毁计算属性的追踪');
          }
          metadata.tracker();
          metadata.tracker = undefined;
          deleteMetadata(this, ComputedData);
        }
      };
      // 解耦：源仓库此处依赖 DI 的 getInstanceMetadata(this).destroyTasks，
      // 这里改为可插拔钩子（默认 no-op），由使用方按需注入 DI 生命周期联动。
      InternalConfig.registerInstanceDispose?.(this, computedDestroy);
    }
    else if (actionManager.duringStack) {
      const trackers = [
        metadata.tracker.$reaction,
        ...metadata.computedDeps,
      ] as (typeof metadata.tracker.$reaction)[];
      if (trackers.some(r => r.changed)) {
        if (opts.debugger) {
          moLogger.log(
            debugName,
            '依赖变更, 触发源:',
            metadata.lastReason,
            '变更的依赖:',
            metadata.deps.filter((dep, index) => {
              return dep.target[dep.key] !== metadata.oldValues[index];
            }),
          );
        }
        // 重新计算
        metadata.tracker.$reaction();
      }
      else {
        // 不需要重算情况下补偿触发
        onReactionInReaction(metadata.tracker.$reaction);
      }
    }
    else {
      // 不需要重算情况下补偿触发
      onReactionInReaction(metadata.tracker.$reaction);
    }

    return metadata.data.result;
  };
}
