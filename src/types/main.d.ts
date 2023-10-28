import { Collection, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord';

export interface SlashCommand {
  command: SlashCommandBuilder | any;
  // eslint-disable-next-line
  execute: (interaction: ChatInputCommandInteraction) => void;
}

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
    commands: Collection<string, SlashCommand>;
  }
}
