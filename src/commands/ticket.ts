import {
  ChatInputCommandInteraction,
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
  Guild,
} from 'discord.js';
import { isTicketBlacklisted, removeFromArray, cleanMessage, generateID, toFixed, writeAt } from '../functions/helper';
import { other, discord, api } from '../../config.json';
import { errorMessage } from '../functions/logger';
import { arrayMessages } from '../types/main';
import { readFileSync } from 'fs';
import axios from 'axios';

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
      .setName('ban')
      .setDescription('Ban a user from the ticket')
      .addUserOption((option) => option.setName('user').setDescription('The user to ban').setRequired(true))
      .addStringOption((option) => option.setName('reason').setDescription('The reason for banning a user'))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('unban')
      .setDescription('Unban a user from the ticket')
      .addUserOption((option) => option.setName('user').setDescription('The user to unban').setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add')
      .setDescription('Add a user to a ticket')
      .addUserOption((option) =>
        option.setName('user').setDescription('The user you want to add to this ticket').setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove')
      .setDescription('remove a user to a ticket')
      .addUserOption((option) =>
        option.setName('user').setDescription('The user you want to remove from this ticket').setRequired(true)
      )
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  try {
    const memberRoles = (interaction.member as GuildMember).roles.cache.map((role) => role.id);
    const tickets = JSON.parse(readFileSync('data/tickets.json') as any);
    const subCommand = interaction.options.getSubcommand();
    const ticketBlacklist = tickets.blacklist;
    if (isTicketBlacklisted(interaction.user.id, ticketBlacklist)) {
      throw new Error('You are blacklisted from tickets');
    }
    if (subCommand === 'open') {
      await interaction.deferReply({ ephemeral: true });
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (tickets[interaction.user.id]) throw new Error('You already have a ticket');
      const ticketId = (generateID(other.ticketIdLength) as string).toLowerCase();
      const channel = (await interaction?.guild?.channels.create({
        name: `ticket-${interaction.user.username}-${ticketId}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: (interaction.guild as Guild).roles.everyone.id,
            deny: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: discord.roles.dev,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: discord.roles.admin,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: discord.roles.mod,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
        ],
      })) as TextChannel;

      await writeAt('data/tickets.json', ticketId, {
        user: interaction.user.id,
        username: interaction.user.username,
        channel: channel.id,
        channelName: `ticket-${interaction.user.username}-${ticketId}`,
        ticketId: ticketId,
        reason: reason,
        createdAt: toFixed(new Date().getTime() / 1000, 0),
      });
      await writeAt('data/tickets.json', 'total', tickets.total + 1);

      const ticketEmbed = new EmbedBuilder()
        .setColor(other.colors.red.hex as ColorResolvable)
        .setTitle('Ticket Opened')
        .setDescription(`Ticket opened by ${interaction.user.tag} (${interaction.user.id})\n\nReason: ${reason}`)
        .setTimestamp()
        .setFooter({
          text: `by @kathund | ${discord.supportInvite} for support`,
          iconURL: other.logo,
        });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Close Ticket')
          .setCustomId(`TICKET_CLOSE_${channel.id}_${interaction.user.id}_${ticketId}`)
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setLabel('Close Ticket and Ban User')
          .setCustomId(`TICKET_BAN_CLOSE_${channel.id}_${interaction.user.id}_${ticketId}`)
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [row] });
      await channel.send({ content: `<@&${discord.roles.mod}>` });
      const ticketChannelMessages = await channel.messages.fetch();
      ticketChannelMessages.forEach(async (message) => {
        if (message.author.id !== interaction.client.user.id) return;
        if (message.content === `<@&${discord.roles.mod}>`) await message.delete();
        if (message.content === `<@${interaction.user.id}>`) await message.pin();
      });
      const ticketOpenedEmbed = new EmbedBuilder()
        .setColor(other.colors.red.hex as ColorResolvable)
        .setTitle('Ticket Opened')
        .setDescription(`Your ticket has been opened in <#${channel.id}>`);
      await interaction.editReply({ embeds: [ticketOpenedEmbed] });
    } else if (subCommand === 'close') {
      if (
        !memberRoles.some((role) =>
          ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
        )
      ) {
        throw new Error('You do not have permission to use this command');
      }
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!(interaction.channel as TextChannel).name.includes('ticket-')) {
        throw new Error('This is not a ticket channel');
      }
      const ticketId = (interaction.channel as TextChannel).name.split('-')[2];
      const ticket = tickets[ticketId];
      const messages = await (interaction.channel as TextChannel).messages.fetch();
      let changed = Array<arrayMessages>();
      messages.forEach((message) => {
        changed.push({
          timestamp: message.createdTimestamp,
          content: message.content,
          user: message.author.id,
          username: message.author.username,
          avatar: message.author.avatar || null,
          bot: message.author.bot,
          displayName: message.author.displayName,
        });
      });
      changed = changed.sort((a, b) => a.timestamp - b.timestamp);
      const data = {
        ticket: {
          id: ticketId,
          opened: {
            timestamp: ticket.createdAt,
            reason: ticket.reason,
            by: {
              id: ticket.user,
              username: ticket.username,
            },
          },
          closed: {
            by: {
              id: interaction.user.id,
              username: interaction.user.username,
            },
            reason: reason,
            timestamp: toFixed(new Date().getTime() / 1000, 0),
          },
        },
        messages: changed,
      };
      const res = await axios.post(`${api.transcripts.url}/transcript/save`, data, {
        headers: { 'Content-Type': 'application/json', key: api.transcripts.key },
      });
      if (res.status != 201) throw new Error('Error creating transcript');
      if (!ticket) throw new Error('Ticket not found? Please report this!');
      await interaction.reply({ content: 'Closing ticket...', ephemeral: true });
      const userCloseEmbed = new EmbedBuilder()
        .setColor(other.colors.red.hex as ColorResolvable)
        .setTitle('Ticket Closed')
        .setDescription(`Your ticket has been closed by <@${interaction.user.id}>`)
        .addFields(
          {
            name: 'Reason',
            value: reason,
            inline: false,
          },
          {
            name: 'Ticket ID',
            value: ticketId,
            inline: true,
          },
          {
            name: 'Ticket Opened',
            value: `<t:${ticket.createdAt}:R>`,
            inline: true,
          },
          {
            name: 'Ticket Opened By',
            value: `<@${ticket.user}>`,
            inline: true,
          },
          {
            name: 'Transcript',
            value: `https://tickets.kath.lol/${ticketId}.txt`,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `by @kathund | ${discord.supportInvite} for support`,
          iconURL: other.logo,
        });

      const closedLoggingEmbed = new EmbedBuilder()
        .setColor(other.colors.red.hex as ColorResolvable)
        .setTitle('Ticket Closed')
        .setDescription(`Ticket closed by <@${interaction.user.id}>`)
        .addFields(
          {
            name: 'Reason',
            value: reason,
            inline: false,
          },
          {
            name: 'Ticket ID',
            value: ticketId,
            inline: true,
          },
          {
            name: 'Ticket Opened',
            value: `<t:${ticket.createdAt}:R>`,
            inline: true,
          },
          {
            name: 'Ticket Opened By',
            value: `${ticketId}`,
            inline: true,
          },
          {
            name: 'Transcript',
            value: `https://tickets.kath.lol/${ticketId}.txt`,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `by @kathund | ${discord.supportInvite} for support`,
          iconURL: other.logo,
        });
      const loggingChannel = (interaction.guild as Guild).channels.cache.get(
        discord.channels.ticketLogging
      ) as TextChannel;
      if (!loggingChannel) throw new Error('Ticket logging channel not found? Please report this!');
      await loggingChannel.send({ embeds: [closedLoggingEmbed] });
      await interaction.client.users.send(ticket.user, { embeds: [userCloseEmbed] });
      await (interaction.channel as TextChannel).delete();
    } else if (subCommand === 'ban') {
      if (
        !memberRoles.some((role) =>
          ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
        )
      ) {
        throw new Error('You do not have permission to use this command');
      }
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!user) throw new Error('User not found?');
      if (isTicketBlacklisted(user.id, ticketBlacklist)) {
        throw new Error('User already blacklisted from tickets');
      }
      ticketBlacklist.push({
        user: user.id,
        reason: reason,
        blacklistedAt: toFixed(new Date().getTime() / 1000, 0),
      });
      await writeAt('data/tickets.json', 'blacklist', ticketBlacklist);

      const userBanEmbed = new EmbedBuilder()
        .setColor(other.colors.red.hex as ColorResolvable)
        .setTitle('Ticket Blacklisted')
        .setDescription(`Successfully blacklisted <@${user.id}> from tickets`)
        .setTimestamp()
        .setFooter({
          text: `by @kathund | ${discord.supportInvite} for support`,
          iconURL: other.logo,
        });

      await interaction.reply({ embeds: [userBanEmbed] });
    } else if (subCommand === 'unban') {
      if (
        !memberRoles.some((role) =>
          ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
        )
      ) {
        throw new Error('You do not have permission to use this command');
      }
      const user = interaction.options.getUser('user');
      if (!user) throw new Error('User not found?');
      if (!isTicketBlacklisted(user.id, ticketBlacklist)) {
        throw new Error("User isn't ticket blacklisted");
      }
      await writeAt('data/tickets.json', 'blacklist', await removeFromArray(ticketBlacklist, user.id));
      const userUnbanEmbed = new EmbedBuilder()
        .setColor(other.colors.red.hex as ColorResolvable)
        .setTitle('Ticket Blacklist')
        .setDescription(`Successfully removed <@${user.id}> from tickets blacklist`)
        .setTimestamp()
        .setFooter({
          text: `by @kathund | ${discord.supportInvite} for support`,
          iconURL: other.logo,
        });
      await interaction.reply({ embeds: [userUnbanEmbed] });
    } else if (subCommand === 'add') {
      if (
        !memberRoles.some((role) =>
          ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
        )
      ) {
        throw new Error('You do not have permission to use this command');
      }
      const user = interaction.options.getUser('user');
      if (!user) throw new Error('User not found?');
      if (!(interaction.channel as TextChannel).name.includes('ticket-')) {
        throw new Error('This is not a ticket channel');
      }
      const ticketId = (interaction.channel as TextChannel).name.split('-')[2];
      const ticket = tickets[ticketId];
      const ticketUser = (await (interaction.guild as Guild).members.fetch(ticket.user)) as GuildMember;
      await (interaction.channel as TextChannel).edit({
        name: ticket.channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: ticketUser.id,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: discord.roles.dev,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: discord.roles.admin,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: discord.roles.mod,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: (interaction.guild as Guild).roles.everyone.id,
            deny: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
        ],
      });
      const responseEmbed = new EmbedBuilder()
        .setColor(other.colors.red.hex as ColorResolvable)
        .setTitle('User Added')
        .setDescription(`Successfully added <@${user.id}> to this ticket`);
      await interaction.reply({ embeds: [responseEmbed] });
    } else if (subCommand === 'remove') {
      if (
        !memberRoles.some((role) =>
          ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
        )
      ) {
        throw new Error('You do not have permission to use this command');
      }
      const user = interaction.options.getUser('user');
      if (!user) throw new Error('User not found?');
      if (!(interaction.channel as TextChannel).name.includes('ticket-')) {
        throw new Error('This is not a ticket channel');
      }
      const ticketId = (interaction.channel as TextChannel).name.split('-')[2];
      const ticket = tickets[ticketId];
      const ticketUser = await (interaction.guild as Guild).members.fetch(ticket.user);
      await (interaction.channel as TextChannel).edit({
        name: ticket.channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: ticketUser.id,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: discord.roles.dev,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: discord.roles.admin,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: discord.roles.mod,
            allow: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: user.id,
            deny: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: (interaction.guild as Guild).roles.everyone.id,
            deny: [
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.UseExternalEmojis,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
        ],
      });
      const responseEmbed = new EmbedBuilder()
        .setColor(other.colors.red.hex as ColorResolvable)
        .setTitle('User Removed')
        .setDescription(`Successfully removed <@${user.id}> to this ticket`);
      await interaction.reply({ embeds: [responseEmbed] });
    }
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
    const errorEmbed = new EmbedBuilder()
      .setColor(other.colors.red.hex as ColorResolvable)
      .setTitle('An error occurred')
      .setDescription(
        `Use </report-bug:${
          discord.commands['report-bug']
        }> to report it\nError id - ${errorId}\nError Info - \`${cleanMessage(error)}\``
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
