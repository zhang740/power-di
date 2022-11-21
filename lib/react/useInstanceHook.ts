import { useContext } from 'react';
import type { ClassType } from '../utils';
import { Context } from './context';

/**
 * hooks
 *
 * @param keyOrType interface
 */
export function useInstanceHook<T = undefined, KeyOrType = any>(keyOrType: KeyOrType) {
  const iocContext = useContext(Context);
  return iocContext.get(keyOrType);
}
