# 2.4.28 / 2022-11-10

- feat: support run preDestroy.

# 2.4.27 / 2022-11-09

- fix: optional parse

# 2.4.26 / 2022-11-09

- feat: transformer support optional.

# 2.4.25 / 2022-11-07

- fix: postConstruct in react

# 2.4.24 / 2022-11-04

- feat: select strategy of multiple when only one instance exist

# 2.4.23 / 2022-11-04

==================

- fix: iocConsumer support createInstanceHook
- feat: add react hooks

# 2.4.22 / 2022-10-31

==================

- fix: inject override

# 2.4.21 / 2022-10-25

==================

- fix: child context addressing logic

# 2.4.19 / 2022-10-18

==================

- upgrade: transformer for typescript

# 2.4.18 / 2022-02-21

==================

- update: optimize data register

# 2.4.17 / 2022-02-16

==================

- update: impl cache by type change to key.

# 2.4.16 / 2022-02-09

==================

- update: optimize isClass

# 2.4.15 / 2021-12-08

- fix: inherit of createChildContext
- chore: prettier

# 2.4.14 / 2021-09-17

- feat: aspect support skipRunning.

# 2.4.13 / 2021-08-18

- update: symbol

# 2.4.12 / 2021-08-18

- update: ie11 symbol

# 2.4.9 / 2021-08-17

- feat: down to es5

# 2.4.7 / 2021-07-08

- feat: pureComponent support config (#6)

# 2.4.6 / 2021-07-08

- feat: react displayName (#5)
- chore: update travis.

# 2.4.5 / 2021-05-07

- fix: class loader impl cache is not independence

# 2.4.4 / 2021-04-12

- feat: BaseClass can use injectable.

# 2.4.3 / 2021-02-04

- fix: class judge
- feat: classLoader add clone method

# 2.4.2 / 2020-12-15

- fix(context): class loader is not registered for matching class when conflict

# 2.4.1 / 2020-12-14

- fix(context): class loader is not registered for matching class

# 2.4.0 / 2020-12-14

- feat: child scope use independent API, parentContext

# 2.3.18 / 2020-12-09

- update: type guard for isClass.

# 2.3.17 / 2020-11-06

- fix: optimize canBeKey, ref #4.

# 2.3.16 / 2020-10-14

- update: aspect compatible.

# 2.3.15 / 2020-09-22

- fix: need singleton between parent and child context.
- update: Class in ClassLoader is injectable, default.

# 2.3.14 / 2020-09-08

- tmp: disable imports type checker.

# 2.3.13 / 2020-09-08

- fix: error log.

# 2.3.12 / 2020-09-08

- fix: type argument of transformer.

# 2.3.11 / 2020-09-02

- update: alias for transformer.

# 2.3.10 / 2020-08-26

- feat: add class metadata transformer.
- doc: ClassLoader.

# 2.3.9 / 2020-06-09

- update: export preDestroy.

# 2.3.8 / 2020-06-03

- update: support preDestroy.

# 2.3.7 / 2020-05-28

- update: exclude regenerator.

# 2.3.6 / 2020-05-18

- use the same instance between interface and impl when get.

# 2.3.5 / 2020-05-14

- update: getGlobalType allow function.
- update: ci
- fix: ci

# 2.3.4 / 2020-05-09

- update: public readonly ioc config.

# 2.3.3 / 2020-05-07

- fix: symbol typing for getGlobalType.

# 2.3.2 / 2020-05-06

- update: typings for classLoader.
- update: aspect typing.

# 2.3.1 / 2020-04-28

- fix: createInstanceHook run time.

# 2.3.0 / 2020-04-26

- update: support aspect decorator with ioc.

# 2.2.10 / 2020-04-24

- update: export IocConsumer.

# 2.2.9 / 2020-04-24

- update: support react with consumer decorator.

# 2.2.8 / 2020-04-23

- update: inject compatible with postConstruct.

# 2.2.7 / 2020-04-23

- update: split inject and postConstruct.

# 2.2.6 / 2020-04-23

- fix: postConstruct in react component.

# 2.2.5 / 2020-04-22

- update: postConstruct move in inject.

# 2.2.4 / 2020-04-02

- update: support custom classLoader for context.

# 2.2.3 / 2020-03-16

- update: no singleton when inject

# 2.2.2 / 2020-03-03

- fix: injectable work with classInfo.
- rename: readme.

# 2.2.1 / 2020-03-03

- update: add PureComponent for react.

# 2.2.0 / 2020-03-01

- update: support conflictHandler for inject when have multi implement class.

# 2.1.1 / 2020-02-25

- update: type define support abstract class.

# 2.1.0 / 2020-02-25

- update: add postConstruct.

# 2.0.3 / 2020-02-20

- fix: multi getImports get difference instances when without cache.
- test: update.

# 2.0.2 / 2020-02-20

- update: react Component define.

# 2.0.1 / 2020-02-20

- update: detail inject error log.
- update: support symbol key.

# 2.0.0 / 2020-02-19

- refactor: tests.
- refactor: another way for subclasses inject.
- refactor: new react provider.
- refactor: utils.
- refactor: merge inject decorator.
- refactor: add class info collect, and refactor metadata type.

# 1.4.17 / 2019-02-26

- update: deps.
- chore: add multi level inject test.
