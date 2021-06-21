export const {
  RABBITMQ_URL,
  DATABASE_URL,
  QUEUE_NAME = 'plex',
  BUILD = 'production',
  NODENAME = 'localhost',

  PLEXUSERNAME,
  PLEXPASSWORD,
  STARTUP_DELAY = '0',
  OPERATION_MODE = 'sidecar',

  KUBERNETES_IP,
  MONTHLY_CRON,
  DAILY_CRON,
  CRON_TIMEZONE,
} = process.env;

export const DEVMODE = (process.env.DEVMODE || process.env.NODE_ENV) === 'development';
export const controllerMode = OPERATION_MODE === 'controller';
export const queueName = (controllerMode) ? QUEUE_NAME : `${QUEUE_NAME}.${NODENAME}`;
export const routingKey = '';
export const exchangeName = 'amq.fanout';
