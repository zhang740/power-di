import type { MutableRefObject, ReactElement } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import * as React from 'react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it } from 'vitest';
import { action, observable, runInAction } from '../src';
import { observer, observerWithName } from '../src/react';

/** 收集渲染树里的全部文本，便于断言 */
function text(r: ReactTestRenderer): string {
  const collect = (n: any): string => {
    if (n == null) {
      return '';
    }
    if (typeof n === 'string') {
      return n;
    }
    if (Array.isArray(n)) {
      return n.map(collect).join('');
    }
    return collect(n.children);
  };
  return collect(r.toJSON());
}

describe('react 下使用', () => {
  it('基础使用', () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      @action
      setName(name: string) {
        this.data.name = name;
      }
    }

    const dataModel = new DataModel();

    const TestComponent = observerWithName(
      'TestComponent',
      () => <div>{dataModel.data.name}</div>,
      { delay: false },
    );

    let r: ReactTestRenderer;
    act(() => {
      r = create(<TestComponent />);
    });
    expect(text(r!)).toContain('test');

    act(() => {
      dataModel.setName('newName');
    });
    expect(text(r!)).toContain('newName');

    act(() => r!.unmount());
  });

  it('forwardRef', () => {
    const data = observable({ name: 'test' });

    const ChildComp = (props: { name: string }, ref: any) => {
      const [innerText, setText] = useState('');

      useImperativeHandle(ref, () => {
        return {
          updateText(newText: string) {
            setText(newText);
          },
        };
      }, []);

      return <div>{`${props.name}_${innerText}_${data.name}`}</div>;
    };
    const ChildCompForwardObserver: any = observer(forwardRef(ChildComp), { delay: false });
    const ChildCompObserverForward: any = forwardRef(
      observer(ChildComp, { delay: false, noMemo: true }) as any,
    );
    const ChildCompForwardObserverWithName: any = observerWithName(
      'XXX1',
      forwardRef(ChildComp),
      { delay: false },
    );
    const ChildCompObserverWithNameForward: any = forwardRef(
      observerWithName('XXX2', ChildComp as any, { delay: false, noMemo: true }) as any,
    );

    type TestRef = MutableRefObject<{ updateText: (text: string) => void }> | undefined;
    let child1Ref: TestRef;
    let child2Ref: TestRef;
    let child3Ref: TestRef;
    let child4Ref: TestRef;
    const ParentComp = () => {
      child1Ref = useRef() as any;
      child2Ref = useRef() as any;
      child3Ref = useRef() as any;
      child4Ref = useRef() as any;

      return (
        <div>
          <ChildCompForwardObserver name="C1" ref={child1Ref} />
          <ChildCompObserverForward name="C2" ref={child2Ref} />
          <ChildCompForwardObserverWithName name="C3" ref={child3Ref} />
          <ChildCompObserverWithNameForward name="C4" ref={child4Ref} />
        </div>
      ) as ReactElement;
    };

    let r: ReactTestRenderer;
    act(() => {
      r = create(<ParentComp />);
    });

    expect(text(r!)).toContain('C1__test');
    expect(text(r!)).toContain('C2__test');
    expect(text(r!)).toContain('C3__test');
    expect(text(r!)).toContain('C4__test');

    act(() => {
      runInAction(() => {
        data.name = 'newName';
      });
    });

    expect(text(r!)).toContain('C1__newName');
    expect(text(r!)).toContain('C2__newName');
    expect(text(r!)).toContain('C3__newName');
    expect(text(r!)).toContain('C4__newName');

    act(() => {
      child1Ref!.current!.updateText('ref');
      child2Ref!.current!.updateText('ref');
      child3Ref!.current!.updateText('ref');
      child4Ref!.current!.updateText('ref');
    });

    expect(text(r!)).toContain('C1_ref_newName');
    expect(text(r!)).toContain('C2_ref_newName');
    expect(text(r!)).toContain('C3_ref_newName');
    expect(text(r!)).toContain('C4_ref_newName');

    act(() => r!.unmount());
  });

  it('memo', () => {
    let renderCnt1 = 0;
    let renderCnt2 = 0;
    let renderCnt3 = 0;

    const MemoTestComponent = observer(
      (props: { name: string }) => {
        renderCnt1++;
        return <div>{props.name}</div>;
      },
      { delay: false },
    );
    const NoMemoTestComponent = observer(
      (props: { name: string }) => {
        renderCnt2++;
        return <div>{props.name}</div>;
      },
      { delay: false, memo: false },
    );
    const MemoCustomTestComponent = observer(
      (props: { name: string }) => {
        renderCnt3++;
        return <div>{props.name}</div>;
      },
      { delay: false, memo: (pv, cv) => cv.name !== 'customTest' },
    );

    let changeName = (newName: string) => {};
    let forceUpdate = () => {};
    const TestApp = () => {
      const [name, setName] = useState('test');
      changeName = setName;

      const [, setId] = useState(0);
      forceUpdate = () => setId(id => id + 1);

      return (
        <div>
          <MemoTestComponent name={name} />
          <NoMemoTestComponent name={name} />
          <MemoCustomTestComponent name={name} />
        </div>
      );
    };

    let r: ReactTestRenderer;
    act(() => {
      r = create(<TestApp />);
    });

    expect(renderCnt1).toBe(1);
    expect(renderCnt2).toBe(1);
    expect(renderCnt3).toBe(1);
    expect(text(r!)).toBe('testtesttest');

    act(() => forceUpdate());

    expect(renderCnt1).toBe(1);
    expect(renderCnt2).toBe(2);
    expect(renderCnt3).toBe(1);

    act(() => changeName('newName'));

    expect(renderCnt1).toBe(2);
    expect(renderCnt2).toBe(3);
    expect(renderCnt3).toBe(1);
    expect(text(r!)).toBe('newNamenewNametest');

    act(() => changeName('customTest'));

    expect(renderCnt1).toBe(3);
    expect(renderCnt2).toBe(4);
    expect(renderCnt3).toBe(2);
    expect(text(r!)).toBe('customTestcustomTestcustomTest');

    act(() => r!.unmount());
  });
});
