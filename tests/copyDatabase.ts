import fs from 'fs';
import { exec } from 'child_process';
import url from 'url';

const defaultDB = {
  port: 5432, hostname: '127.0.0.1', pathname: '/db', auth: 'postgres:postgres',
};

const readURL = url.parse(process.env.DATABASE_READ_URL || '') || defaultDB;
const dbURL = url.parse(process.env.DATABASE_URL || '') || defaultDB;
const run = (
  cmd: string,
  env: { [key: string]: string },
): Promise<string> => new Promise(
  (resolve, reject) => exec(
    cmd,
    { env },
    (error: Error | null, stdout: string) => {
      if (error) {
        return reject(error);
      }

      return resolve(stdout);
    },
  ),
);

const copyTables = async () => {
  const fname = 'backup';
  const dump: string = await run(
    'pg_dump',
    {
      PGPORT: (readURL.port || 1).toString(),
      PGHOST: readURL.hostname || '',
      PGDATABASE: (readURL.pathname || '').replace('/', ''),
      PGUSER: (readURL.auth || defaultDB.auth).split(':')[0],
      PGPASSWORD: (readURL.auth || defaultDB.auth).split(':')[1],
    },
  );
  fs.writeFileSync(fname, dump);

  await run(
    `psql -f ${fname}`,
    {
      PGPORT: (dbURL.port || 1).toString(),
      PGHOST: dbURL.hostname || '',
      PGDATABASE: (dbURL.pathname || '').replace('/', ''),
      PGUSER: (dbURL.auth || defaultDB.auth).split(':')[0],
      PGPASSWORD: (dbURL.auth || defaultDB.auth).split(':')[1],
    },
  );

  fs.unlinkSync(fname);
};

export default copyTables;
