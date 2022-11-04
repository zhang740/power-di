import { useContext } from 'react';
import type { ClassType } from '../utils';
import { Context } from './context';

/**
 * hooks
 *
 * @param ifs interface
 */
export function useInstanceHook<C extends ClassType>(ifs: C) {
  const iocContext = useContext(Context);
  return iocContext.get<C>(ifs);
}
