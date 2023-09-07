const { scriptMessage, errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { ActivityType } = require('discord.js');
const config = require('../../config.json');
const cron = require('node-cron');

let timezoneStuff = null;
if (config.other.timezone == null) {
  timezoneStuff = { scheduled: true };
} else {
  timezoneStuff = { scheduled: true, timezone: config.other.timezone };
}

var num = 0;
client.user.setPresence({ activities: [{ name: 'Over Tickets', type: ActivityType.Watching }] });
var activities = [
  { id: 'ticket', title: 'Over Tickets', type: 'Watching' },
  { id: 'support', title: 'Over The Support Server', type: 'Watching' },
];
cron.schedule(
  '*/5 * * * *',
  async function () {
    try {
      if (config.other.devMode) return scriptMessage('Dev mode enabled - not changing activity status');
      scriptMessage(`Changing activity status - ${activities[num].id}`);
      client.user.setPresence({
        activities: [{ name: activities[num].title, type: ActivityType[activities[num].type] }],
      });
      num++;
      if (num == activities.length) num = 0;
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error Id - ${errorId}`);
      console.log(error);
    }
  },
  timezoneStuff
);
