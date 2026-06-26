import type { Reaction, ReactionScheduler } from './reaction';
import { proxyToRaw, rawToProxy } from './coreData';
import { baseHandlers, getHandlers, shouldInstrument } from './handlers';
import { IS_REACTION, runAsReaction } from './reaction';
import { releaseReaction, storeObservable } from './store';

let gid = 1;
export function observe<T = any>(
  fn: T,
  options: {
    lazy?: boolean;
  } & Pick<
    Reaction,
    'debugger' | 'scheduler' | 'reactionInAction' | 'reactionInReaction' | 'tag'
  > = {},
) {
  // wrap the passed function in a reaction, if it is not already one
  const reaction: Reaction = fn[IS_REACTION]
    ? fn
    : (function reaction(this: any) {
        return runAsReaction(reaction as any, fn as any, this, arguments);
      } as any);

  Object.assign(reaction, options);

  // save the fact that this is a reaction
  reaction[IS_REACTION] = true;
  reaction.__gid = gid++;
  reaction.__name = (fn as any).name || (options as any).__name || '[unnamed reaction]';
  // initially, the reaction is not unobserved
  reaction.unobserved = false;
  // run the reaction once if it is not a lazy one
  if (!options.lazy) {
    reaction();
  }
  const dispose = () => {
    unobserve(reaction);
  };
  dispose.$reaction = reaction;
  return dispose;
}

export function unobserve(reaction: Reaction): void {
  // do nothing, if the reaction is already unobserved
  if (!reaction.unobserved) {
    // indicate that the reaction should not be triggered any more
    reaction.unobserved = true;
    // release (obj -> key -> reaction) connections
    releaseReaction(reaction);
  }
  // unschedule the reaction, if it is scheduled
  if (typeof reaction.scheduler === 'object') {
    (reaction.scheduler as ReactionScheduler).delete?.(reaction);
  }
}

export function topObservable(obj: any) {
  if (obj?.constructor === Function) {
    class ObservableClass extends (obj as any) {
      constructor(...args: any[]) {
        super(...args);
        const data = createObservable(this);
        return data;
      }
    }
    Object.defineProperty(ObservableClass, 'name', { value: (obj as any).name });
    return ObservableClass;
  }
  return observable(obj);
}

export function observable(obj: any): any {
  // 基础类型则返回
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (typeof (obj as any).toJSON === 'function') {
    if ((obj as any).toJSON()?.type === 'power-di.IocContext') {
      return obj;
    }
  }
  // if it is already an observable or it should not be wrapped, return it
  if (proxyToRaw.has(obj) || !shouldInstrument(obj)) {
    return obj;
  }
  // if it already has a cached observable wrapper, return it
  // otherwise create a new observable
  return rawToProxy.get(obj) || createObservable(obj);
}

function createObservable(obj: any) {
  // if it is a complex built-in object or a normal object, wrap it
  const handlers = getHandlers(obj) || baseHandlers;
  const observable = new Proxy(obj, handlers);
  // save these to switch between the raw object and the wrapped object with ease later
  rawToProxy.set(obj, observable);
  proxyToRaw.set(observable, obj);
  // init basic data structures to save and cleanup later (observable.prop -> reaction) connections
  storeObservable(obj);
  return observable;
}
