import { test, expect } from 'vitest';
import { logger, OutLevel } from '@power-di/class-loader';

test('logger', () => {
  logger.setOutLevel(OutLevel.Log);
  logger.log('');
  logger.info('');
  logger.warn('');
  logger.error('');

  logger.setOutLevel(OutLevel.None);

  logger.log();
  logger.info();
  logger.warn();
  logger.error();

  expect(true).toBe(true);
});
