import { isValidElement } from 'react';
import { isObservable } from '../core/coreData';
import { deepWatch, shallowEqual } from '../core/util';

export function shallowCompare(
  instance: { props: { [x: string]: any } | null; state: { [x: string]: any } | null },
  nextProps: { [x: string]: any } | null,
  nextState: { [x: string]: any } | null,
) {
  return !shallowEqual(instance.props, nextProps) || !shallowEqual(instance.state, nextState);
}

/**
 * 递归监视组件子属性
 * 当子组件中含有可观察对象时，确保它们被正确地监视
 */
export function deepWatchChildrenProps(vdom: any) {
  if (isValidElement(vdom) && (vdom as any).props) {
    Object.values((vdom as any).props).forEach((p: any) => {
      ([] as any[]).concat(p).forEach((sp) => {
        if (isValidElement(sp)) {
          deepWatchChildrenProps(sp);
        }
        else if (isObservable(sp)) {
          deepWatch(sp);
        }
      });
    });
  }
}
