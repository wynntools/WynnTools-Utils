// Credits https://github.com/DuckySoLucky/hypixel-discord-chat-bridge/blob/f8a8a8e1e1c469127b8fcd03e6553b43f22b8250/src/Logger.js (Edited)
const customLevels = { cache: 0, event: 1, discord: 2, error: 3, script: 4, warn: 5, other: 6, max: 7 };
import { createLogger, format as _format, transports as _transports } from 'winston';
import { other as _other } from '../../config.json';
import { join } from 'path';

const logDirectory = join(__dirname, '../../logs');
const timezone = () => {
  if (_other.timezone === null) {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
  } else {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      timeZone: _other.timezone,
    });
  }
};

// TODO Add logs flushing for logs older then 14d
// TODO Add cli-color support

const cacheLogger = createLogger({
  level: 'cache',
  levels: customLevels,
  format: _format.combine(
    _format.timestamp({ format: timezone }),
    _format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [
    new _transports.File({ name: 'cache', filename: join(logDirectory, 'cache.log'), level: 'cache' }),
    new _transports.File({ name: 'combined', filename: join(logDirectory, 'combined.log'), level: 'max' }),
    new _transports.Console({ levels: 'max' }),
  ],
});

const eventLogger = createLogger({
  level: 'event',
  levels: customLevels,
  format: _format.combine(
    _format.timestamp({ format: timezone }),
    _format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [
    new _transports.File({
      name: 'event',
      filename: join(logDirectory, 'event.log'),
      level: 'event',
    }),
    new _transports.File({ name: 'combined', filename: join(logDirectory, 'combined.log'), level: 'max' }),
    new _transports.Console({ levels: 'max' }),
  ],
});

const discordLogger = createLogger({
  level: 'discord',
  levels: customLevels,
  format: _format.combine(
    _format.timestamp({ format: timezone }),
    _format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [
    new _transports.File({
      name: 'discord',
      filename: join(logDirectory, 'discord.log'),
      level: 'discord',
    }),
    new _transports.File({ name: 'combined', filename: join(logDirectory, 'combined.log'), level: 'max' }),
    new _transports.Console({ levels: 'max' }),
  ],
});

const errorLogger = createLogger({
  level: 'error',
  levels: customLevels,
  format: _format.combine(
    _format.timestamp({ format: timezone }),
    _format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [
    new _transports.File({ name: 'error', filename: join(logDirectory, 'error.log'), level: 'error' }),
    new _transports.File({ name: 'combined', filename: join(logDirectory, 'combined.log'), level: 'max' }),
    new _transports.Console({ levels: 'max' }),
  ],
});

const scriptLogger = createLogger({
  level: 'script',
  levels: customLevels,
  format: _format.combine(
    _format.timestamp({ format: timezone }),
    _format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [
    new _transports.File({ name: 'script', filename: join(logDirectory, 'script.log'), level: 'script' }),
    new _transports.File({ name: 'combined', filename: join(logDirectory, 'combined.log'), level: 'max' }),
    new _transports.Console({ levels: 'max' }),
  ],
});

const warnLogger = createLogger({
  level: 'warn',
  levels: customLevels,
  format: _format.combine(
    _format.timestamp({ format: timezone }),
    _format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [
    new _transports.File({ name: 'warn', filename: join(logDirectory, 'warn.log'), level: 'warn' }),
    new _transports.File({ name: 'combined', filename: join(logDirectory, 'combined.log'), level: 'max' }),
    new _transports.Console({ levels: 'max' }),
  ],
});

const otherLogger = createLogger({
  level: 'other',
  levels: customLevels,
  format: _format.combine(
    _format.timestamp({ format: timezone }),
    _format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [
    new _transports.File({ name: 'other', filename: join(logDirectory, 'other.log'), level: 'other' }),
    new _transports.File({ name: 'combined', filename: join(logDirectory, 'combined.log'), level: 'max' }),
    new _transports.Console({ levels: 'max' }),
  ],
});

const logger = {
  cache: (...args) => {
    return cacheLogger.cache(args.join(' > '));
  },
  event: (params) => {
    return eventLogger.event(params);
  },
  discord: (params) => {
    return discordLogger.discord(params);
  },
  error: (params) => {
    return errorLogger.error(params);
  },
  script: (params) => {
    return scriptLogger.script(params);
  },
  warn: (params) => {
    return warnLogger.warn(params);
  },
  other: (params) => {
    return otherLogger.other(params);
  },
};

export const updateMessage = () => {
  const columns = process.stdout.columns;
  const warning = 'IMPORTANT!';
  const message2 = 'Bot has updated, please restart the bot to apply changes!';
  const padding = ' '.repeat(Math.floor((columns - warning.length) / 2));
  const padding2 = ' '.repeat(Math.floor((columns - message2.length) / 2));
  // eslint-disable-next-line
  console.log(padding + warning + padding + '\n' + padding2 + message2 + padding2);
};

export const discordMessage = logger.discord;
export const eventMessage = logger.event;
export const warnMessage = logger.warn;
export const errorMessage = logger.error;
export const scriptMessage = logger.script;
export const cacheMessage = logger.cache;
export const otherMessage = logger.other;
