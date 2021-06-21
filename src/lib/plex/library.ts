/* eslint-disable no-await-in-loop */
import path from 'path';
import { critical, debug, warn } from '../../com/log';
import type { Message } from '../message';
import type Plex from '.';
import Component from './component';
import {
  getLibraries, getLibraryItems, scanLibrary, scanLibraryPath,
} from './endpoints';

export const LibraryCommands: { [key: string]: string } = {
  SCAN_PATH: 'scan.path',
  SCAN_LIBRARY: 'scan.library',
};

interface LibraryItem {
  ratingKey: string,
  key: string,
  Media?: { Part: { file: string }[] }[]
  title: string
  duration: number,
}

type ItemSort = [LibraryDef, number];

interface LibraryLocation {
  path: string
}

interface LibraryDef extends LibraryItem {
  Location: LibraryLocation[]
}

/**
 * @description Queries an endpoint and its children until it comes across items that contain
 *  the propertyName 'needle'
 */
const findNeedleWithKey = async (
  PlexInstance: Plex,
  startKey: string,
  needle: string,
): Promise<LibraryItem[]> => {
  const { MediaContainer: { Metadata: Items } } = await PlexInstance.server.query(startKey);
  const needles = [];

  for (const item of Items) {
    if (!item[needle]) {
      const deepNeedles = await findNeedleWithKey(PlexInstance, item.key, needle);
      needles.push(...deepNeedles);
    } else {
      needles.push(item);
    }
  }

  return needles;
};

export default class Library extends Component {
  async getAllLibraries(): Promise<LibraryDef[]> {
    const response = await this.PlexInstance.server.query(getLibraries());
    if (response?.MediaContainer?.Directory) {
      return response.MediaContainer.Directory;
    }
    return [];
  }

  async getByTitle(libraryTitle: string) {
    const libraries = await this.getAllLibraries();
    return libraries
      .find(({ title }) => title === libraryTitle) || null;
  }

  async getMediaItem(libraryTitle: string, mediaTitle: string): Promise<LibraryItem | null> {
    debug('lib/library.js', 'finding media item', { mediaTitle, libraryTitle });

    // find the library
    const library = await this.getByTitle(libraryTitle);
    if (!library) {
      warn('lib/library.js', 'unable to find library', libraryTitle);
      return null;
    }

    // get all items and find the item
    const Items = await findNeedleWithKey(this.PlexInstance, getLibraryItems(library.key), 'Media');
    const item = Items.find(({ title }) => title === mediaTitle);
    if (!item) {
      warn('lib/library.js', 'unable to find item wth title', { mediaTitle, libraryTitle });
      return null;
    }

    return item;
  }

  async getRatingKey(libraryTitle: string, mediaTitle: string): Promise<string | null> {
    const mediaItem = await this.getMediaItem(libraryTitle, mediaTitle);
    if (mediaItem) {
      return mediaItem.ratingKey;
    }
    return null;
  }

  async hasItem(fname: string): Promise<[boolean, string]> {
    const basef = path.basename(fname);
    debug('lib/library.js', 'finding if item basef exists', { fname, basef });

    // determine what library the file will most likely beling to
    const splitFolders = fname.split('/');
    const libraries = await this.getAllLibraries();
    const library: LibraryDef | null = libraries.map((clibrary) => {
      let score: number = 0;
      for (const { path: libraryPath } of clibrary.Location) {
        for (const item of libraryPath.split('/')) {
          if (splitFolders.includes(item)) {
            score += 1;
          }
        }
      }

      const sortable: ItemSort = [clibrary, score];
      return sortable;
    })
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map((sortable: ItemSort) => sortable[0])
      .find(() => true) || null;
    if (!library) {
      return [false, ''];
    }
    debug('lib/library.js', 'hasItem', 'matched', fname, 'to library', library.title);

    // loop through the items of the library and determine if the file exists on the disk
    const response = await this.PlexInstance.server.query(getLibraryItems(library.key));
    if (response?.MediaContainer?.Metadata) {
      for (const item of response?.MediaContainer?.Metadata) {
        const mediaFiles = await findNeedleWithKey(this.PlexInstance, item.key, 'Media');
        for (const media of mediaFiles) {
          if (media.Media) {
            for (const { Part } of media.Media) {
              for (const { file } of Part) {
                if (path.basename(file) === basef) {
                  return [true, library.title];
                }
              }
            }
          }
        }
      }
    }

    return [false, library.title];
  }

  async scan(libraryTitle: string, rpath?: string) {
    const library = await this.getByTitle(libraryTitle);
    if (!library) return false;

    // scan whole library
    if (!rpath) {
      await this.PlexInstance.server.perform(scanLibrary(library.key));
      return true;
    }

    // match the folder path to the library root path since there can be
    // multiple parts inside of the library
    const splitFolders = rpath.split('/');
    const libraryRootPath = library.Location
      .map(({ path: lpath }) => {
        let score = 0;
        for (const item of lpath.split('/')) {
          if (splitFolders.includes(item)) {
            score += 1;
          }
        }

        const retScore: [string, number] = [lpath, score];
        return retScore;
      })
      .sort((a, b) => b[1] - a[1])
      .map(([a]) => a)
      .find(() => true);
    if (!libraryRootPath) return false;

    // construct folder to scan
    const scanPath: string[] = [];
    for (const item of [...libraryRootPath?.split('/'), ...splitFolders]) {
      if (!scanPath.includes(item) && item) {
        scanPath.push(item);
      }
    }

    // perform scan
    const scanpathFinal = `/${scanPath.join('/')}`;
    debug('scan', 'scanning', scanLibraryPath(library.key, scanpathFinal));
    await this.PlexInstance.server.perform(scanLibraryPath(library.key, scanpathFinal));
    return true;
  }

  async message({ command, values }: Message) {
    debug('library.message', 'recieved message', { command, values });
    if (!Object.values(LibraryCommands).includes(command)) {
      critical('library.message', 'unknown action', { command });
      return false;
    }

    if (command === LibraryCommands.SCAN_PATH && values.length === 2) {
      return this.scan(`${values[0]}`, `${values[1]}`);
    }

    return false;
  }
}
