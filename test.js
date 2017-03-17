const ioc = require('./dist')
const utils = require('./dist/utils')
const context = ioc.IocContext.DefaultInstance

class AClass { }
class BClass extends AClass { }
class CClass extends BClass { }

context.register(CClass, undefined, { regInSuperClass: true })
