/**
 * 内部配置对象
 * @internal
 */
export const InternalConfig = {
  /** 是否跳过相同值的变更 */
  skipSameValueChange: true,
  /** 是否只允许在 action 中修改数据 */
  onlyAllowChangeInAction: true,
  /** 默认 connect 防抖延迟（数字为毫秒；false 表示同步、不防抖；函数为自定义调度） */
  defaultConnectDelay: 0 as number | false | ((fn: () => any) => any),
  /**
   * 注册「实例销毁」回调的可插拔钩子。
   *
   * `@computed` 会在首次执行时把追踪器的 dispose 注册到此处，使其能随宿主实例
   * 销毁而自动释放。默认 no-op（仅依赖 React 卸载路径与 GC）；如需与 DI 生命周期
   * （如 `@power-di/di` 的 `@preDestroy`）联动，由使用方通过 `setMoConfig` 注入。
   *
   * @param instance 宿主实例（声明 `@computed` 的对象）
   * @param dispose 释放该计算属性追踪器的函数
   */
  registerInstanceDispose: undefined as
  | undefined
  | ((instance: any, dispose: () => void) => void),
};

/**
 * 配置函数，用于设置库的行为
 * @internal
 *
 * @param config 配置对象
 */
export function setMoConfig(config: Partial<typeof InternalConfig> = {}) {
  Object.assign(InternalConfig, config);
  return InternalConfig;
}
