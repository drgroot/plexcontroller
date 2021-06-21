import { debug, critical } from '../../com/log';
import WebSocket from '../ws';
import type { PACKETTYPE } from '../ws';
import { websocket } from './endpoints';
import Component from './component';

const PLEXPACKETS: PACKETTYPE = {
  UPDATESTATECHANGE: 'update.statechange',
  PLAYING: 'playing',
  BACKGROUNDPROCESSINGQUEUE: 'backgroundProcessingQueue',
  PROGRESS: 'progress',
  ACTIVITY: 'activity',
  PREFERENCE: 'preference',

  ACCOUNT: 'account',

  TRANSCODE_UPDATE: 'transcodeSession.update',
  TRANSCODE_END: 'transcodeSession.end',
  TRANSCODE_START: 'transcodeSession.start',

  TIMELINE: 'timeline',
  STATUS: 'status',
};

export default class PlexWebSocket extends Component {
  listen() {
    const socket = new WebSocket(
      this.PlexInstance.server.hostname,
      websocket(
        this.PlexInstance.server.hostname,
        this.PlexInstance.server.port,
        this.PlexInstance.server.authToken,
      ),
      (type, data) => {
        debug('plex websocket', data);
        if (type === PLEXPACKETS.PLAYING) {
          return this.PlexInstance.playback.websocketHandle(data);
        }

        if (!Object.values(PLEXPACKETS).includes(type)) {
          critical('new websocket plex observed', type);
          critical('websocket payload', data);
        }

        return true;
      },
    );
    socket.init();
  }
}
