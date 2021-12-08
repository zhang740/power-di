export function guard<T>(f: () => T, opt: { defaultValue?: T; onError?: (e: Error) => void } = {}) {
  try {
    return f();
  } catch (error) {
    opt.onError?.(error);
    return opt.defaultValue;
  }
}
