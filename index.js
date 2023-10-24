import { discordMessage, scriptMessage, warnMessage, errorMessage } from './src/functions/logger.js';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
import { toFixed, generateID } from './src/functions/helper.js';
import { deployCommands } from './deploy-commands.js';
import { other, discord } from './config.json';
import { readdirSync } from 'fs';
import { join } from 'path';

async function start() {
  const client = new Client({
    intents: [
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.Guilds,
    ],
  });
  client.commands = new Collection();
  const foldersPath = join(__dirname, 'src/commands');
  const commandFolders = readdirSync(foldersPath);
  for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const command = require(filePath).default;
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        warnMessage(`The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }

  deployCommands();
  await delay(3000);

  client.once(Events.ClientReady, async () => {
    global.uptime = toFixed(new Date().getTime() / 1000, 0);
    global.client = client;
    discordMessage(`Client Logged in as ${client.user.tag}`);
    const scriptFiles = readdirSync('./src/scripts').filter((file) => file.endsWith('.js'));
    scriptMessage(`Found ${scriptFiles.length} scripts and running them all`);
    var skipped = 0;
    for (const file of scriptFiles) {
      try {
        if (file.toLowerCase().includes('disabled')) {
          skipped++;
          scriptMessage(`Skipped ${file} script`);
          continue;
        }
        scriptMessage(`Started ${file} script`);
        require(`./src/scripts/${file}`).default
        await delay(300);
      } catch (error) {
        var errorId = generateID(other.errorIdLength);
        errorMessage(`Error ID: ${errorId}`);
        errorMessage(error);
      }
    }
    scriptMessage(`Started ${scriptFiles.length - skipped} script(s) and skipped ${skipped} script(s)`);
  });

  try {
    const eventsPath = join(__dirname, 'src/events');
    const eventFiles = readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
    scriptMessage(`Found ${eventFiles.length} Events and running them all`);
    var skippedEvents = 0;
    for (const file of eventFiles) {
      try {
        const filePath = join(eventsPath, file);
        const event = require(filePath).default
        if (file.toLowerCase().includes('disabled')) {
          skippedEvents++;
          scriptMessage(`Skipped ${event.name} Event`);
          await delay(300);
          continue;
        }
        client.on(event.name, (...args) => event.execute(...args));
        scriptMessage(`Started ${event.name} Event`);
        await delay(300);
      } catch (error) {
        var startingEventErrorId = generateID(other.errorIdLength);
        errorMessage(`Error ID: ${startingEventErrorId}`);
        errorMessage(error);
      }
    }
    scriptMessage(`Started ${eventFiles.length - skippedEvents} event(s) and skipped ${skippedEvents} events(s)`);
  } catch (error) {
    var errorId = generateID(other.errorIdLength);
    errorMessage(`Error ID: ${errorId}`);
    errorMessage(error);
  }

  client.login(discord.token);
}

start();
