import { readJson, writeJson } from 'fs-extra';
import { dirname as getDirName } from 'path';
import { other } from '../../config.json';
import { errorMessage } from './logger';
import { readFileSync } from 'fs';
import { set } from 'lodash';
import { sync } from 'mkdirp';

export const generateID = (length: number) => {
  try {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
      charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  } catch (error: any) {
    errorMessage(error);
  }
};

export const getCurrentTime = () => {
  try {
    if (other.timezone === null) {
      return new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    } else {
      return new Date().toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: other.timezone,
      });
    }
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
    return error;
  }
};

export const writeAt = async (filePath: string, jsonPath: string, value: any) => {
  try {
    sync(getDirName(filePath));
    const json = await readJson(filePath);
    set(json, jsonPath, value);
    return await writeJson(filePath, json);
  } catch (error: any) {
    errorMessage(error);
    const json_1 = {};
    set(json_1, jsonPath, value);
    return await writeJson(filePath, json_1);
  }
};

export const blacklistCheck = async (id: string) => {
  try {
    const blacklist = await JSON.parse(readFileSync('data/blacklist.json', 'utf8'));
    if (blacklist[id]) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
    return error;
  }
};

export const toFixed = (num: any, fixed: number) => {
  try {
    if (fixed === undefined) fixed = 0;
    const response = new RegExp('^-?\\d+(?:\\.\\d{0,' + (fixed || -1) + '})?');
    const result = num.toString().match(response)[0];

    const parts = result.split('.');
    if (parts.length === 1 && fixed > 0) {
      parts.push('0'.repeat(fixed));
    } else if (parts.length === 2 && parts[1].length < fixed) {
      parts[1] = parts[1] + '0'.repeat(fixed - parts[1].length);
    }

    return parts.join('.');
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
    return error;
  }
};

export const cleanMessage = (message: any) => {
  return message.toString().replaceAll('Error: ', '').replaceAll('`', '').replaceAll('ez', 'easy');
};

export const convertChannelType = (type: number) => {
  if (type === 0) {
    return 'GuildText';
  } else if (type === 1) {
    return 'DM';
  } else if (type === 2) {
    return 'GuildVoice';
  } else if (type === 3) {
    return 'GroupDM';
  } else if (type === 4) {
    return 'GuildCategory';
  } else if (type === 5) {
    return 'GuildAnnouncement';
  } else if (type === 10) {
    return 'AnnouncementThread';
  } else if (type === 11) {
    return 'PublicThread';
  } else if (type === 12) {
    return 'PrivateThread';
  } else if (type === 13) {
    return 'GuildStageVoice';
  } else if (type === 14) {
    return 'GuildDirectory';
  } else if (type === 15) {
    return 'GuildForum';
  } else if (type === 16) {
    return 'GuildMedia';
  } else {
    return 'Unknown';
  }
};

export const isTicketBlacklisted = (userID: string, ticketBlacklist: any) => {
  for (const user of ticketBlacklist) {
    if (user.user === userID) {
      return true;
    }
  }
  return false;
};

export const removeFromArray = (array: any, id: string) => {
  try {
    const index = array.findIndex((obj: any) => obj.user === id);
    if (index > -1) {
      array.splice(index, 1);
      return array;
    }
  } catch (error: any) {
    errorMessage(error);
    return error;
  }
};

export default {
  generateID,
  getCurrentTime,
  writeAt,
  blacklistCheck,
  toFixed,
  cleanMessage,
  convertChannelType,
  isTicketBlacklisted,
  removeFromArray,
};
