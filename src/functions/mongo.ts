import { Blacklist, MongoResponse, Ticket } from '../types/main';
import { errorMessage, otherMessage } from './logger';
import { Schema, connect, model } from 'mongoose';
import { mongo } from '../../config.json';
import sanitize from 'mongo-sanitize';

export const connectDB = (): string => {
  connect(mongo).then(() => otherMessage('Connected to MongoDB'));
  return 'Connected to MongoDB';
};

const userSchema = new Schema({
  username: String,
  id: String,
  displayName: { type: String, default: null },
  avatar: { type: String, default: null },
  bot: Boolean,
});

const messageSchema = new Schema({ author: userSchema, content: String, timestamp: Number });
const openCloseSchema = new Schema({ timestamp: Number, reason: { type: String, default: null }, by: userSchema });
const addedRemovedSchema = new Schema({ timestamp: Number, by: userSchema });

const usersSchema = new Schema({
  user: userSchema,
  added: { timestamp: Number, by: userSchema },
  removed: { type: addedRemovedSchema, default: null },
});

const ticketSchema = new Schema({
  uuid: String,
  ticketInfo: {
    name: String,
    channelId: String,
    opened: openCloseSchema,
    closed: { type: openCloseSchema, default: null },
    users: { type: [usersSchema], default: [] },
  },
  messages: [messageSchema],
  reason: { type: String, default: null },
});

const Ticket = model('Ticket', ticketSchema);

export const saveTicket = async (ticket: Ticket): Promise<MongoResponse> => {
  try {
    const ticketCheck = await Ticket.findOne({ uuid: ticket.uuid });
    if (ticketCheck) {
      return { success: false, info: 'Ticket already exists' };
    }
    ticket = sanitize(ticket);
    const newUser = new Ticket(ticket);
    await newUser.save();
    return { success: true, info: 'Saved Ticket' };
  } catch (error: any) {
    errorMessage(error);
    return { success: false, info: 'Error saving Ticket', error: error };
  }
};

export const getTicket = async (uuid: string): Promise<MongoResponse> => {
  try {
    const ticket = (await Ticket.findOne({ uuid: uuid })) as Ticket;
    return { success: true, info: 'Got Ticket', ticket: ticket };
  } catch (error: any) {
    errorMessage(error);
    return { success: false, info: 'Error getting Ticket', error: error };
  }
};

export const getTicketByUser = async (userId: string) => {
  try {
    const tickets = await Ticket.find({ 'ticketInfo.opened.by.id': userId });
    return { success: true, info: 'Got Tickets', tickets: tickets };
  } catch (error: any) {
    errorMessage(error);
    return { success: false, info: 'Error getting Tickets', error: error };
  }
};

export const getTickets = async (): Promise<MongoResponse> => {
  try {
    const tickets = (await Ticket.find({})) as Ticket[];
    return { success: true, info: 'Got Tickets', tickets: tickets };
  } catch (error: any) {
    errorMessage(error);
    return { success: false, info: 'Error getting Tickets', error: error };
  }
};

export const updateTicket = async (ticket: Ticket): Promise<MongoResponse> => {
  try {
    await Ticket.updateOne({ uuid: ticket.uuid }, ticket);
    return { success: true, info: 'Updated Ticket' };
  } catch (error: any) {
    errorMessage(error);
    return { success: false, info: 'Error updating Ticket', error: error };
  }
};

const blacklistSchema = new Schema({ user: userSchema, timestamp: Number, by: userSchema, reason: String });
const Blacklist = model('Blacklist', blacklistSchema);

export const saveBlacklist = async (blacklist: Blacklist): Promise<MongoResponse> => {
  try {
    const blacklistCheck = await Blacklist.findOne({ 'user.id': blacklist.user.id });
    if (blacklistCheck) {
      return { success: false, info: 'Blacklist already exists' };
    }
    blacklist = sanitize(blacklist);
    const newUser = new Blacklist(blacklist);
    await newUser.save();
    return { success: true, info: 'Saved Blacklist' };
  } catch (error: any) {
    errorMessage(error);
    return { success: false, info: 'Error saving Blacklist', error: error };
  }
};

export const getBlacklist = async (userId: string): Promise<MongoResponse> => {
  try {
    const blacklist = (await Blacklist.findOne({ 'user.id': userId })) as Blacklist;
    return { success: true, info: 'Got Blacklist', blacklist: blacklist };
  } catch (error: any) {
    errorMessage(error);
    return { success: false, info: 'Error getting Blacklist', error: error };
  }
};

export const getBlacklists = async (): Promise<MongoResponse> => {
  try {
    const blacklists = (await Blacklist.find({})) as Blacklist[];
    return { success: true, info: 'Got Blacklists', blacklists: blacklists };
  } catch (error: any) {
    errorMessage(error);
    return { success: false, info: 'Error getting Blacklists', error: error };
  }
};

export const updateBlacklist = async (blacklist: Blacklist): Promise<MongoResponse> => {
  try {
    blacklist = sanitize(blacklist);
    await Blacklist.updateOne({ 'user.id': blacklist.user.id }, blacklist);
    return { success: true, info: 'Updated Blacklist' };
  } catch (error: any) {
    errorMessage(error);
    return { success: false, info: 'Error updating Blacklist', error: error };
  }
};

export const deleteBlacklist = async (userId: string): Promise<MongoResponse> => {
  try {
    userId = sanitize(userId);
    await Blacklist.findOneAndDelete({ 'user.id': userId });
    return { success: true, info: 'Deleted Blacklist' };
  } catch (error: any) {
    errorMessage(error);
    return { success: false, info: 'Error deleting Blacklist', error: error };
  }
};
