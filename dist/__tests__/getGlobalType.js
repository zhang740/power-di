"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const utils_1 = require("../utils");
ava_1.default('getGlobalType, error.', t => {
    t.throws(() => utils_1.getGlobalType(undefined));
    t.throws(() => utils_1.getGlobalType(123));
    t.throws(() => utils_1.getGlobalType(() => { }));
    t.throws(() => utils_1.getGlobalType(function () { }));
    t.throws(() => utils_1.getGlobalType(function test() { }));
});
ava_1.default('getGlobalType, string.', t => {
    t.true(utils_1.getGlobalType('stringkey') === 'stringkey');
});
ava_1.default('getGlobalType, one class.', t => {
    class A {
    }
    const typeA = utils_1.getGlobalType(A);
    t.true(typeA === 'A');
});
ava_1.default('getSuperClassInfo.', t => {
    class A {
    }
    class B extends A {
    }
    const typeAs = utils_1.getSuperClassInfo(A);
    const typeBs = utils_1.getSuperClassInfo(B);
    t.true(typeAs.length === 0);
    t.true(typeBs.length === 1);
    t.true(typeBs[0].type === utils_1.getGlobalType(A));
    t.true(typeBs[0].class === A);
    t.throws(() => utils_1.getSuperClassInfo(123));
    t.throws(() => utils_1.getSuperClassInfo('123'));
    t.throws(() => utils_1.getSuperClassInfo(() => { }));
});
//# sourceMappingURL=getGlobalType.js.map