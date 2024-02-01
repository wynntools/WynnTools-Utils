import { Collection, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord';

export interface SlashCommand {
  command: SlashCommandBuilder | any;
  // eslint-disable-next-line no-unused-vars
  execute: (interaction: ChatInputCommandInteraction) => void;
}

export interface User {
  username: string;
  id: string;
  displayName: string | null;
  avatar: string | null;
  bot: boolean;
}

export interface Message {
  author: User;
  content: string;
  timestamp: number;
}

export interface OpenClose {
  timestamp: number;
  reason: string | null;
  by: User;
}

export interface Users {
  user: User;
  added: { timestamp: number; by: User };
  removed: { timestamp: number; by: User } | null;
}

export interface Ticket {
  _id?: any;
  __v?: any;
  uuid: string;
  ticketInfo: { name: string; channelId: string; opened: OpenClose; closed: OpenClose | null; users: Users[] | [] };
  messages: Message[] | [];
  reason: string | null;
}

export interface Blacklist {
  user: User;
  timestamp: number;
  by: User;
  reason: string | null;
}

export interface MongoResponse {
  success: boolean;
  info: string;
  error?: string;
  ticket?: Ticket;
  blacklist?: Blacklist;
  tickets?: Ticket[];
  blacklists?: Blacklist[];
}

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, SlashCommand>;
  }
}
