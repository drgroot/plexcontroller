/* eslint-disable no-await-in-loop, func-names */
import { CronJob } from 'cron';
import { debug } from './com/log';
import { MONTHLY_CRON, CRON_TIMEZONE } from './com/config';
import send from './lib/message';
import Plex, { HOSTNAMES } from './lib/plex';
import { LibraryCommands } from './lib/plex/library';

export default class Controller {
  private server: Promise<Plex>;

  constructor() {
    this.server = Plex.build(HOSTNAMES.KUBERNETES);

    this.onConsuming = this.onConsuming.bind(this);
    this.onMessage = this.onMessage.bind(this);

    if (MONTHLY_CRON) {
      const job = new CronJob(
        MONTHLY_CRON,
        // @ts-ignore
        function () { this.scanFullLibrary(); },
        null,
        true,
        CRON_TIMEZONE,
      );
      job.start();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  onConsuming() {
    debug('staring to consume');
  }

  // eslint-disable-next-line class-methods-use-this
  onMessage() {
    return Promise.resolve(true);
  }

  async scanFullLibrary() {
    const server = await this.server;
    const libraries = await server.library.getAllLibraries();
    for (const library of libraries) {
      await send(
        'library',
        {
          command: LibraryCommands.SCAN_LIBRARY,
          values: [library.title],
        },
      );
    }
  }
}
