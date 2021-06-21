import { EventEmitter } from 'events';
import WS from 'ws';
import { critical, info } from '../com/log';

export interface PACKETTYPE {
  [key: string]: string,
}

interface HandlePacket {
  (type: string, data: any): any
}

export default class Websocket extends EventEmitter {
  private id: string;

  private url: string;

  private packet: HandlePacket;

  private connecting: boolean = true;

  private ws: WS | null = null;

  constructor(address: string, url: string, packet: HandlePacket) {
    super();
    this.id = address;
    this.url = url;

    if (!this.id
      || typeof this.id !== 'string') {
      throw new TypeError('Websocket : ID must be a string');
    }
    if (!this.url
      || typeof this.url !== 'string') {
      throw new TypeError('Websocket : URL must be a string');
    }
    if (typeof packet === 'function') {
      /**
       * @type {(type: types, data: object) => void}
       */
      this.packet = packet;
    } else {
      throw new TypeError('Websocket : PACKET must be a function');
    }

    this.onOpen = this.onOpen.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onError = this.onError.bind(this);
    this.onClose = this.onClose.bind(this);

    let attempts = 0;
    this.on('connect', () => info('websocket connection made'));
    this.on('error', (e) => {
      if (attempts > 10) {
        critical('websocket error', e.message);
        process.exit(1);
      }

      this.init();
      attempts += 1;
    });
  }

  init(): Websocket {
    this.ws = new WS(this.url);
    this.ws.on('open', this.onOpen);
    this.ws.on('message', this.onMessage);
    this.ws.on('error', this.onError);
    this.ws.on('close', this.onClose);

    setTimeout(() => {
      if (this.connecting) {
        return new Error('Connection timed out');
      }
      return true;
    }, 30000);
    this.connecting = true;
    return this;
  }

  onOpen() {
    this.emit('connect', this.id);
  }

  onMessage(dataInput: string | null | undefined) {
    try {
      const dataParsed = (dataInput) ? JSON.parse(dataInput) : {};
      if (dataParsed.NotificationContainer) {
        this.connecting = false;
        const data = dataParsed.NotificationContainer;
        if (data.type) {
          this.packet(data.type, data);
        }
      }
    } catch (err) {
      this.emit('error', err, this.id);
    }
  }

  onError(err: Error) {
    this.emit('error', err, this.id);
    if (this.ws) {
      this.ws.terminate();
    }
  }

  onClose(code: number, reason: string) {
    this.emit('debug', `WS Disconnected - ${JSON.stringify({ code, reason })}`);
    let err = !code || code === 1000 ? null : new Error(`${code}: ${reason}`);
    if (code) {
      this.emit('debug', `${code === 1000 ? 'Clean' : 'Unclean'} WS Close: ${code} - ${reason}`, this.id);
      if (code >= 4000 || code <= 4999) {
        err = new Error(`Plex error code: ${code}`);
      } else if (code !== 1000 && reason) {
        err = new Error(`${code} - ${reason}`);
      }
      if (err) {
        // @ts-ignore
        err.code = code;
      }
    } else {
      this.emit('debug', `WS close: unknown code - ${reason}`, this.id);
    }
  }
}
