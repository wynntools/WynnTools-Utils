import {
  ChatInputCommandInteraction,
  OverwriteResolvable,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ColorResolvable,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
  TextChannel,
  GuildMember,
  Snowflake,
  Guild,
  User,
} from 'discord.js';
import { deleteBlacklist, getBlacklist, getTicket, getTicketByUser, saveBlacklist, saveTicket, updateTicket } from '../functions/mongo';
import { cleanMessage, generateID, toFixed } from '../functions/helper';
import { other, discord } from '../../config.json';
import { errorMessage } from '../functions/logger';
import { Message } from '../types/main';

const permissions = [
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.UseExternalEmojis,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.EmbedLinks,
];

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('The command that handles everything to do with tickets')
  .setDMPermission(false)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('open')
      .setDescription('Open a ticket')
      .addStringOption((option) => option.setName('reason').setDescription('The reason for opening a ticket'))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('close')
      .setDescription('Close a ticket')
      .addStringOption((option) => option.setName('reason').setDescription('The reason for closing a ticket'))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add')
      .setDescription('Add a user to a ticket')
      .addUserOption((option) => option.setName('user').setDescription('The user you want to add to this ticket').setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove')
      .setDescription('remove a user to a ticket')
      .addUserOption((option) => option.setName('user').setDescription('The user you want to remove from this ticket').setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('blacklist')
      .setDescription('Blacklist a user from the ticket')
      .addUserOption((option) => option.setName('user').setDescription('The user to ban').setRequired(true))
      .addStringOption((option) => option.setName('reason').setDescription('The reason for banning a user'))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('un-blacklist')
      .setDescription('Un-Blacklist a user from the ticket')
      .addUserOption((option) => option.setName('user').setDescription('The user to unban').setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('rename')
      .setDescription('Rename a ticket')
      .addStringOption((option) => option.setName('name').setDescription('The new name of the ticket').setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('close-request')
      .setDescription('Request to close a ticket')
      .addStringOption((option) => option.setName('reason').setDescription('The reason for closing a ticket'))
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  try {
    const memberRoles = (interaction.member as GuildMember).roles.cache.map((role) => role.id);
    const subCommand = interaction.options.getSubcommand();
    if (subCommand === 'open') {
      await interaction.deferReply({ ephemeral: true });
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const blacklistCheck = await getBlacklist(interaction.user.id);
      if (!blacklistCheck.success) throw new Error('You are blacklisted from opening tickets');
      const userTickets = await getTicketByUser(interaction.user.id);
      if (!userTickets.tickets) throw new Error('Failed to get user tickets');
      if (userTickets.success) {
        const openTickets = userTickets.tickets.filter((ticket) => ticket?.ticketInfo?.closed === null);
        if (openTickets.length >= 2) {
          throw new Error(`You can only have 2 open tickets at a time`);
        }
      }
      const uuid = crypto.randomUUID();
      const channel = (await interaction?.guild?.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: discord.categories.tickets,
        permissionOverwrites: [
          { id: interaction.user.id, allow: permissions },
          { id: (interaction.guild as Guild).roles.everyone.id, deny: permissions },
          { id: discord.roles.dev, allow: permissions },
          { id: discord.roles.admin, allow: permissions },
          { id: discord.roles.mod, allow: permissions },
        ],
      })) as TextChannel;
      const savedTicket = await saveTicket({
        uuid: uuid,
        ticketInfo: {
          name: channel.name,
          channelId: channel.id,
          opened: {
            timestamp: toFixed(channel.createdTimestamp / 1000, 0),
            reason: reason,
            by: {
              username: interaction.user.username,
              id: interaction.user.id,
              displayName: interaction.user.displayName,
              avatar: interaction.user.displayAvatarURL(),
              bot: interaction.user.bot,
            },
          },
          closed: null,
          users: [],
        },
        messages: [],
        reason: null,
      });
      if (!savedTicket.success) throw new Error('Failed to save ticket');
      const ticketEmbed = new EmbedBuilder()
        .setColor(other.colors.red as ColorResolvable)
        .setTitle('Ticket Opened')
        .setDescription(`Ticket opened by ${interaction.user.tag} (${interaction.user.id})\n\nReason: ${reason}`)
        .setTimestamp()
        .setFooter({ text: `by @kathund | ${discord.supportInvite} for support`, iconURL: other.logo });
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setLabel('Close Ticket').setCustomId(`TICKET_CLOSE_${uuid}`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setLabel('Close Ticket With Reason').setCustomId(`TICKET_REASON_${uuid}`).setStyle(ButtonStyle.Danger)
      );
      await channel.send({ content: `<@${interaction.user.id}> | ${uuid}`, embeds: [ticketEmbed], components: [row] });
      await channel.send({ content: `<@&${discord.roles.mod}>` });
      const ticketChannelMessages = await channel.messages.fetch();
      ticketChannelMessages.forEach(async (message) => {
        if (message.author.id !== interaction.client.user.id) return;
        if (message.content === `<@&${discord.roles.mod}>`) await message.delete();
        if (message.content === `<@${interaction.user.id}> | ${uuid}`) await message.pin();
      });
      const ticketOpenedEmbed = new EmbedBuilder()
        .setColor(other.colors.cherryBlossomPink as ColorResolvable)
        .setTitle('Ticket Opened')
        .setDescription(`Your ticket has been opened in <#${channel.id}>`);
      await interaction.editReply({ embeds: [ticketOpenedEmbed] });
    } else if (subCommand === 'close') {
      if (!memberRoles.some((role) => ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role))) {
        throw new Error('You do not have permission to use this command');
      }
      await interaction.reply({ content: 'Closing ticket...', ephemeral: true });
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!(interaction.channel as TextChannel).name.toLowerCase().includes('ticket-')) {
        throw new Error('This is not a ticket channel');
      }
      const messages = await (interaction.channel as TextChannel).messages.fetch();
      let changed = Array<Message>();
      messages.forEach((message) => {
        changed.push({
          author: {
            username: message.author.username,
            id: message.author.id,
            displayName: message.author.displayName,
            avatar: message.author.avatarURL(),
            bot: message.author.bot,
          },
          content: message.content,
          timestamp: message.createdTimestamp,
        });
      });
      changed = changed.sort((a, b) => a.timestamp - b.timestamp);
      const uuid = changed[0].content.split(' | ')[1];
      const ticket = (await getTicket(uuid)).ticket;
      if (!ticket) throw new Error('Failed to get ticket');
      if (ticket.ticketInfo.closed === null) {
        const update = await updateTicket({
          uuid: uuid,
          ticketInfo: {
            name: (interaction.channel as TextChannel).name,
            channelId: (interaction.channel as TextChannel).id,
            opened: ticket.ticketInfo.opened,
            closed: {
              timestamp: toFixed(new Date().getTime() / 1000, 0),
              reason: reason,
              by: {
                username: interaction.user.username,
                id: interaction.user.id,
                displayName: interaction.user.displayName,
                avatar: interaction.user.avatarURL(),
                bot: interaction.user.bot,
              },
            },
            users: ticket.ticketInfo.users,
          },
          messages: changed,
          reason: null,
        });
        if (!update.success) throw new Error('Failed to save ticket');
        const closeEmbed = new EmbedBuilder()
          .setColor(other.colors.red as ColorResolvable)
          .setTitle('Ticket Closed')
          .addFields(
            { name: 'Reason', value: reason, inline: true },
            { name: 'Name', value: (interaction.channel as TextChannel).name, inline: true },
            { name: 'Ticket ID', value: uuid, inline: true },
            { name: 'Transcript', value: `https://tickets.kath.lol/${uuid}`, inline: true },
            { name: 'Ticket Opened', value: `<t:${ticket.ticketInfo.opened.timestamp}:R>`, inline: true },
            { name: 'Ticket Opened By', value: `<@${ticket.ticketInfo.opened.by.id}>`, inline: true },
            { name: 'Ticket Closed', value: `<t:${toFixed(new Date().getTime() / 1000, 0)}:R>`, inline: true },
            { name: 'Ticket Closed By', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: `by @kathund | ${discord.supportInvite} for support`, iconURL: other.logo });
        const loggingChannel = (interaction.guild as Guild).channels.cache.get(discord.channels.ticketLogging) as TextChannel;
        if (!loggingChannel) throw new Error('Ticket logging channel not found? Please report this!');
        await loggingChannel.send({ embeds: [closeEmbed] });
        await interaction.client.users.send(ticket.ticketInfo.opened.by.id, { embeds: [closeEmbed] });
        await (interaction.channel as TextChannel).delete();
      }
    } else if (subCommand === 'add') {
      if (!memberRoles.some((role) => ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role))) {
        throw new Error('You do not have permission to use this command');
      }
      const addUser = interaction.options.getUser('user') as User;
      if (!addUser) throw new Error('User not found?');
      if (!(interaction.channel as TextChannel).name.includes('ticket-')) {
        throw new Error('This is not a ticket channel');
      }
      const messages = (await (interaction.channel as TextChannel).messages.fetch()).sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp
      );
      const uuid = messages.first()?.content.split(' | ')[1] as string;
      const ticket = (await getTicket(uuid)).ticket;
      if (!ticket) throw new Error('Failed to get ticket');
      if (ticket.ticketInfo.users.some((user) => user.user.id === addUser.id)) {
        throw new Error('User is already in this ticket');
      }
      const updatedTicket = await updateTicket({
        uuid: uuid,
        ticketInfo: {
          name: ticket.ticketInfo.name,
          channelId: ticket.ticketInfo.channelId,
          opened: ticket.ticketInfo.opened,
          closed: ticket.ticketInfo.closed,
          users: [
            ...ticket.ticketInfo.users,
            {
              user: {
                username: addUser.username,
                id: addUser.id,
                displayName: addUser.displayName,
                avatar: addUser.avatarURL(),
                bot: addUser.bot,
              },
              added: {
                timestamp: toFixed(new Date().getTime() / 1000, 0),
                by: {
                  username: interaction.user.username,
                  id: interaction.user.id,
                  displayName: interaction.user.displayName,
                  avatar: interaction.user.avatarURL(),
                  bot: interaction.user.bot,
                },
              },
              removed: null,
            },
          ],
        },
        messages: ticket.messages,
        reason: null,
      });
      if (!updatedTicket.success) throw new Error('Failed to save ticket');

      const permissionOverwrites: OverwriteResolvable[] = [
        { id: ticket.ticketInfo.opened.by.id, allow: permissions },
        { id: addUser.id, allow: permissions },
        { id: discord.roles.dev, allow: permissions },
        { id: discord.roles.admin, allow: permissions },
        { id: discord.roles.mod, allow: permissions },
        { id: (interaction.guild as Guild).roles.everyone.id, deny: permissions },
      ];
      for (const userEntry of ticket.ticketInfo.users) {
        if (userEntry.removed === null) {
          permissionOverwrites.push({ id: userEntry.user.id as Snowflake, allow: permissions });
        } else {
          permissionOverwrites.push({ id: userEntry.user.id as Snowflake, deny: permissions });
        }
      }
      await (interaction.channel as TextChannel).edit({ name: ticket.ticketInfo.name, type: ChannelType.GuildText, permissionOverwrites });
      const responseEmbed = new EmbedBuilder()
        .setColor(other.colors.cherryBlossomPink as ColorResolvable)
        .setTitle('User Added')
        .setDescription(`Successfully added <@${addUser.id}> to this ticket`);
      await interaction.reply({ embeds: [responseEmbed] });
    } else if (subCommand === 'remove') {
      if (!memberRoles.some((role) => ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role))) {
        throw new Error('You do not have permission to use this command');
      }
      const removeUser = interaction.options.getUser('user');
      if (!removeUser) throw new Error('User not found?');
      if (!(interaction.channel as TextChannel).name.includes('ticket-')) {
        throw new Error('This is not a ticket channel');
      }
      const messages = (await (interaction.channel as TextChannel).messages.fetch()).sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp
      );
      const uuid = messages.first()?.content.split(' | ')[1] as string;
      const ticket = (await getTicket(uuid)).ticket;
      if (!ticket) throw new Error('Failed to get ticket');
      const userIndex = ticket.ticketInfo.users.findIndex((userEntry) => userEntry.user.id === removeUser.id);
      if (userIndex !== -1) {
        ticket.ticketInfo.users[userIndex].removed = {
          timestamp: toFixed(new Date().getTime() / 1000, 0),
          by: {
            username: interaction.user.username,
            id: interaction.user.id,
            displayName: interaction.user.displayName,
            avatar: interaction.user.avatarURL(),
            bot: interaction.user.bot,
          },
        };
        const updatedTicket = await updateTicket({ uuid: uuid, ticketInfo: ticket.ticketInfo, messages: ticket.messages, reason: null });
        if (!updatedTicket.success) throw new Error('Failed to save ticket');
      } else {
        throw new Error('User not found in the ticket');
      }
      const permissionOverwrites: OverwriteResolvable[] = [
        { id: ticket.ticketInfo.opened.by.id, allow: permissions },
        { id: discord.roles.dev, allow: permissions },
        { id: discord.roles.admin, allow: permissions },
        { id: discord.roles.mod, allow: permissions },
        { id: (interaction.guild as Guild).roles.everyone.id, deny: permissions },
      ];
      for (const userEntry of ticket.ticketInfo.users) {
        if (userEntry.removed === null) {
          permissionOverwrites.push({ id: userEntry.user.id as Snowflake, allow: permissions });
        } else {
          permissionOverwrites.push({ id: userEntry.user.id as Snowflake, deny: permissions });
        }
      }
      await (interaction.channel as TextChannel).edit({ name: ticket.ticketInfo.name, type: ChannelType.GuildText, permissionOverwrites });
      const responseEmbed = new EmbedBuilder()
        .setColor(other.colors.red as ColorResolvable)
        .setTitle('User Removed')
        .setDescription(`Successfully removed <@${removeUser.id}> to this ticket`);
      await interaction.reply({ embeds: [responseEmbed] });
    } else if (subCommand === 'blacklist') {
      if (!memberRoles.some((role) => ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role))) {
        throw new Error('You do not have permission to use this command');
      }
      const blacklistReason = interaction.options.getString('reason') || 'No reason provided';
      const blacklistUser = interaction.options.getUser('user');
      if (!blacklistUser) throw new Error('User not found?');
      const blacklist = await saveBlacklist({
        user: {
          username: blacklistUser.username,
          id: blacklistUser.id,
          displayName: blacklistUser.displayName,
          avatar: blacklistUser.avatarURL(),
          bot: blacklistUser.bot,
        },
        timestamp: toFixed(new Date().getTime() / 1000, 0),
        by: {
          username: interaction.user.username,
          id: interaction.user.id,
          displayName: interaction.user.displayName,
          avatar: interaction.user.avatarURL(),
          bot: interaction.user.bot,
        },
        reason: blacklistReason,
      });
      if (!blacklist.success) throw new Error('Failed to save blacklist');
      const blacklistEmbed = new EmbedBuilder()
        .setColor(other.colors.red as ColorResolvable)
        .setTitle('User Blacklisted')
        .setDescription(`Successfully blacklisted <@${blacklistUser.id}> from tickets`);
      await interaction.reply({ embeds: [blacklistEmbed] });
    } else if (subCommand === 'un-blacklist') {
      if (!memberRoles.some((role) => ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role))) {
        throw new Error('You do not have permission to use this command');
      }
      const blacklistUser = interaction.options.getUser('user');
      if (!blacklistUser) throw new Error('User not found?');
      const blacklistCheck = await getBlacklist(blacklistUser.id);
      if (!blacklistCheck.success) throw new Error('User is not blacklisted');
      const blacklist = await deleteBlacklist(blacklistUser.id);
      if (!blacklist.success) throw new Error('Failed to delete blacklist');
      const blacklistEmbed = new EmbedBuilder()
        .setColor(other.colors.red as ColorResolvable)
        .setTitle('User Un-Blacklisted')
        .setDescription(`Successfully un-blacklisted <@${blacklistUser.id}> from tickets`);
      await interaction.reply({ embeds: [blacklistEmbed] });
    } else if (subCommand === 'rename') {
      if (!memberRoles.some((role) => ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role))) {
        throw new Error('You do not have permission to use this command');
      }
      const ticketName = `ticket-${interaction.options.getString('name')}`;
      if (!(interaction.channel as TextChannel).name.includes('ticket-')) {
        throw new Error('This is not a ticket channel');
      }
      const messages = (await (interaction.channel as TextChannel).messages.fetch()).sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp
      );
      const uuid = messages.first()?.content.split(' | ')[1] as string;
      const ticket = (await getTicket(uuid)).ticket;
      if (!ticket) throw new Error('Failed to get ticket');
      const updatedTicket = await updateTicket({
        uuid: uuid,
        ticketInfo: {
          name: ticketName,
          channelId: ticket.ticketInfo.channelId,
          opened: ticket.ticketInfo.opened,
          closed: ticket.ticketInfo.closed,
          users: ticket.ticketInfo.users,
        },
        messages: ticket.messages,
        reason: null,
      });
      if (!updatedTicket.success) throw new Error('Failed to save ticket');
      const permissionOverwrites: OverwriteResolvable[] = [
        { id: ticket.ticketInfo.opened.by.id, allow: permissions },
        { id: discord.roles.dev, allow: permissions },
        { id: discord.roles.admin, allow: permissions },
        { id: discord.roles.mod, allow: permissions },
        { id: (interaction.guild as Guild).roles.everyone.id, deny: permissions },
      ];
      for (const userEntry of ticket.ticketInfo.users) {
        if (userEntry.removed === null) {
          permissionOverwrites.push({ id: userEntry.user.id as Snowflake, allow: permissions });
        } else {
          permissionOverwrites.push({ id: userEntry.user.id as Snowflake, deny: permissions });
        }
      }
      const oldName = (interaction.channel as TextChannel).name;
      await (interaction.channel as TextChannel).edit({ name: ticketName, type: ChannelType.GuildText, permissionOverwrites });
      const responseEmbed = new EmbedBuilder()
        .setColor(other.colors.cherryBlossomPink as ColorResolvable)
        .setTitle('Ticket Rename')
        .setDescription(`Successfully renamed the ticket from ${oldName} to ${(interaction.channel as TextChannel).name}`);
      await interaction.reply({ embeds: [responseEmbed] });
    } else if (subCommand === 'close-request') {
      if (!memberRoles.some((role) => ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role))) {
        throw new Error('You do not have permission to use this command');
      }
      if (!(interaction.channel as TextChannel).name.includes('ticket-')) {
        throw new Error('This is not a ticket channel');
      }
      const messages = (await (interaction.channel as TextChannel).messages.fetch()).sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp
      );
      const uuid = messages.first()?.content.split(' | ')[1] as string;
      const ticket = (await getTicket(uuid)).ticket;
      if (!ticket) throw new Error('Failed to get ticket');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (ticket.ticketInfo.closed !== null) {
        throw new Error('This ticket is already closed');
      }
      const updatedTicket = await updateTicket({ uuid: uuid, ticketInfo: ticket.ticketInfo, messages: ticket.messages, reason: reason });
      if (!updatedTicket.success) throw new Error('Failed to save ticket');
      const closeRequestEmbed = new EmbedBuilder()
        .setColor(other.colors.red as ColorResolvable)
        .setTitle('Ticket Close Request')
        .setDescription(`<@${interaction.user.id}> has requested to close this ticket\n\nReason: ${reason}`)
        .setTimestamp()
        .setFooter({ text: `by @kathund | ${discord.supportInvite} for support`, iconURL: other.logo });
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setLabel('Accept Ticket Close').setCustomId(`TICKET_ACCEPT_${uuid}`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setLabel('Deny Ticket Close').setCustomId(`TICKET_DENY_${uuid}`).setStyle(ButtonStyle.Danger)
      );
      await (interaction.channel as TextChannel).send({
        content: `<@${ticket.ticketInfo.opened.by.id}>`,
        embeds: [closeRequestEmbed],
        components: [row],
      });
      await interaction.reply({ content: 'Close request sent', ephemeral: true });
    }
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
    const errorEmbed = new EmbedBuilder()
      .setColor(other.colors.red as ColorResolvable)
      .setTitle('An error occurred')
      .setDescription(
        `Use </report-bug:${discord.commands['report-bug']}> to report it\nError id - ${errorId}\nError Info - \`${cleanMessage(error)}\``
      )
      .setFooter({ text: `by @kathund | ${discord.supportInvite} for support`, iconURL: other.logo });
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel('Support Discord').setURL(discord.supportInvite).setStyle(ButtonStyle.Link)
    );
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], components: [row], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], components: [row], ephemeral: true });
    }
  }
};
