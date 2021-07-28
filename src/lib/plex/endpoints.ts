export const websocket = (hostname: string, port: number, token: string) => `ws://${hostname}:${port}/:/websockets/notifications?X-Plex-Token=${token}`;

export const servers = () => '/pms/servers.xml';
export const getUsers = () => '/api/users';
export const getSharedServers = (machineId: string) => `/api/servers/${machineId}/shared_servers`;

export const getLibraries = () => '/library/sections';
export const getLibraryItems = (libraryKey: string) => `/library/sections/${libraryKey}/all`;
export const getItemByKey = (ratingKey: string) => `/library/metadata/${ratingKey}`;
export const scanLibrary = (libraryKey: string) => `library/sections/${libraryKey}/refresh`;
export const scanLibraryPath = (libraryKey: string, path: string) => `${scanLibrary(libraryKey)}?path=${path}`;

export const getSessionById = (sessionId: string) => `/status/sessions?sessionKey=${sessionId}`;
export const markWatched = (ratingKey: string) => `/:/scrobble?key=${ratingKey}&identifier=com.plexapp.plugins.library`;
export const markUnWatched = (ratingKey: string) => `/:/unscrobble?key=${ratingKey}&identifier=com.plexapp.plugins.library`;
export const setPlayback = (ratingKey: string, timems: number, duration: number, state = 'stopped') => {
  if (timems === -1) {
    return markWatched(ratingKey);
  }

  if (timems === 0) {
    return markUnWatched(ratingKey);
  }

  return `/:/timeline?ratingKey=${ratingKey}&identifier=com.plexapp.plugins.library&time=${timems}&state=${state}&duration=${duration}`;
};
