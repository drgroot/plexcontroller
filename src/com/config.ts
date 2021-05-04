export const {
  RABBITMQ_URL,
  DATABASE_URL,
  QUEUE_NAME = 'myqueue',
  BUILD = 'production',
} = process.env;

export const DEVMODE = (process.env.DEVMODE || process.env.NODE_ENV) === 'development';
