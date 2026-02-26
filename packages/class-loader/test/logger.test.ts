import { expect, it } from 'vitest';
import { logger, OutLevel } from '../src';

it('logger', () => {
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
