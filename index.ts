import { Client, Events, GatewayIntentBits } from 'discord.js';
import { ready } from './src/events/ready';
import { discord } from './config.json';

const client = new Client({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.Guilds,
  ],
});

client.on(Events.ClientReady, () => {
  ready(client);
});

client.login(discord.token);
