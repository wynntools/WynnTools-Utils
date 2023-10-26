import { Collection } from 'discord.js';

export interface arrayMessages {
  timestamp: number;
  content: string;
  user: string;
  username: string;
  avatar: string | null;
  bot: boolean;
  displayName: string;
}

declare module 'discord.js' {
  export interface Client {
    commands: Collection<unknown, any>;
  }
}
