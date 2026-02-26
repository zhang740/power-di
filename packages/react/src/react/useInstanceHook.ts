import { useContext } from 'react';
import { Context } from './context';

/**
 * hooks
 *
 * @param keyOrType interface
 */
// eslint-disable-next-line unused-imports/no-unused-vars
export function useInstanceHook<T = undefined, KeyOrType = any>(keyOrType: KeyOrType) {
  const iocContext = useContext(Context);
  return iocContext.get(keyOrType);
}
