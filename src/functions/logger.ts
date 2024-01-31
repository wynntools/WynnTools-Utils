// Credits https://github.com/DuckySoLucky/hypixel-discord-chat-bridge/blob/f8a8a8e1e1c469127b8fcd03e6553b43f22b8250/src/Logger.js (Edited)
const customLevels = { cache: 0, event: 1, error: 2, script: 3, warn: 4, other: 5, max: 6 };
import { createLogger, format, transports } from 'winston';
import { other } from '../../config.json';

const timezone = () => {
  if (other.timezone === null) {
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
      timeZone: other.timezone,
    });
  }
};

const cacheTransport = new transports.File({ level: 'cache', filename: './logs/cache.log' });
const eventTransport = new transports.File({ level: 'event', filename: './logs/event.log' });
const errorTransport = new transports.File({ level: 'error', filename: './logs/error.log' });
const scriptTransport = new transports.File({ level: 'script', filename: './logs/script.log' });
const warnTransport = new transports.File({ level: 'warn', filename: './logs/warn.log' });
const otherTransport = new transports.File({ level: 'other', filename: './logs/other.log' });
const combinedTransport = new transports.File({ level: 'max', filename: './logs/combined.log' });
const consoleTransport = new transports.Console({ level: 'max' });

const cacheLogger = createLogger({
  level: 'cache',
  levels: customLevels,
  format: format.combine(
    format.timestamp({ format: timezone }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [cacheTransport, combinedTransport, consoleTransport],
});

const eventLogger = createLogger({
  level: 'event',
  levels: customLevels,
  format: format.combine(
    format.timestamp({ format: timezone }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [eventTransport, combinedTransport, consoleTransport],
});

const errorLogger = createLogger({
  level: 'error',
  levels: customLevels,
  format: format.combine(
    format.timestamp({ format: timezone }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [errorTransport, combinedTransport, consoleTransport],
});

const scriptLogger = createLogger({
  level: 'script',
  levels: customLevels,
  format: format.combine(
    format.timestamp({ format: timezone }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [scriptTransport, combinedTransport, consoleTransport],
});

const warnLogger = createLogger({
  level: 'warn',
  levels: customLevels,
  format: format.combine(
    format.timestamp({ format: timezone }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [warnTransport, combinedTransport, consoleTransport],
});

const otherLogger = createLogger({
  level: 'other',
  levels: customLevels,
  format: format.combine(
    format.timestamp({ format: timezone }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()} > ${message}`;
    })
  ),
  transports: [otherTransport, combinedTransport, consoleTransport],
});

const logger = {
  cache: (cache: string, message: string) => {
    cacheLogger.log('cache', `${cache} | ${message}`);
  },
  event: (message: string) => {
    eventLogger.log('event', message);
  },
  error: (message: string) => {
    errorLogger.log('error', message);
  },
  script: (message: string) => {
    scriptLogger.log('script', message);
  },
  warn: (message: string) => {
    warnLogger.log('warn', message);
  },
  other: (message: string) => {
    otherLogger.log('other', message);
  },
};

export const updateMessage = () => {
  const columns = process.stdout.columns;
  const warning = 'IMPORTANT!';
  const message2 = 'Bot has updated, please restart the bot to apply changes!';
  const padding = ' '.repeat(Math.floor((columns - warning.length) / 2));
  const padding2 = ' '.repeat(Math.floor((columns - message2.length) / 2));
  // eslint-disable-next-line no-console
  console.log(padding + warning + padding + '\n' + padding2 + message2 + padding2);
};

export const cacheMessage = logger.cache;
export const eventMessage = logger.event;
export const errorMessage = logger.error;
export const scriptMessage = logger.script;
export const warnMessage = logger.warn;
export const otherMessage = logger.other;
