/* eslint-disable no-await-in-loop */
import { debug } from './com/log';
import send from './lib/message';
import Plex, { HOSTNAMES } from './lib/plex';
import { LibraryCommands } from './lib/plex/library';

export default class Controller {
  private server: Promise<Plex>;

  constructor() {
    this.server = Plex.build(HOSTNAMES.KUBERNETES);

    this.onConsuming = this.onConsuming.bind(this);
    this.onMessage = this.onMessage.bind(this);
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
