import { describe, expect, it } from 'vitest';
import {
  action,
  actionAsync,
  autorun,
  computed,
  deepWatch,
  InternalConfig,
  observable,
  reaction,
  runInAction,
  setMoConfig,
  toJS,
} from '../src';

describe('数据流测试用例', () => {
  it('基础响应式', () => {
    class DataModel {
      xxx = observable({
        name: 'test',
      });

      @observable
      yyy = { text: 'eee' };

      @action
      setName(name: string) {
        this.xxx.name = name;
      }

      @action
      setText(text: string) {
        this.yyy.text = text;
      }
    }

    const dataModel = new DataModel();

    const data = ['test', 'newName'];
    autorun(() => {
      expect(dataModel.xxx.name).toBe(data.shift());
    });

    dataModel.setName('newName');
    expect(dataModel.xxx.name).toBe('newName');

    expect(data.length).toBe(0);

    data.push('eee', 'fff');
    autorun(() => {
      expect(dataModel.yyy.text).toBe(data.shift());
    });

    dataModel.setText('fff');
    expect(dataModel.yyy.text).toBe('fff');

    expect(data.length).toBe(0);
  });

  it('不允许非 action 修改 observable', async () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      @action
      setName(name: string) {
        this.data.name = name;
      }

      @action
      async asyncSetName(name: string) {
        await Promise.resolve();
        this.data.name = name;
      }
    }

    const dataModel = new DataModel();

    expect(() => {
      dataModel.data.name = 'newName'; // 直接修改 observable 属性
    }).toThrowError();

    dataModel.setName('newName'); // 正确的方式
    expect(dataModel.data.name).toBe('newName');

    // 不推荐，这只是把 action 当 runInAction 用
    const fc = action(() => {
      dataModel.data.name = 'eee';
    });
    expect(dataModel.data.name).toBe('newName');
    fc();
    expect(dataModel.data.name).toBe('eee');

    // 异步 action 中也不允许直接修改 observable
    await expect(async () => {
      await dataModel.asyncSetName('newNameX');
    }).rejects.toThrowError();
  });

  it('runInAction (不推荐用法)', () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      setName(name: string) {
        this.data.name = name;
      }
    }

    const dataModel = new DataModel();

    expect(dataModel.data.name).toBe('test');

    runInAction(() => {
      dataModel.setName('newName');
    });

    expect(dataModel.data.name).toBe('newName');
  });

  it('各数据类型监听', () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      @observable
      list = [1, 2, 3];

      @observable
      map = new Map<string, number>([
        ['key1', 1],
        ['key2', 2],
      ]);

      @action
      setName(name: string) {
        this.data.name = name;
      }

      @action
      addToList(item: number) {
        this.list.push(item);
      }

      @action
      setListItem(index: number, value: number) {
        this.list[index] = value;
      }

      @action
      setMapValue(key: string, value: number) {
        this.map.set(key, value);
      }
    }

    const dataModel = new DataModel();

    const data = ['test', 'newName'];
    autorun(() => {
      expect(dataModel.data.name).toBe(data.shift());
    });
    dataModel.setName('newName');
    expect(data.length).toBe(0);

    const listLength = [3, 4];
    autorun(() => {
      expect(dataModel.list.length).toBe(listLength.shift());
    });
    dataModel.addToList(4);
    expect(listLength.length).toBe(0);

    const listValues = [2, 4];
    autorun(() => {
      expect(dataModel.list[1]).toEqual(listValues.shift());
    });
    dataModel.setListItem(1, 4);
    expect(listValues.length).toBe(0);

    const mapSize = [2, 3];
    autorun(() => {
      expect(dataModel.map.size).toBe(mapSize.shift());
    });
    dataModel.setMapValue('key3', 3);
    expect(mapSize.length).toBe(0);

    const mapValues = [1, 10];
    autorun(() => {
      expect(dataModel.map.get('key1')).toBe(mapValues.shift());
    });
    dataModel.setMapValue('key1', 10);
    expect(mapValues.length).toBe(0);
  });

  it('值类型属性', () => {
    class Test {
      @observable
      data = 123;

      @observable
      zero = 0;

      @action
      setData(value: number) {
        this.data = value;
      }
    }

    const test = new Test();
    expect(test.data).toBe(123);
    expect(test.zero).toBe(0);

    const data = [123, 222];
    autorun(() => {
      expect(test.data).toBe(data.shift());
    });

    test.setData(222);
    expect(test.data).toBe(222);
    expect(data.length).toBe(0);
  });

  it('支持 action 内新增 observable 对象属性', () => {
    class Test {
      @observable
      data = {} as any;

      @action
      change() {
        this.data.xxx = '123';
      }
    }

    const test = new Test();
    const values: unknown[] = [];
    autorun(() => {
      values.push(test.data.xxx);
    });

    test.change();

    expect(values).toEqual([undefined, '123']);
    expect(test.data.xxx).toBe('123');
  });

  it('空值属性', () => {
    class Test {
      @observable
      data: any = undefined;

      @action
      setData(value: any) {
        this.data = value;
      }
    }

    const test = new Test();
    expect(test.data).toBe(undefined);

    const data = [undefined, 222];
    autorun(() => {
      expect(test.data).toEqual(data.shift());
    });

    test.setData(222);
    expect(test.data).toBe(222);
    expect(data.length).toBe(0);
  });

  it('属性箭头函数', () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      @action
      setName = (name: string) => {
        this.data.name = name;
      };
    }

    const dataModel = new DataModel();

    expect(dataModel.data.name).toBe('test');

    const data = ['test', 'newName'];
    autorun(() => {
      expect(dataModel.data.name).toBe(data.shift());
    });
    dataModel.setName('newName');
    expect(data.length).toBe(0);
  });

  it('属性箭头函数 this 指向', () => {
    class A {
      test = '';

      @action
      func = () => {
        return this;
      };
    }

    const a = new A();
    a.test = '111';
    expect(a.func().test).toBe('111');

    const b = new A();
    b.test = '222';
    expect(b.func().test).toBe('222');
  });

  it('class 实例属性', () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      @action
      setName(name: string) {
        this.data.name = name;
      }
    }
    class Test {
      @observable
      data = new DataModel();
    }

    const test = new Test();

    expect(test.data.data.name).toBe('test');
    const data = ['test', 'newName'];
    autorun(() => {
      expect(test.data.data.name).toBe(data.shift());
    });
    test.data.setName('newName');
    expect(data.length).toBe(0);
  });

  it('基类定义', () => {
    class BaseModel {
      @observable
      data = { name: 'test' };

      @action
      setName(name: string) {
        this.data.name = name;
      }
    }
    class FooModel extends BaseModel {}
    class BarModel extends BaseModel {}

    class Test {
      @observable
      foo = new FooModel();

      @observable
      bar = new BarModel();
    }

    const test = new Test();

    expect(test.foo.data.name).toBe('test');
    expect(test.bar.data.name).toBe('test');

    const data = ['test', 'newName'];
    autorun(() => {
      expect(test.foo.data.name).toBe(data.shift());
    });
    test.foo.setName('newName');
    expect(data.length).toBe(0);

    expect(test.bar.data.name).toBe('test');
  });

  it('计算属性', () => {
    let cnt = 0;

    class DataModel {
      @observable
      data = { name: 'test' };

      @computed
      get upperCaseName() {
        cnt++;
        return this.data.name.toUpperCase();
      }

      @computed()
      get lowerCaseName() {
        cnt++;
        return this.data.name.toLowerCase();
      }

      @action
      setName(name: string) {
        this.data.name = name;
      }
    }

    const dataModel = new DataModel();

    const funcTest = computed(() => `${dataModel.data.name}_funcTest`);

    expect(dataModel.upperCaseName).toBe('TEST');
    expect(dataModel.upperCaseName).toBe('TEST');
    expect(dataModel.upperCaseName).toBe('TEST');
    expect(funcTest()).toBe('test_funcTest');
    expect(cnt).toBe(1);

    expect(dataModel.lowerCaseName).toBe('test');
    expect(cnt).toBe(2);

    const data = ['TEST', 'NEWNAME'];
    autorun(() => {
      expect(dataModel.upperCaseName).toBe(data.shift());
    });
    expect(cnt).toBe(2);

    dataModel.setName('newName');
    expect(data.length).toBe(0);
    expect(cnt).toBe(4); // upperCaseName/lowerCaseName 均重新计算

    expect(funcTest()).toBe('newName_funcTest');

    expect(dataModel.upperCaseName).toBe('NEWNAME');
    expect(cnt).toBe(4);

    expect(dataModel.lowerCaseName).toBe('newname');
    expect(cnt).toBe(4);
  });

  it('action 过程中读取 computed', () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      @computed
      get upperCaseName() {
        return this.data.name.toUpperCase();
      }

      @computed
      get dataComputed() {
        return this.upperCaseName;
      }

      @action
      setName(name: string) {
        this.data.name = name;
        expect(this.dataComputed).toBe(name.toUpperCase());
        expect(this.upperCaseName).toBe(name.toUpperCase());
      }
    }

    const dataModel = new DataModel();
    expect(dataModel.dataComputed).toBe('TEST');
    expect(dataModel.upperCaseName).toBe('TEST');

    dataModel.setName('newName');

    expect(dataModel.dataComputed).toBe('NEWNAME');
    expect(dataModel.upperCaseName).toBe('NEWNAME');
  });

  it('计算属性销毁（通过可插拔 dispose 钩子）', () => {
    // 源仓库此处依赖 DI 的 getInstanceMetadata().destroyTasks，
    // 这里改为校验解耦后的 registerInstanceDispose 钩子。
    const disposeTasks = new Map<any, Array<() => void>>();
    const prev = InternalConfig.registerInstanceDispose;
    setMoConfig({
      registerInstanceDispose: (inst, dispose) => {
        const arr = disposeTasks.get(inst) || [];
        arr.push(dispose);
        disposeTasks.set(inst, arr);
      },
    });

    try {
      class DataModel {
        @observable
        data = { name: 'test' };

        @computed
        get upperCaseName() {
          return this.data.name.toUpperCase();
        }

        @action
        changeName(name: string) {
          this.data.name = name;
        }
      }

      const dataModel = new DataModel();
      expect(dataModel.upperCaseName).toBe('TEST');

      dataModel.changeName('anotherName');
      expect(dataModel.upperCaseName).toBe('ANOTHERNAME');

      const tasks = disposeTasks.get(dataModel);
      expect(tasks?.length).toBe(1);
      tasks?.forEach(task => task());

      dataModel.changeName('newName');
      expect(dataModel.upperCaseName).toBe('NEWNAME');

      expect(disposeTasks.get(dataModel)?.length).toBe(2);
    }
    finally {
      setMoConfig({ registerInstanceDispose: prev });
    }
  });

  it('reaction', () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      @action
      setName(name: string) {
        this.data.name = name;
      }
    }

    const dataModel = new DataModel();

    const data = ['newName'];
    const dispose = reaction(
      () => {
        return dataModel.data.name;
      },
      (arg) => {
        expect(arg).toBe(data.shift());
      },
    );

    dataModel.setName('newName');
    expect(data.length).toBe(0);
    expect(dispose.$reaction.cleaners?.length).toBe(2);

    dispose();
    expect(dispose.$reaction.cleaners?.length).toBe(0);

    dataModel.setName('anotherName');
    expect(dataModel.data.name).toBe('anotherName');
  });

  it('类监听', () => {
    @observable
    class DataModel {
      data = { name: 'test' };

      @action
      setName(name: string) {
        this.data.name = name;
      }
    }

    const dataModel = new DataModel();

    expect(() => {
      dataModel.data.name = 'error'; // 直接修改 observable 属性
    }).toThrowError();

    const data = ['test', 'newName'];
    autorun(() => {
      expect(dataModel.data.name).toBe(data.shift());
    });

    expect(() => {
      dataModel.data.name = 'error'; // 直接修改 observable 属性
    }).toThrowError();

    dataModel.setName('newName');
    expect(data.length).toBe(0);
  });

  it('命名 action', () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      @action('setNameAction')
      setName(name: string) {
        this.data.name = name;
      }

      @action({ actionName: 'setAction', debugger: true })
      set(name: string) {
        this.setName(name);
      }

      @action
      setNoName() {
        this.setName('');
      }
    }

    const dataModel = new DataModel();

    const data = [
      'setNameAction:DataModel:setName',
      'setAction:DataModel:set',
      'DataModel:setNoName',
    ];
    reaction(
      () => deepWatch(dataModel.data),
      (r, actionName) => {
        expect(actionName).toBe(data.shift());
      },
    );

    dataModel.setName('newName');
    dataModel.set('newName2');
    dataModel.setNoName();
  });

  it('action.bound', () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      @action.bound
      setName(name: string) {
        this.data.name = name;
      }
    }

    const dataModel = new DataModel();
    const { setName } = dataModel;

    const data = ['test', 'newName'];
    autorun(() => {
      expect(dataModel.data.name).toBe(data.shift());
    });

    setName('newName');
    expect(data.length).toBe(0);
  });

  it('异步 action', async () => {
    class DataModel {
      @observable
      data = { name: 'test' };

      @action
      async setName(name: string) {
        await new Promise(resolve => setTimeout(resolve, 10));
        this.data.name = name;
      }

      @actionAsync
      async setNameAsync(name: string) {
        await new Promise(resolve => setTimeout(resolve, 10));
        this.data.name = name;
      }
    }

    const dataModel = new DataModel();

    const data = ['test', 'newNameAsync'];
    autorun(() => {
      expect(dataModel.data.name).toBe(data.shift());
    });

    await expect(dataModel.setName('newName')).rejects.toThrow(
      'can not modify data outside @action',
    );

    await dataModel.setNameAsync('newNameAsync');
    expect(dataModel.data.name).toBe('newNameAsync');

    expect(data.length).toBe(0);
  });

  it('reaction, 多个嵌套关系', () => {
    const source = observable({
      data: { name: 'test' },
    });
    const data = observable({}) as any;

    let child: ReturnType<typeof reaction>;
    const root = autorun(() => {
      // 读取 data 建立依赖
      void data;

      let result: any;
      child = autorun(() => {
        result = source.data.name;
      });

      runInAction(() => {
        data.name = result;
      });
    });

    expect(data.name).toBe('test');
    expect(child!.$reaction.cleaners?.length).toBe(2);
    expect(root.$reaction.cleaners?.length).toBe(0);
  });

  it('异常数据处理', () => {
    class DataModel {
      @observable
      data: any = { name: 'test' };

      @action
      setData(data: any) {
        this.data = data;
      }
    }

    const dataModel = new DataModel();
    // 测试各种数据类型
    [
      { name: 'test' },
      { name: 'newName' },
      123,
      'string',
      null,
      undefined,
      Symbol('symbol'),
      [1, 2, 3],
      new Map([['key', 'value']]),
    ].forEach((item) => {
      dataModel.setData(item);
      expect(dataModel.data).toEqual(item);
    });
  });

  it('变更响应范围', () => {
    const data = observable({
      data: { name: { zh: 'test' } },
    });

    const name = data.data.name;

    const expectData = ['test', 'eee'];
    autorun(() => {
      expect(name.zh).toBe(expectData.shift());
    });

    runInAction(() => {
      data.data.name.zh = 'eee';
    });
    runInAction(() => {
      data.data.name = { zh: 'xxx' };
    });
    runInAction(() => {
      data.data = { name: { zh: 'newName' } };
    });

    expect(expectData.length).toBe(0);
  });

  it('属性 action 作用域绑定', () => {
    function test(this: any) {
      const parentThis = this;
      return () => {
        return {
          funcThis: this,
          parentThis,
          isEqual: this === parentThis,
        };
      };
    }

    class A {
      @action
      func = test;
    }

    const a = new A();

    class B {
      a = a.func;
    }

    const f = a.func()();
    expect(f.isEqual).toBe(true);
    expect(f.parentThis).toBeInstanceOf(A);
    expect(f.funcThis).toBeInstanceOf(A);

    const b = new B();
    const d = b.a()();
    expect(d.isEqual).toBe(true);
    expect(d.parentThis).toBeInstanceOf(A);
    expect(d.funcThis).toBeInstanceOf(A);
  });

  it('toJS', () => {
    expect(toJS(undefined)).toBe(undefined);
    expect(toJS(null)).toBe(null);
    expect(toJS(1)).toBe(1);
    expect(toJS('1')).toBe('1');
    expect(toJS(true)).toBe(true);
    expect(toJS(false)).toBe(false);
    expect(toJS(Symbol('1')).toString()).toBe('Symbol(1)');
    const fn = () => {};
    expect(toJS(fn)).toBe(fn);

    expect(toJS({ a: 1 })).toEqual({ a: 1 });
    expect(toJS({ a: undefined })).toEqual({ a: undefined });
    expect(toJS({ a: null })).toEqual({ a: null });
    expect(toJS({ a: fn })).toEqual({});
    expect(toJS({ a: Symbol('1') })).toEqual({});
    expect(toJS({ a: { b: 2 } })).toEqual({ a: { b: 2 } });

    expect(toJS([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
