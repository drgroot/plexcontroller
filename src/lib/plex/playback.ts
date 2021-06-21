/* eslint-disable no-await-in-loop */
import {
  critical, error, debug, info,
} from '../../com/log';
import {
  getUser,
  newUser,
  setPlayback,
  getPlaybacks,
} from '../../com/db/models/user';
import send from '../message';
import Component from './component';
import { getSessionById, setPlayback as setPlexPlayback } from './endpoints';

interface Session {
  title: string
  librarySectionTitle: string
  duration: string
  viewOffset: string,
  User: { title: string }
}

export default class PlayBack extends Component {
  async sync(libraryTitle: string, title: string, time: number) {
    debug('playback', 'syncing item', { libraryTitle, title, time });
    const item = await this.PlexInstance.library.getMediaItem(libraryTitle, title);

    if (item) {
      await this.PlexInstance.server.query(
        setPlexPlayback(
          item.ratingKey,
          time,
          item.duration,
        ),
      );
      debug('playback', 'set playback information', { libraryTitle, title, time });
      return true;
    }

    error('playback', 'unable to sync, item not found', { libraryTitle, title, time });
    return false;
  }

  async saveSessionInfo(id: string): Promise<void> {
    const response = await this.PlexInstance.server.query(getSessionById(id));
    if (!response?.MediaContainer?.Metadata) return;

    const Sessions: Session[] = response.MediaContainer.Metadata;
    if (Sessions.length === 0) return;
    const [Session] = Sessions;
    const [duration, t] = [Session.duration, Session.viewOffset].map((f) => parseInt(f, 10));
    const time = (t / duration >= 0.95) ? -1 : t;

    // get user session
    const User = await getUser(Session.User.title);
    if (!User) {
      info('playback', 'adding new user', Session.User.title);
      const newEmail = await this.PlexInstance.user.getEmail(Session.User.title);
      if (!newEmail) return;

      await newUser(Session.User.title, newEmail);
      await this.saveSessionInfo(id);
      return;
    }

    const updated = await setPlayback(User.email, Session.librarySectionTitle, Session.title, time);
    if (updated) {
      await send(
        'playback',
        {
          command: 'sync',
          values: [User.email, Session.librarySectionTitle, Session.title, time],
        },
      );
    }
  }

  async applyDatabasePlaybacks() {
    const Users = await getPlaybacks();
    for (const user of Users) {
      if (user.UserPlaybacks) {
        for (const playback of user.UserPlaybacks) {
          await this.PlexInstance.syncPlayBack(
            user.email,
            playback.libraryTitle,
            playback.title,
            playback.time,
          );
        }
      }
    }
  }

  async websocketHandle(data: any) {
    if (!data.size) return;

    if (data.PlaySessionStateNotification) {
      for (const session of data.PlaySessionStateNotification) {
        if (session.state !== 'buffering') {
          this.saveSessionInfo(session.sessionKey);
        }
      }
    } else {
      critical('unrecoginized playback payload');
      critical('unrecoginized playback payload', data);
    }
  }
}
