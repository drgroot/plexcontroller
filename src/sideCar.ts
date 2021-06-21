/* eslint-disable no-await-in-loop, func-names */
import Path from 'path';
import { CronJob } from 'cron';
import { queueName, DAILY_CRON, CRON_TIMEZONE } from './com/config';
import { critical, debug } from './com/log';
import { getRecentFiles } from './com/db/models/files';
import type { QueueMessage } from './lib/message';
import Plex, { HOSTNAMES } from './lib/plex';

export default class SideCar {
  private server: Promise<Plex>;

  constructor() {
    this.server = Plex.build(HOSTNAMES.LOCAL);
    this.onConsuming = this.onConsuming.bind(this);
    this.onMessage = this.onMessage.bind(this);

    if (DAILY_CRON) {
      const job = new CronJob(
        DAILY_CRON,
        // @ts-ignore
        function () { this.scanRecent(); },
        null,
        true,
        CRON_TIMEZONE,
      );
      job.start();
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

  async scanRecent() {
    debug('sidecar', 'starting to check library presence of files');
    const server = await this.server;
    const newFiles = await getRecentFiles();

    debug('sidecar', 'daily scan', 'checking', newFiles.length, 'files');
    const sentPaths = new Set();
    for (const { path } of newFiles) {
      debug('sidecar', 'checking for path', path);
      const relativePath = Path.dirname(path);

      // scan at most 5 paths
      if (!sentPaths.has(relativePath) && sentPaths.size < 5) {
        const [hasItem, libraryTitle] = await server.library.hasItem(path);

        if (!hasItem && libraryTitle) {
          debug('sidecar', 'daily scan', 'sending scan command for ', { relativePath, libraryTitle });
          await server.library.scan(libraryTitle, relativePath);
          sentPaths.add(relativePath);
        }
      }
    }
  }
}
