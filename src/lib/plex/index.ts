import axios from 'axios';
// @ts-ignore
import PlexAPI from 'plex-api';
import {
  PLEXPASSWORD as password,
  PLEXUSERNAME as username,
  KUBERNETES_IP,
  STARTUP_DELAY,
  PLEXLOCAL_IP,
} from '../../com/config';
import { servers } from './endpoints';
import { sleep } from '../lib';
import Library from './library';
import PlexWebSocket from './ws';
import PlayBack from './playback';
import User, { getToken } from './user';
import { critical, debug } from '../../com/log';

type IPADDRESS = string;

type HOSTNAMELOOKUP = {
  [key: string]: IPADDRESS
};

export const HOSTNAMES: HOSTNAMELOOKUP = {
  LOCAL: PLEXLOCAL_IP,
  PLEX: 'plex.tv',
  KUBERNETES: KUBERNETES_IP || 'elrond.yusufali.ca:32400',
};

const options = {
  identifier: '28543486-48df-4adc-890f-fa673b10fc43',
  product: 'Plex Controller',
  verion: '1.0',
  deviceName: 'Plex Controller',
  platform: 'Node.js',
};

const myAuthOptions = {
  username,
  password,
  options,
};

const serverConnections: { [key: string]: PlexAPI } = {
  [HOSTNAMES.PLEX]: new PlexAPI({ port: 443, ...myAuthOptions, hostname: HOSTNAMES.PLEX }),
};

serverConnections[HOSTNAMES.PLEX]
  .serverMachineIdentifier = sleep(parseInt(STARTUP_DELAY, 10) * 0.75)
    .then(() => serverConnections[HOSTNAMES.PLEX]
      .query(servers())
      // @ts-ignore
      .then(({ MediaContainer: { Server: [server] } }) => server.attributes.machineIdentifier));

export default class Plex {
  public server: PlexAPI;

  public plexTV: PlexAPI;

  public user: User;

  public library: Library;

  public websocket: PlexWebSocket;

  public playback: PlayBack;

  constructor(server: PlexAPI) {
    this.server = server;
    this.plexTV = serverConnections[HOSTNAMES.PLEX];

    this.user = new User(this);
    this.library = new Library(this);
    this.websocket = new PlexWebSocket(this);
    this.playback = new PlayBack(this);
  }

  // eslint-disable-next-line class-methods-use-this
  async syncPlayBack(
    email: string, libraryTitle: string, title: string, time: number, ratingKey: string,
  ) {
    const userServer = await Plex.build(HOSTNAMES.LOCAL, email);
    return userServer.playback.sync(libraryTitle, title, time, ratingKey);
  }

  static async build(host: IPADDRESS, useremail?: string): Promise<Plex> {
    const serverConnectionName = useremail || host;
    if (!serverConnections[serverConnectionName]) {
      const port = 32400;
      let server;

      if (useremail) {
        const hostname = HOSTNAMES.LOCAL;

        const plexTV = serverConnections[HOSTNAMES.PLEX];
        const machineIdentifier = await plexTV.serverMachineIdentifier;
        const token = await getToken(plexTV, machineIdentifier, useremail);
        if (token) {
          const userServer = new PlexAPI({
            port: 32400,
            token,
            hostname,
            ...options,
          });
          server = userServer;
        }
      } else {
        server = new PlexAPI({ port, ...myAuthOptions, hostname: host });
        await server.query('/system');
      }
      serverConnections[serverConnectionName] = server;
    }

    return new Plex(serverConnections[serverConnectionName]);
  }

  performGet(rpath: string, parameters: { [key: string]: string } = {}): Promise<boolean> {
    axios.defaults.baseURL = `http://${this.server.serverUrl}`;
    debug('get', 'sending', parameters, 'to url', rpath);
    return axios.get(
      rpath,
      {
        params: {
          ...parameters,
          'X-Plex-Token': this.server.authToken,
        },
      },
    )
      .then(() => true)
      .catch((err) => critical(err));
  }
}
