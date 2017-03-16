"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ava_1 = require("ava");
var utils_1 = require("../utils");
utils_1.logger.setOutLevel(utils_1.OutLevel.None);
ava_1.default('logger', function (t) {
    utils_1.logger.log();
    utils_1.logger.info();
    utils_1.logger.warn();
    utils_1.logger.error();
    t.pass();
});
//# sourceMappingURL=logger.js.map