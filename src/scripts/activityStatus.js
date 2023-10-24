import { scriptMessage, errorMessage } from '../functions/logger.js';
import { generateID } from '../functions/helper.js';
import { ActivityType } from 'discord.js';
import { other } from '../../config.json';
import { schedule } from 'node-cron';

let timezoneStuff = null;
if (other.timezone == null) {
  timezoneStuff = { scheduled: true };
} else {
  timezoneStuff = { scheduled: true, timezone: other.timezone };
}

var num = 0;
client.user.setPresence({ activities: [{ name: 'Over Tickets', type: ActivityType.Watching }] });
var activities = [
  { id: 'ticket', title: 'Over Tickets', type: 'Watching' },
  { id: 'support', title: 'Over The Support Server', type: 'Watching' },
];
schedule(
  '*/5 * * * *',
  async function () {
    try {
      if (other.devMode) return scriptMessage('Dev mode enabled - not changing activity status');
      scriptMessage(`Changing activity status - ${activities[num].id}`);
      client.user.setPresence({
        activities: [{ name: activities[num].title, type: ActivityType[activities[num].type] }],
      });
      num++;
      if (num == activities.length) num = 0;
    } catch (error) {
      var errorId = generateID(other.errorIdLength);
      errorMessage(`Error Id - ${errorId}`);
      errorMessage(error);
    }
  },
  timezoneStuff
);
