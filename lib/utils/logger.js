"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var OutLevel;
(function (OutLevel) {
    OutLevel[OutLevel["Log"] = 0] = "Log";
    OutLevel[OutLevel["Info"] = 1] = "Info";
    OutLevel[OutLevel["Warn"] = 2] = "Warn";
    OutLevel[OutLevel["Error"] = 3] = "Error";
    OutLevel[OutLevel["None"] = 4] = "None";
})(OutLevel = exports.OutLevel || (exports.OutLevel = {}));

var Logger = function () {
    function Logger() {
        _classCallCheck(this, Logger);

        this.outLevel = OutLevel.Log;
    }

    _createClass(Logger, [{
        key: "setOutLevel",
        value: function setOutLevel(level) {
            this.outLevel = level;
        }
    }, {
        key: "error",
        value: function error(message) {
            if (this.outLevel <= OutLevel.Error) {
                var _console;

                for (var _len = arguments.length, optionalParams = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    optionalParams[_key - 1] = arguments[_key];
                }

                (_console = console).error.apply(_console, [message].concat(optionalParams));
            }
        }
    }, {
        key: "info",
        value: function info(message) {
            if (this.outLevel <= OutLevel.Info) {
                var _console2;

                for (var _len2 = arguments.length, optionalParams = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    optionalParams[_key2 - 1] = arguments[_key2];
                }

                (_console2 = console).info.apply(_console2, [message].concat(optionalParams));
            }
        }
    }, {
        key: "log",
        value: function log(message) {
            if (this.outLevel <= OutLevel.Log) {
                var _console3;

                for (var _len3 = arguments.length, optionalParams = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                    optionalParams[_key3 - 1] = arguments[_key3];
                }

                (_console3 = console).log.apply(_console3, [message].concat(optionalParams));
            }
        }
    }, {
        key: "warn",
        value: function warn(message) {
            if (this.outLevel <= OutLevel.Warn) {
                var _console4;

                for (var _len4 = arguments.length, optionalParams = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
                    optionalParams[_key4 - 1] = arguments[_key4];
                }

                (_console4 = console).warn.apply(_console4, [message].concat(optionalParams));
            }
        }
    }]);

    return Logger;
}();

exports.Logger = Logger;
var logger = new Logger();
exports.default = logger;
//# sourceMappingURL=logger.js.map