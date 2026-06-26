import type { ConnectOptions, IReactComponent } from './observer';
import { observer } from './observer';

/**
 * 具名观察组件转换
 *
 * @param name 名称
 * @param fc 组件
 */
export function observerWithName<T extends IReactComponent>(
  name: string,
  fc: T,
  opts?: ConnectOptions,
): T {
  return observer(fc, { name, ...opts }) as T;
}
