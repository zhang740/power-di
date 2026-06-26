import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseViewModel } from '../src';

describe('BaseViewModel', () => {
  class TestVM extends BaseViewModel {
    public mergeObjPublic = this.mergeObj;
    public mergeArrayPublic = this.mergeArray;
  }
  let vm: TestVM;
  beforeEach(() => {
    vm = new TestVM();
  });

  it('应当浅合并对象', () => {
    const oldObj = { a: 1, b: 2 };
    const newObj = { b: 3, c: 4 };
    vm.mergeObjPublic(oldObj, newObj, { deep: false });
    expect(oldObj).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('应当深度合并嵌套对象', () => {
    const oldObj = { a: { x: 1 }, b: 2 };
    const newObj = { a: { x: 2, y: 3 } };
    vm.mergeObjPublic(oldObj, newObj);
    expect(oldObj).toEqual({ a: { x: 2, y: 3 }, b: 2 });
  });

  it('应当按索引合并数组', () => {
    const oldArr = [{ a: 1 }, { b: 2 }];
    const newArr = [{ a: 2 }, { b: 2 }, { c: 3 }];
    vm.mergeArrayPublic(oldArr as any, newArr as any);
    expect(oldArr).toEqual([{ a: 2 }, { b: 2 }, { c: 3 }]);
  });

  it('应当移除旧数组多余项', () => {
    const oldArr = [{ a: 1 }, { b: 2 }, { c: 3 }];
    const newArr = [{ a: 1 }];
    vm.mergeArrayPublic(oldArr as any, newArr as any);
    expect(oldArr).toEqual([{ a: 1 }]);
  });

  it('应当能优雅处理 null 和 undefined', () => {
    const oldObj: any = { a: null, b: undefined };
    const newObj: any = { a: { x: 1 }, b: 2 };
    vm.mergeObjPublic(oldObj, newObj);
    expect(oldObj).toEqual({ a: { x: 1 }, b: 2 });
  });

  it('mergeArray 应当调用 customOnDiff', () => {
    const oldArr = [{ a: 1 }];
    const newArr = [{ a: 2 }];
    let called = false;
    vm.mergeArrayPublic(oldArr, newArr, {
      customOnDiff: (oldItem, newItem) => {
        called = true;
        oldItem.a = 3;
      },
    });
    expect(called).toBe(true);
    expect(oldArr).toEqual([{ a: 3 }]);
  });

  it('mergeArray 应当调用 useMerge', () => {
    const oldArr = [{ a: 1 }];
    const newArr = [{ a: 2 }];
    let called = false;
    vm.mergeArrayPublic(oldArr, newArr, {
      useMerge: (oldItem, newItem) => {
        called = true;
        return false;
      },
    });
    expect(called).toBe(true);
    expect(oldArr).toEqual([{ a: 2 }]);
  });

  it('应当删除 oldObj 中 newObj 不存在的 key', () => {
    const oldObj = { a: 1, b: 2, c: 3 };
    const newObj = { a: 1, b: 2 };
    vm.mergeObjPublic(oldObj, newObj, { deleteOldValues: true });
    expect(oldObj).toEqual({ a: 1, b: 2 });
  });

  it('深度合并时应删除多余 key', () => {
    const oldObj = { a: { x: 1, y: 2 }, b: 2, c: 3 };
    const newObj = { a: { x: 2 }, b: 2 };
    vm.mergeObjPublic(oldObj, newObj, { deep: true, deleteOldValues: true });
    expect(oldObj).toEqual({ a: { x: 2 }, b: 2 });
  });

  it('deleteOldValues 为 false 时不应删除 key', () => {
    const oldObj = { a: 1, b: 2, c: 3 };
    const newObj = { a: 1, b: 2 };
    vm.mergeObjPublic(oldObj, newObj, { deleteOldValues: false });
    expect(oldObj).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('newObj 为空时应清空 oldObj', () => {
    const oldObj = { a: 1, b: 2 };
    const newObj = {};
    vm.mergeObjPublic(oldObj, newObj, { deleteOldValues: true });
    expect(oldObj).toEqual({});
  });

  it('oldObj 为空 newObj 有值时应合并', () => {
    const oldObj: any = {};
    const newObj = { a: 1, b: 2 };
    vm.mergeObjPublic(oldObj, newObj);
    expect(oldObj).toEqual({ a: 1, b: 2 });
  });

  it('应支持合并包含原始值的数组', () => {
    const oldArr = [1, 2, 3];
    const newArr = [1, 4];
    vm.mergeArrayPublic(oldArr as any, newArr as any);
    expect(oldArr).toEqual([1, 4]);
  });

  it('应支持合并对象和原始值混合的数组', () => {
    const oldArr = [{ a: 1 }, 2];
    const newArr = [{ a: 2 }, 3];
    vm.mergeArrayPublic(oldArr as any, newArr as any);
    expect(oldArr).toEqual([{ a: 2 }, 3]);
  });

  it('deep=false 时 oldObj 多余 key 也会被删除', () => {
    const oldObj = { a: 1, b: 2, c: 3 };
    const newObj = { a: 2 };
    vm.mergeObjPublic(oldObj, newObj, { deep: false, deleteOldValues: true });
    expect(oldObj).toEqual({ a: 2 });
  });

  it('oldObj 为 undefined 时不应抛异常', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      vm.mergeObjPublic(undefined as any, { a: 1 });
    }).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith('oldObj is undefined.');
    errorSpy.mockRestore();
  });

  it('newObj 为 undefined 时不应抛异常', () => {
    const oldObj = { a: 1 };
    expect(() => {
      vm.mergeObjPublic(oldObj, undefined as any);
    }).not.toThrow();
    expect(oldObj).toEqual({ a: 1 });
  });

  it('deleteOldValues 为函数时应按函数逻辑删除 key', () => {
    const oldObj = {
      a: 1,
      b: { x: 2, y: 3 },
      c: 4,
      d: { z: 5 },
    };
    const newObj = {
      a: 1,
      b: { x: 2 },
    };
    // 仅删除根层级且 key 为 'c' 的项
    vm.mergeObjPublic(oldObj, newObj, {
      deleteOldValues: (path, key) => path.length === 0 && key === 'c',
      deep: true,
    });
    expect(oldObj).toEqual({
      a: 1,
      b: { x: 2, y: 3 },
      d: { z: 5 },
    });
  });

  it('deleteOldValues 为函数时应能删除嵌套 key', () => {
    const oldObj = {
      a: {
        x: 1,
        y: 2,
        z: 3,
      },
      b: 2,
    };
    const newObj = {
      a: {
        x: 1,
      },
      b: 2,
    };
    // 删除任意名为 'y' 或 'z' 的嵌套 key
    vm.mergeObjPublic(oldObj, newObj, {
      deleteOldValues: (path, key) => key === 'y' || key === 'z',
      deep: true,
    });
    expect(oldObj).toEqual({
      a: { x: 1 },
      b: 2,
    });
  });

  it('deleteOldValues 函数始终返回 false 时不应删除任何 key', () => {
    const oldObj = { a: 1, b: 2, c: 3 };
    const newObj = { a: 1 };
    vm.mergeObjPublic(oldObj, newObj, {
      deleteOldValues: () => false,
    });
    expect(oldObj).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('deleteOldValues 函数始终返回 true 时应删除所有 key', () => {
    const oldObj = { a: 1, b: 2, c: 3 };
    const newObj = {};
    vm.mergeObjPublic(oldObj, newObj, {
      deleteOldValues: () => true,
    });
    expect(oldObj).toEqual({});
  });

  it('deleteOldValues 函数可按 path 精确删除 key', () => {
    const oldObj = {
      a: {
        x: 1,
        y: 2,
      },
      b: 2,
    };
    const newObj = {
      a: {
        x: 1,
      },
      b: 2,
    };
    // 仅删除 'a' 下的 'y'
    vm.mergeObjPublic(oldObj, newObj, {
      deleteOldValues: (path, key) => path.length === 1 && path[0] === 'a' && key === 'y',
      deep: true,
    });
    expect(oldObj).toEqual({
      a: { x: 1 },
      b: 2,
    });
  });

  it('null 数组处理', () => {
    {
      const oldArr: any[] = [null, null];
      const newArr: any[] = [null, null];

      vm.mergeArrayPublic(oldArr, newArr);

      expect(oldArr).toEqual([null, null]);
    }

    {
      const oldArr: { data: any[] } = { data: [null, null] };
      const newArr: { data: any[] } = { data: [null, null] };

      vm.mergeObjPublic(oldArr, newArr);

      expect(oldArr).toEqual({ data: [null, null] });
    }
  });
});
