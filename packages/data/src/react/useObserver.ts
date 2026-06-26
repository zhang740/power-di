import type { ConnectOptions } from './observer';
import { useDebugValue, useEffect, useRef, useState } from 'react';
import { InternalConfig } from '../core/config';
import { getDebugFlagData } from '../core/debugFlag';
import { observe } from '../core/observable';
import { moLogger, shallowEqual } from '../core/util';
import { customDelayFunc } from './functionDebounceQueue';
import { deepWatchChildrenProps } from './util';

export function useObserver<T>(
  fn: (...args: any[]) => T,
  baseComponentName?: string,
  opts?: ConnectOptions,
  args?: any[],
): T {
  const compName: string = baseComponentName || (fn as any).displayName || fn.name || '[unknown]';
  const forceUpdate = useForceUpdate();

  const debugData = useRef<any>({});
  const ref = useRef<ReturnType<typeof createObserve<any>>>();

  const makeObserve = () => {
    const useDebugger = (opts?.debugger || getDebugFlagData('mo')) as boolean | string | undefined;
    const compNameLower = useDebugger ? compName.toLowerCase() : '';
    const useDebuggerStr = typeof useDebugger === 'string' ? useDebugger.toLowerCase() : '';

    const scheduler = () => {
      if (!ref.current) {
        console.warn('useObserver: ref.current is null, this should not happen.', compName);
        return;
      }
      if (ref.current.mounted) {
        forceUpdate();
      }
      else {
        ref.current();
        ref.current = null as any;
      }
    };
    scheduler.__name = compName;
    scheduler.__reaction = ref.current;

    const delayFunc = customDelayFunc(scheduler, opts?.delay ?? InternalConfig.defaultConnectDelay);

    const dispose = createObserve(
      (...fnArgs: any[]) => {
        try {
          if (useDebugger) {
            debugData.current = {
              deps: [],
            };
          }
          const enable = useDebuggerStr ? compNameLower.includes(useDebuggerStr) : false;
          if (enable) {
            moLogger.log('[useObserver]', compName, 'start...');
          }
          const result = fn(...fnArgs);
          if (opts?.deepMode) {
            deepWatchChildrenProps(result);
          }
          if (enable) {
            moLogger.log('[useObserver]', compName, 'end');
          }
          return result;
        }
        catch (error) {
          console.error('useObserver: error in observed function', compName, error);
          throw error;
        }
      },
      {
        lazy: true,
        scheduler: delayFunc,
        debugger: (op) => {
          if (!useDebugger) {
            return;
          }

          debugData.current.deps.push({ oldValue: op.target?.[op.key], ...op });

          if (!useDebuggerStr || !compNameLower.includes(useDebuggerStr)) {
            return;
          }
          moLogger.log('[useObserver]', compName, op.type, op.key);
        },
      },
    );
    dispose.$reaction.__name = compName;
    (dispose as any).cancelRender = delayFunc.cancel;
    return dispose;
  };

  if (!ref.current) {
    ref.current = makeObserve();
    scheduleCleanupOfReactionIfLeaked(ref);
  }

  useEffect(() => {
    recordReactionAsCommitted(ref);
    if (ref.current) {
      ref.current.mounted = true;
    }
    else {
      // 如果 ref.current 已经被清理，重新创建一个新的观察
      ref.current = makeObserve();
      ref.current.mounted = true;
      forceUpdate();
    }

    return function () {
      (ref.current as any)?.cancelRender?.();
      ref.current?.();
      ref.current = null as any;
    };
  }, []);

  useDebugValue(ref.current, (r) => {
    const data = debugData.current || {};
    data.deps?.forEach((x: any) => {
      x.deepEqual = 'receiver' in x ? shallowEqual(x.target?.[x.key], x.oldValue) : undefined;
    });
    return {
      debugGenTime: Date.now(),
      reaction: r.$reaction,
      mounted: r.mounted,
      cleanAt: new Date(r.cleanAt).toLocaleString(),
      ...data,
    };
  });

  (ref.current as any).cancelRender?.();
  const result = ref.current.$reaction(...(args || []));
  return result as T;
}

type ReactionDispose<T = any> = ReturnType<typeof observe<T>> & {
  cleanAt: number;
  mounted?: boolean;
};

function createObserve<T = any>(...args: Parameters<typeof observe<T>>) {
  const dispose = observe(...args) as any;
  dispose.cleanAt = Date.now() + 10000; // 10 秒后自动清理
  return dispose as ReactionDispose<T>;
}

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick(tick => tick + 1);
}

const uncommittedReactionRefs = new Set<{ current: ReactionDispose }>();
let reactionCleanupHandle: any;

function ensureCleanupTimerRunning() {
  if (reactionCleanupHandle === undefined) {
    reactionCleanupHandle = setTimeout(cleanUncommittedReactions, 10000);
  }
}

function scheduleCleanupOfReactionIfLeaked(ref: any) {
  uncommittedReactionRefs.add(ref);
  ensureCleanupTimerRunning();
}

function recordReactionAsCommitted(reactionRef: any) {
  uncommittedReactionRefs.delete(reactionRef);
}

function cleanUncommittedReactions() {
  reactionCleanupHandle = undefined;

  const now = Date.now();

  for (const ref of uncommittedReactionRefs.values()) {
    const dispose = ref.current;

    if (dispose) {
      if (now >= dispose.cleanAt) {
        dispose();
        ref.current = null as any;
        uncommittedReactionRefs.delete(ref);
      }
    }
  }

  if (uncommittedReactionRefs.size > 0) {
    ensureCleanupTimerRunning();
  }
}
