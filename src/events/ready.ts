import { errorMessage, eventMessage } from '../functions/logger';
import { deployCommands } from '../functions/deployCommands';
import { deployEvents } from '../functions/deployEvents';
import { Client } from 'discord.js';

export const ready = (client: Client) => {
  try {
    eventMessage(`Logged in as ${client.user?.username} (${client.user?.id})!`);
    deployCommands(client);
    deployEvents(client);
  } catch (error: any) {
    errorMessage(error);
  }
};
