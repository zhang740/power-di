import { isPlainObject } from './core/util';

/**
 * 表示应用程序的基础视图模型。
 */
export class BaseViewModel {
  /**
   * 将`newData`对象的属性合并到`obj`对象中
   * @param oldObj - 要将属性合并到的对象
   * @param newObj - 包含要合并的新数据的对象
   * @param opt - 参数
   */
  protected mergeObj(
    oldObj: { [key: string]: unknown },
    newObj: { [key: string]: unknown },
    opt?: {
      /** 是否深度 merge, 默认: true */
      deep?: boolean;
      /** 是否删除 oldObj 中 newObj 不存在的 key, 默认: false | (path: string[]) => boolean */
      deleteOldValues?:
        | boolean
        | ((path: string[], key: string, oldObj: any, newObj: any) => boolean);
    },
    path: string[] = [],
  ) {
    if (oldObj === undefined) {
      console.error(`oldObj is undefined.`);
      return;
    }

    if (opt?.deleteOldValues) {
      const oldKeys = Object.keys(oldObj);
      const newKeys = Object.keys(newObj);
      for (const key of oldKeys) {
        let shouldDelete = false;
        if (typeof opt.deleteOldValues === 'function') {
          shouldDelete = opt.deleteOldValues([...path], key, oldObj, newObj);
        }
        else {
          shouldDelete = opt.deleteOldValues;
        }
        if (shouldDelete && !newKeys.includes(key)) {
          oldObj[key] = undefined;
          delete oldObj[key];
        }
      }
    }

    for (const key in newObj) {
      if (oldObj[key] !== newObj[key]) {
        const oObj = oldObj[key];
        const nObj = newObj[key];
        if (opt?.deep !== false) {
          try {
            if (Array.isArray(oObj) && Array.isArray(nObj)) {
              this.mergeArray(oObj, nObj, { ...opt }, [...path, key]);
              continue;
            }
            if (isPlainObject(oObj) && isPlainObject(nObj)) {
              this.mergeObj(oObj as any, nObj as any, opt, [...path, key]);
              continue;
            }
          }
          catch (error) {
            console.error('mergeObj error:', key, error);
          }
        }
        oldObj[key] = newObj[key];
      }
    }
  }

  /**
   * 合并新数据
   * @param oldArray 源数据
   * @param newArray 新数据
   *
   */
  protected mergeArray<T extends Record<string, any>>(
    oldArray: T[],
    newArray: T[],
    opts?: {
      useMerge?: (oldItem: T, newItem: T) => boolean;
      customOnDiff?: (oldItem: T, newItem: T) => void;
      /** 是否删除 oldObj 中 newObj 不存在的 key, 默认: false | (path: string[]) => boolean */
      deleteOldValues?:
        | boolean
        | ((path: string[], key: string, oldObj: any, newObj: any) => boolean);
      deep?: boolean;
    },
    path: string[] = [],
  ) {
    const srcLen = oldArray.length;
    newArray.forEach((newItem, i) => {
      const oldItem: any = i < srcLen ? oldArray[i] : undefined;
      if (oldItem !== undefined) {
        if (oldItem !== newItem) {
          try {
            if (opts?.customOnDiff) {
              opts.customOnDiff(oldItem, newItem);
              return;
            }
            else if (opts?.useMerge?.(oldItem, newItem) !== false) {
              if (isPlainObject(oldItem) && isPlainObject(newItem)) {
                this.mergeObj(oldItem, newItem, opts, [...path, String(i)]);
                return;
              }
            }
          }
          catch (error) {
            console.error('mergeArray error:', i, error);
          }
          oldArray[i] = newItem;
        }
      }
      else {
        oldArray.push(newItem);
      }
    });
    while (oldArray.length > newArray.length) {
      oldArray.pop();
    }
  }
}
