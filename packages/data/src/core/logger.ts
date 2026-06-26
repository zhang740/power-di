import { getDebugFlag } from './debugFlag';

/**
 * 极简日志封装（替代基于 `debug` 库的实现）。
 *
 * 零运行时依赖：默认静默，仅在开启 debug（`localStorage.debug` 非空）时输出，
 * 对齐原 `debug` 库基于命名空间开关的行为。
 * @internal
 */

type LogFn = (formatter: any, ...args: any[]) => void;

export interface Logger {
  log: LogFn;
  warn: LogFn;
  error: LogFn;
  info: LogFn;
}

function makeLogFn(level: 'log' | 'warn' | 'error' | 'info', name: string): LogFn {
  return (formatter: any, ...args: any[]) => {
    if (!getDebugFlag()) {
      return;
    }
    const fn = (console as any)[level] || console.log;
    fn(`[power-di:${name}:${level}]`, formatter, ...args);
  };
}

export function createLogger(name: string): Logger {
  return {
    log: makeLogFn('log', name),
    warn: makeLogFn('warn', name),
    error: makeLogFn('error', name),
    info: makeLogFn('info', name),
  };
}
