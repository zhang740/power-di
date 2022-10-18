import { FunctionContext, AspectPoint, getMetadata } from '../class/metadata';
import { IocContext } from '../IocContext';

/* istanbul ignore next */
const normalFn = function normalFn() {};
/* istanbul ignore next */
const generatorFn = function* () {};

const normalFuncPrototype = Object.getPrototypeOf(normalFn);
const generatorFuncPrototype = Object.getPrototypeOf(generatorFn);
function isGeneratorFunction(fn: any) {
  // if use some transformer, generator is polyfill maybe.
  return (
    typeof fn === 'function' &&
    normalFuncPrototype !== generatorFuncPrototype &&
    Object.getPrototypeOf(fn) === generatorFuncPrototype
  );
}

export type Throwable = Error | any;

function run(func: any, context: FunctionContext) {
  func && func(context);
}

function createContext(ioc: IocContext, inst: any, fn: Function, args: any[]) {
  return {
    ioc,
    functionName: (fn as any).__name || fn.name,
    inst,
    data: {},
    args,
  } as FunctionContext;
}

export function genAspectWrapper(ioc: IocContext, point: AspectPoint, oriFn: Function) {
  let newFn: any;

  if (isGeneratorFunction(oriFn)) {
    newFn = function* (...args: any[]): Generator {
      const context = createContext(ioc, this, oriFn, args);
      try {
        run(point.before, context);
        if (!context.skipRunning) {
          context.ret = yield oriFn.apply(this, context.args);
        }
        run(point.after, context);
        return context.ret;
      } catch (error) {
        context.err = error;
        run(point.error, context);
        if (context.err) {
          throw context.err;
        }
      }
    };
  } else {
    newFn = function (...args: any[]) {
      const context = createContext(ioc, this, oriFn, args);
      try {
        run(point.before, context);
        if (!context.skipRunning) {
          context.ret = oriFn.apply(this, context.args);
        }
        if (context.ret instanceof Promise) {
          context.ret = context.ret.then(ret => {
            context.ret = ret;
            run(point.after, context);
            return context.ret;
          });
          if (point.error) {
            context.ret = (context.ret as Promise<any>).catch(error => {
              context.err = error;
              run(point.error, context);
              if (context.err) {
                throw context.err;
              }
            });
          }
          return context.ret;
        } else {
          run(point.after, context);
          return context.ret;
        }
      } catch (error) {
        context.err = error;
        run(point.error, context);
        if (context.err) {
          throw context.err;
        }
      }
    };
  }

  newFn.__name = (oriFn as any).__name || oriFn.name;
  return newFn;
}

export function aspect<T = {}, K = {}>(point: AspectPoint<T, K> = {}): MethodDecorator {
  return (target, key) => {
    getMetadata(target.constructor).aspects.push({
      key,
      point,
    });
  };
}
