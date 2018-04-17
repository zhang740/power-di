import test from 'ava'
import { logger, OutLevel } from '../lib/utils'

test('logger', t => {
  logger.setOutLevel(OutLevel.Log)
  logger.log('')
  logger.info('')
  logger.warn('')
  logger.error('')

  logger.setOutLevel(OutLevel.None)

  logger.log()
  logger.info()
  logger.warn()
  logger.error()

  t.pass()
})
