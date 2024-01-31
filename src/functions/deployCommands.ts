import { Client, Collection, REST, Routes } from 'discord.js';
import { eventMessage, errorMessage } from './logger';
import { SlashCommand } from '../types/main';
import { discord } from '../../config.json';
import { readdirSync } from 'fs';

export const deployCommands = async (client: Client) => {
  try {
    client.commands = new Collection<string, SlashCommand>();
    const commandFiles = readdirSync('./src/commands');
    const commands = [];
    for (const file of commandFiles) {
      const command = await import(`../commands/${file}`);
      commands.push(command.data.toJSON());
      if (command.data.name) {
        client.commands.set(command.data.name, command);
      }
    }
    const rest = new REST({ version: '10' }).setToken(discord.token);
    (async () => {
      try {
        await rest.put(Routes.applicationCommands(discord.clientId), { body: commands });
        eventMessage(`Successfully reloaded ${commands.length} application command(s).`);
      } catch (error: any) {
        errorMessage(error);
      }
    })();
  } catch (error: any) {
    errorMessage(error);
  }
};
