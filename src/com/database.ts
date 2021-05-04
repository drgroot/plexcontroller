import { Sequelize, QueryTypes } from 'sequelize';
import { DATABASE_URL, DEVMODE } from './config';
import { error } from './log';

const sequelize = new Sequelize(
  DATABASE_URL || '',
  {
    logging: DEVMODE,
    dialect: 'postgres',
  },
);

sequelize
  .authenticate()
  .catch((e) => {
    error('database: error connecting to database', e.message || e);
    process.exit(1);
  });

export const type = QueryTypes.SELECT;

export const close = () => sequelize.close();

export default sequelize;
