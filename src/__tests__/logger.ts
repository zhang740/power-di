import test from 'ava'
import { logger, OutLevel } from '../utils'
logger.setOutLevel(OutLevel.None)

test('logger', t => {
    logger.log()
    logger.info()
    logger.warn()
    logger.error()
    t.pass()
})