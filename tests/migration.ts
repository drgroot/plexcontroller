import { assert } from 'chai';
import copy from './copyDatabase';
import { QUEUE_NAME as service } from '../src/com/config';
import migrate from '../src/com/db/migrate';
import Migration from '../src/com/db/models/migration';

// eslint-disable-next-line func-names
describe('Database migrations', function () {
  this.timeout(10000);
  before(() => copy());

  it('migrate without error', () => migrate());

  let migrationCount = 0;
  it('should migrate the database', () => Migration
    .findAll({ where: { service } })
    .then((migrations) => { migrationCount = migrations.length; }));

  it('should migrate the database', () => Migration
    .findAll({ where: { service } })
    .then((migrations) => assert.isAtLeast(migrations.length, migrationCount)));
});
