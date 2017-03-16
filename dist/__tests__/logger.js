"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const utils_1 = require("../utils");
ava_1.default('logger', t => {
    utils_1.logger.log('');
    utils_1.logger.info('');
    utils_1.logger.warn('');
    utils_1.logger.error('');
    utils_1.logger.setOutLevel(utils_1.OutLevel.None);
    utils_1.logger.log();
    utils_1.logger.info();
    utils_1.logger.warn();
    utils_1.logger.error();
    t.pass();
});
//# sourceMappingURL=logger.js.map