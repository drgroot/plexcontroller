/* eslint-disable no-console */
import fs from 'fs';
import { spawn } from 'child_process';
import url from 'url';

const defaultDB = {
  port: 5432, hostname: '127.0.0.1', pathname: '/db', auth: 'postgres:postgres',
};
const pgDumpLocation = '/tmp/backup';

const deleteBackup = () => {
  if (fs.existsSync(pgDumpLocation)) {
    fs.unlinkSync(pgDumpLocation);
  }
};

const run = (
  cmd: string,
  args: string[],
  env: { [key: string]: string },
): Promise<number | null> => new Promise(
  (resolve, reject) => {
    // @ts-ignore
    console.log(cmd, args);
    const child = spawn(cmd, args, { env });

    child.on('error', (e) => reject(e));
    child.on('close', (code) => resolve(code));
    child.on('exit', (code) => resolve(code));
  },
);

const copyTables = async () => {
  deleteBackup();
  const readURL = url.parse(process.env.DATABASE_READ_URL || '') || defaultDB;
  const dbURL = url.parse(process.env.DATABASE_URL || '') || defaultDB;

  // run backup
  if (readURL.hostname && readURL.auth && readURL.port && readURL.pathname) {
    await run(
      'pg_dump',
      [
        '-Fc',
        '--no-acl',
        '--no-owner',
        '-h', readURL.hostname,
        '-U', readURL.auth.split(':')[0],
        '-p', readURL.port.toString(),
        '-f', pgDumpLocation,
        readURL.pathname.replace('/', ''),
      ],
      { PGPASSWORD: readURL.auth.split(':')[1] },
    );
  }

  if (dbURL.auth && dbURL.pathname && dbURL.hostname && dbURL.port) {
    await run(
      'pg_restore',
      [
        '--verbose',
        '--clean',
        '--no-acl',
        '--no-owner',
        '-U', dbURL.auth.split(':')[0],
        '-d', dbURL.pathname.replace('/', ''),
        '-h', dbURL.hostname,
        '-p', dbURL.port.toString(),
        pgDumpLocation,
      ],
      { PGPASSWORD: dbURL.auth.split(':')[1] },
    );
  }

  deleteBackup();
};

export default copyTables;
