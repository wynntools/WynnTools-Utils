import { discordMessage, warnMessage, errorMessage } from './src/functions/logger.js';
import { generateID } from './src/functions/helper.js';
import { discord, other } from './config.json';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

export const deployCommands = () => {
  const commands = [];
  let skipped = 0;
  const foldersPath = join(__dirname, 'src/commands');
  const commandFolders = readdirSync(foldersPath);
  for (const folder of commandFolders) {
    if (folder == 'dev') continue;
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      if (file.toLowerCase().includes('disabled')) {
        skipped++;
        continue;
      }
      const filePath = join(commandsPath, file);
      const command = require(filePath).default;
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        warnMessage(`The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }

  const rest = new REST().setToken(discord.token);

  (async () => {
    try {
      discordMessage(
        `Started refreshing ${commands.length} application (/) commands and skipped over ${skipped} commands.`
      );
      const data = await rest.put(Routes.applicationCommands(discord.clientId), {
        body: commands,
      });
      discordMessage(
        `Successfully reloaded ${data.length} application (/) commands and skipped over ${skipped} commands.`
      );
    } catch (error) {
      var errorId = generateID(other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      errorMessage(error);
    }
  })();
};
