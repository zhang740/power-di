"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OutLevel;
(function (OutLevel) {
    OutLevel[OutLevel["Log"] = 0] = "Log";
    OutLevel[OutLevel["Info"] = 1] = "Info";
    OutLevel[OutLevel["Warn"] = 2] = "Warn";
    OutLevel[OutLevel["Error"] = 3] = "Error";
    OutLevel[OutLevel["None"] = 4] = "None";
})(OutLevel = exports.OutLevel || (exports.OutLevel = {}));
class Logger {
    constructor() {
        this.outLevel = OutLevel.Log;
    }
    setOutLevel(level) {
        this.outLevel = level;
    }
    error(message, ...optionalParams) {
        if (this.outLevel <= OutLevel.Error) {
            console.error(message, ...optionalParams);
        }
    }
    info(message, ...optionalParams) {
        if (this.outLevel <= OutLevel.Info) {
            console.info(message, ...optionalParams);
        }
    }
    log(message, ...optionalParams) {
        if (this.outLevel <= OutLevel.Log) {
            console.log(message, ...optionalParams);
        }
    }
    warn(message, ...optionalParams) {
        if (this.outLevel <= OutLevel.Warn) {
            console.warn(message, ...optionalParams);
        }
    }
}
exports.Logger = Logger;
const logger = new Logger;
exports.default = logger;
//# sourceMappingURL=logger.js.map