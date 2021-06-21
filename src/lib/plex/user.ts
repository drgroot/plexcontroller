import { warn } from '../../com/log';
import Component from './component';
import { getUsers, getSharedServers } from './endpoints';

interface PlexUserAccount {
  id: string;
  username: string;
  email: string;
  accessToken: string;
}

export const getToken = async (
  plexTV: any, machineIdentifier: string, email: string,
): Promise<string | null> => {
  const response = await plexTV.query(getSharedServers(machineIdentifier));
  if (response?.MediaContainer?.SharedServer) {
    const user = response.MediaContainer.SharedServer.find(
      ({ attributes }: { attributes: PlexUserAccount }) => attributes.email === email,
    );
    if (user) return user.attributes.accessToken;
    warn('users', 'cannot find token for user', email);
    return null;
  }

  return null;
};

export default class User extends Component {
  async getAllAccounts(): Promise<PlexUserAccount[]> {
    const response = await this.PlexInstance.plexTV.query(getUsers());
    if (response?.MediaContainer?.User) {
      return response.MediaContainer.User
        .map(
          ({ attributes: user }: { attributes: PlexUserAccount }) => ({
            id: user.id,
            username: user.username,
            email: user.email,
          }),
        );
    }
    return [];
  }

  async getEmail(username: string): Promise<string | null> {
    const accounts = await this.getAllAccounts();
    return (
      accounts.find((a) => a.username === username) || { email: null }
    )
      .email;
  }

  getToken(machineIdentifier: string, email: string): Promise<string | null> {
    return getToken(
      this.PlexInstance.plexTV,
      machineIdentifier,
      email,
    );
  }
}
