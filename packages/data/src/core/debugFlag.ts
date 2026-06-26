/**
 * 调试标记读取工具。
 *
 * 调试标记读取（基于 `localStorage`），保持零依赖且在 SSR / node 环境下安全
 * （无 `localStorage` 时静默返回 undefined，不抛错）。
 * @internal
 */

let debugData: Record<string, any> | undefined;

/**
 * 获取 debug 标记（对齐 `debug` 库基于 `localStorage.debug` 的开关）
 * @internal
 */
export function getDebugFlag() {
  try {
    return localStorage.getItem('debug');
  }
  catch (error) {}
}

/**
 * 获取 debug_data 中的指定键值
 * @internal
 * @param key 键
 */
export function getDebugFlagData(key: string) {
  if (debugData) {
    return debugData[key];
  }
  try {
    debugData = JSON.parse(localStorage.getItem('debug_data') || '{}');
    return debugData![key];
  }
  catch (error) {}
}

/**
 * 设置 debug_data 中的指定键值（也可在 node / 测试中编程式开启）
 * @internal
 * @param key 键
 * @param value 值
 */
export function setDebugFlagData(key: string, value: any) {
  if (!debugData) {
    debugData = {};
  }
  debugData[key] = value;
  try {
    const data = JSON.parse(localStorage.getItem('debug_data') || '{}');
    data[key] = value;
    localStorage.setItem('debug_data', JSON.stringify(data));
  }
  catch (error) {}
}
