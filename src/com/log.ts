import os from 'os';
import rabbitMQ from './rabbitmq';
import { QUEUE_NAME, DEVMODE, BUILD } from './config';

// eslint-disable-next-line no-console
const print = (...args: any[]) => Promise.resolve(console.log(...args));
const hostname: string = os.hostname();

const CRITICAL = 'critical';
const ERROR = 'error';
const DEBUG = 'debug';
const INFO = 'info';
const WARN = 'warn';

const log = (level: string, ...messages: any[]): Promise<true> => {
  if (DEVMODE || BUILD.toLowerCase() === 'canary') {
    print(new Date(), level.toUpperCase(), ...messages);
  }

  if (!DEVMODE) {
    return rabbitMQ.publish(
      'logs',
      {
        hostname,
        service: QUEUE_NAME,
        level,
        message: messages
          .map((i) => ((typeof i === 'string') ? i : JSON.stringify(i)))
          .join(' '),
      },
    )
      .then(() => true);
  }

  return Promise.resolve(true);
};

export const critical = (...args: any[]): Promise<true> => log(CRITICAL, ...args);
export const error = (...args: any[]): Promise<true> => log(ERROR, ...args);
export const debug = (...args: any[]): Promise<true> => log(DEBUG, ...args);
export const info = (...args: any[]): Promise<true> => log(INFO, ...args);
export const warn = (...args: any[]): Promise<true> => log(WARN, ...args);
