import type Plex from './index';

export default class PlexComponent {
  protected PlexInstance: Plex;

  constructor(plex: Plex) {
    this.PlexInstance = plex;
  }
}
