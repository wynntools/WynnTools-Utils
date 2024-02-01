import { errorMessage, eventMessage } from './logger';
import { Client } from 'discord.js';
import { readdirSync } from 'fs';

export const deployEvents = async (client: Client) => {
  try {
    const eventFiles = readdirSync('./src/events/');
    let count = eventFiles.length;
    for (const file of eventFiles) {
      if (file.toLowerCase().includes('disabled')) {
        count--;
        continue;
      }
      const event = await import(`../events/${file}`);
      const name = file.split('.')[0];
      client.on(name, event.execute.bind(null));
      eventMessage(`Successfully loaded ${name}`);
    }
    eventMessage(`Successfully loaded ${count} event(s).`);
  } catch (error: any) {
    errorMessage(error);
  }
};
