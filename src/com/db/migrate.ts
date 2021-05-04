import fs from 'fs';
import path from 'path';
import { QUEUE_NAME as service } from '../config';
import sequelize from '../database';
import Migration from './models/migration';
import MakeAssociation from './associations';
import { critical, info } from '../log';

interface MigrationType {
  run(): Promise<any>,
  version: number,
}

const migrationPath = path.join(__dirname, 'migrations');
const migrations: Promise<MigrationType[]> = Promise.all(
  fs.readdirSync(migrationPath)
    .map(
      (f) => import(path.join(migrationPath, f))
        .then((module) => ({
          run: module.default,
          version: parseInt(f.replace(/\D+/g, ''), 10),
        })),
    ),
);

const migrate = async (tasks: MigrationType[] | false = false): Promise<number> => {
  if (tasks === false) {
    info('Starting to run migrations');
    await sequelize.authenticate();
    await Migration.sync();
    const Migrations = await migrations;
    const Version = await Migration.findOne({ where: { service }, order: [['version', 'DESC']] });

    if (Version) {
      const version = await migrate(
        Migrations
          .filter((m) => m.version > Version.version)
          .sort((a, b) => a.version - b.version),
      );
      info('Finished running migrations');
      await MakeAssociation();
      return version;
    }

    // handle where there is no version
    const latestVersion = Migrations.sort((a, b) => a.version - b.version);
    await Migration.create({ service, version: latestVersion[latestVersion.length - 1].version });
    return migrate(false);
  }

  if (tasks.length === 0) {
    const Version = await Migration.findOne({ where: { service }, order: [['version', 'DESC']] });
    if (Version) {
      return Version.version;
    }
    return -1;
  }

  const [{ run, version }] = tasks;
  tasks.shift();
  info('Running migration version:', version);

  return run()
    .then(() => Migration.create({ service, version }))
    .then(() => info('Upgraded to version', version))
    .catch((e) => {
      critical('Migration version', version, 'failed', e.message || e);
      process.exit(1);
    })
    .then(() => migrate(tasks));
};

export default migrate;
