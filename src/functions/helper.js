const { errorMessage } = require('./logger.js');
const config = require('../../config.json');
const getDirName = require('path').dirname;
const fsExtra = require('fs-extra');
const { set } = require('lodash');
const mkdirp = require('mkdirp');
const fs = require('fs');

function generateID(length) {
  try {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
      charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  } catch (error) {
    console.log(error);
  }
}

function getCurrentTime() {
  try {
    if (config.other.timezone === null) {
      return new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    } else {
      return new Date().toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: config.other.timezone,
      });
    }
  } catch (error) {
    var errorId = generateID(config.other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    console.log(error);
    return error;
  }
}

async function writeAt(filePath, jsonPath, value) {
  try {
    mkdirp.sync(getDirName(filePath));
    const json = await fsExtra.readJson(filePath);
    set(json, jsonPath, value);
    return await fsExtra.writeJson(filePath, json);
  } catch (error) {
    console.log(error);
    const json_1 = {};
    set(json_1, jsonPath, value);
    return await fsExtra.writeJson(filePath, json_1);
  }
}

async function blacklistCheck(id) {
  try {
    const blacklist = await JSON.parse(fs.readFileSync('data/blacklist.json', 'utf8'));
    if (blacklist[id]) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    var errorId = generateID(config.other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    console.log(error);
    return error;
  }
}

function toFixed(num, fixed) {
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
  } catch (error) {
    var errorId = generateID(config.other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    console.log(error);
    return error;
  }
}

function cleanMessage(message) {
  return message.toString().replaceAll('Error: ', '').replaceAll('`', '').replaceAll('ez', 'easy');
}

module.exports = {
  generateID,
  getCurrentTime,
  writeAt,
  blacklistCheck,
  toFixed,
  cleanMessage,
};
