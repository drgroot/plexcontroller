/* eslint-disable no-await-in-loop */
import { CronJob } from 'cron';
import {
  queueName, DAILY_CRON, CRON_TIMEZONE,
} from './com/config';
import { critical, debug } from './com/log';
import type { QueueMessage } from './lib/message';
import { toMe } from './lib/message';
import Plex, { HOSTNAMES } from './lib/plex';

export default class SideCar {
  private server: Promise<Plex>;

  constructor() {
    this.server = Plex.build(HOSTNAMES.LOCAL);
    this.onConsuming = this.onConsuming.bind(this);
    this.onMessage = this.onMessage.bind(this);

    if (DAILY_CRON) {
      const sideCar = this;

      // apply database playback
      const jobPlayback = new CronJob(
        DAILY_CRON,
        () => sideCar.server
          .then((plexServer) => plexServer.playback.applyDatabasePlaybacks()),
        null,
        true,
        CRON_TIMEZONE,
      );
      jobPlayback.start();
    }
  }

  async onConsuming() {
    const server = await this.server;
    server.websocket.listen();
    server.playback.applyDatabasePlaybacks();
  }

  async onMessage(message: QueueMessage) {
    const server = await this.server;
    debug('worker', message);

    if (message.sentFrom === queueName) {
      return true;
    }

    if (message.sentFrom.indexOf('toMe') > -1 && message.sentFrom !== toMe) {
      return true;
    }

    if (message.module === 'playback') {
      if (message.command === 'sync') {
        return server.syncPlayBack(
          `${message.values[0]}`,
          `${message.values[1]}`,
          `${message.values[2]}`,
          (typeof message.values[3] !== 'string') ? message.values[3] : parseInt(message.values[3], 10),
        );
      }
    }

    if (message.module === 'library') {
      return server.library.message(message);
    }

    critical('cannot handle message:', message);
    return false;
  }
}
