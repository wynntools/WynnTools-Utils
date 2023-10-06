const {
  PermissionFlagsBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const {
  removeFromArray,
  isBlacklisted,
  cleanMessage,
  generateID,
  toFixed,
  writeAt,
} = require('../../functions/helper.js');
const { errorMessage } = require('../../functions/logger.js');
const config = require('../../../config.json');
const fs = require('fs');
const fetch = (...args) =>
  import('node-fetch')
    .then(({ default: fetch }) => fetch(...args))
    .catch((error) => console.log(error));

module.exports = {
  data: new SlashCommandBuilder()
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
    .addSubcommand((subcommand) => subcommand.setName('claim').setDescription('Claim a ticket'))
    .addSubcommand((subcommand) => subcommand.setName('unclaim').setDescription('Unclaim a ticket'))
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
    ),

  async execute(interaction) {
    try {
      var tickets = JSON.parse(fs.readFileSync('data/tickets.json'));
      var ticketsKeys = Object.keys(tickets);
      var subCommand = await interaction.options.getSubcommand();
      var ticketBlacklist = tickets.blacklist;
      if (isBlacklisted(interaction.user.id, ticketBlacklist)) {
        throw new Error('You are blacklisted from tickets');
      }
      if (subCommand === 'open') {
        await interaction.deferReply({ ephemeral: true });
        var reason = (await interaction.options.getString('reason')) || 'No reason provided';
        if (tickets[interaction.user.id]) throw new Error('You already have a ticket');
        const ticketId = generateID(config.other.ticketIdLength).toLowerCase();
        var channel = await interaction.guild.channels.create({
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
              id: interaction.guild.roles.everyone.id,
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
              id: config.discord.roles.dev,
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
              id: config.discord.roles.admin,
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
              id: config.discord.roles.mod,
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
        });

        await writeAt('data/tickets.json', ticketId, {
          user: interaction.user.id,
          username: interaction.user.username,
          channel: channel.id,
          channelName: `ticket-${interaction.user.username}-${ticketId}`,
          ticketId: ticketId,
          reason: reason,
          claimed: false,
          createdAt: toFixed(new Date().getTime() / 1000, 0),
        });
        await writeAt('data/tickets.json', 'total', tickets.total + 1);

        const ticketEmbed = new EmbedBuilder()
          .setColor(config.other.colors.green)
          .setTitle('Ticket Opened')
          .setDescription(`Ticket opened by ${interaction.user.tag} (${interaction.user.id})`)
          .addFields({
            name: 'Reason',
            value: reason,
            inline: false,
          })
          .setTimestamp()
          .setFooter({
            text: `by @kathund | ${config.discord.supportInvite} for support`,
            iconURL: config.other.logo,
          });

        const ticketCloseButton = new ButtonBuilder()
          .setLabel('Close Ticket')
          .setCustomId(`TICKET_CLOSE_${channel.id}_${interaction.user.id}_${ticketId}`)
          .setStyle(ButtonStyle.Danger);

        const ticketClaim = new ButtonBuilder()
          .setLabel('Claim Ticket')
          .setCustomId(`TICKET_CLAIM_${channel.id}_${interaction.user.id}_${ticketId}`)
          .setStyle(ButtonStyle.Primary);

        const ticketBan = new ButtonBuilder()
          .setLabel('Ban User')
          .setCustomId(`TICKET_BAN_${channel.id}_${interaction.user.id}_${ticketId}`)
          .setStyle(ButtonStyle.Danger);

        const ticketCloseAndBan = new ButtonBuilder()
          .setLabel('Close Ticket and Ban User')
          .setCustomId(`TICKET_CLOSE_BAN_${channel.id}_${interaction.user.id}_${ticketId}`)
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(ticketCloseButton, ticketClaim, ticketBan, ticketCloseAndBan);

        await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [row] });
        await channel.send({ content: `<@&${config.discord.roles.mod}>` });
        var message = channel.lastMessage;
        if (message.content === `<@&${config.discord.roles.mod}>` && message.author.id === interaction.client.user.id) {
          await message.delete();
        }
        const ticketOpenedEmbed = new EmbedBuilder()
          .setColor(config.other.colors.green)
          .setTitle('Ticket Opened')
          .setDescription(`Your ticket has been opened in <#${channel.id}>`);
        await interaction.editReply({ embeds: [ticketOpenedEmbed] });
      } else if (subCommand === 'close') {
        let hasPerms = false;
        if (interaction.member.roles.cache.has(config.discord.roles.dev)) hasPerms = true;
        if (interaction.member.roles.cache.has(config.discord.roles.admin)) hasPerms = true;
        if (interaction.member.roles.cache.has(config.discord.roles.mod)) hasPerms = true;
        if (!hasPerms) throw new Error('You do not have permission to use this command');
        const reason = (await interaction.options.getString('reason')) || 'No reason provided';
        if (!interaction.channel.name.includes('ticket-')) throw new Error('This is not a ticket channel');
        const ticketId = interaction.channel.name.split('-')[2];
        const ticket = tickets[ticketId];
        var messages = await interaction.channel.messages.fetch();
        var changed = [];
        messages.forEach((message) => {
          changed.push({
            timestamp: message.createdTimestamp,
            content: message.content,
            user: message.author.id,
            username: message.author.username,
          });
        });
        changed = changed.sort((a, b) => a.timestamp - b.timestamp);
        var data = {
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
            claimed: ticket.claimed,
          },
          messages: changed,
        };
        var res = await fetch(`${config.api.transcripts.url}/transcript/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', key: config.api.transcripts.key },
          body: JSON.stringify(data),
        });
        if (res.status != 201) throw new Error('Error creating transcript');
        if (!ticket) throw new Error('Ticket not found? Please report this!');
        await interaction.reply({ content: 'Closing ticket...', ephemeral: true });
        var userCloseEmbed = new EmbedBuilder()
          .setColor(config.other.colors.green)
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
              name: 'Ticket Claimed',
              value: ticket.claimed ? `By ${ticket.claimed}` : '-',
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
            text: `by @kathund | ${config.discord.supportInvite} for support`,
            iconURL: config.other.logo,
          });

        var closedLoggingEmbed = new EmbedBuilder()
          .setColor(config.other.colors.green)
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
              name: 'Ticket Claimed',
              value: ticket.claimed ? `By ${ticket.claimed}` : '-',
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
            text: `by @kathund | ${config.discord.supportInvite} for support`,
            iconURL: config.other.logo,
          });
        var loggingChannel = interaction.guild.channels.cache.get(config.discord.channels.ticketLogging);
        if (!loggingChannel) throw new Error('Ticket logging channel not found? Please report this!');
        await loggingChannel.send({ embeds: [closedLoggingEmbed] });
        await interaction.client.users.send(ticket.user, { embeds: [userCloseEmbed] });
        await interaction.channel.delete();
      } else if (subCommand === 'claim') {
        let hasPerms = false;
        if (interaction.member.roles.cache.has(config.discord.roles.dev)) hasPerms = true;
        if (interaction.member.roles.cache.has(config.discord.roles.admin)) hasPerms = true;
        if (interaction.member.roles.cache.has(config.discord.roles.mod)) hasPerms = true;
        if (!hasPerms) throw new Error('You do not have permission to use this command');
        if (!interaction.channel.name.includes('ticket-')) throw new Error('This is not a ticket channel');
        const ticketId = interaction.channel.name.split('-')[2];
        const ticket = ticketsKeys[ticketId];
        if (!ticket) throw new Error('Ticket not found? Please report this!');
        if (ticket.claimed) throw new Error(`Ticket already claimed please get <@${ticket.claimed}> to unclaim it`);
        await writeAt('data/tickets.json', ticket.user, {
          user: ticket.user,
          channel: ticket.channel,
          channelName: ticket.channelName,
          reason: ticket.reason,
          claimed: interaction.user.id,
          createdAt: ticket.createdAt,
        });
        await interaction.channel.edit({
          name: ticket.channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: ticket.user,
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
              id: interaction.client.user.id,
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
              id: interaction.guild.roles.everyone,
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
              id: config.discord.roles.dev,
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
              id: config.discord.roles.admin,
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
              id: config.discord.roles.mod,
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
        await interaction.reply({ content: 'Ticket Claimed', ephemeral: true });
      } else if (subCommand === 'unclaim') {
        let hasPerms = false;
        if (interaction.member.roles.cache.has(config.discord.roles.dev)) hasPerms = true;
        if (interaction.member.roles.cache.has(config.discord.roles.admin)) hasPerms = true;
        if (interaction.member.roles.cache.has(config.discord.roles.mod)) hasPerms = true;
        if (!hasPerms) throw new Error('You do not have permission to use this command');
        if (!interaction.channel.name.includes('ticket-')) throw new Error('This is not a ticket channel');
        const ticketId = interaction.channel.name.split('-')[2];
        const ticket = ticketsKeys[ticketId];
        if (!ticket) throw new Error('Ticket not found? Please report this!');
        if (ticket.claimed === null) throw new Error("This ticket isn't claimed");
        if (ticket.claimed != interaction.user.id) throw new Error("You haven't claimed this ticket");
        await writeAt('data/tickets.json', ticket.user, {
          user: ticket.user,
          channel: ticket.channel,
          channelName: ticket.channelName,
          reason: ticket.reason,
          claimed: null,
          createdAt: ticket.createdAt,
        });
        await interaction.channel.edit({
          name: ticket.channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: ticket.user,
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
              id: interaction.client.user.id,
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
              id: interaction.guild.roles.everyone,
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
              id: config.discord.roles.dev,
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
              id: config.discord.roles.admin,
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
              id: config.discord.roles.mod,
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
        });
        await interaction.reply({ content: 'Ticket Unclaimed', ephemeral: true });
      } else if (subCommand === 'ban') {
        let hasPerms = false;
        if (interaction.member.roles.cache.has(config.discord.roles.dev)) hasPerms = true;
        if (interaction.member.roles.cache.has(config.discord.roles.admin)) hasPerms = true;
        if (interaction.member.roles.cache.has(config.discord.roles.mod)) hasPerms = true;
        if (!hasPerms) throw new Error('You do not have permission to use this command');
        const user = await interaction.options.getUser('user');
        const reason = (await interaction.options.getString('reason')) || 'No reason provided';
        if (!user) throw new Error('User not found?');
        if (isBlacklisted(user.id, ticketBlacklist)) {
          throw new Error('User already blacklisted from tickets');
        }
        ticketBlacklist.push({
          user: user.id,
          reason: reason,
          blacklistedAt: toFixed(new Date().getTime() / 1000, 0),
        });
        await writeAt('data/tickets.json', 'blacklist', ticketBlacklist);

        const userBanEmbed = new EmbedBuilder()
          .setColor(config.other.colors.red)
          .setTitle('Ticket Blacklisted')
          .setDescription(`Successfully blacklisted <@${user.id}> from tickets`)
          .setTimestamp()
          .setFooter({
            text: `by @kathund | ${config.discord.supportInvite} for support`,
            iconURL: config.other.logo,
          });

        await interaction.reply({ embeds: [userBanEmbed] });
      } else if (subCommand === 'unban') {
        let hasPerms = false;
        if (interaction.member.roles.cache.has(config.discord.roles.dev)) hasPerms = true;
        if (interaction.member.roles.cache.has(config.discord.roles.admin)) hasPerms = true;
        if (interaction.member.roles.cache.has(config.discord.roles.mod)) hasPerms = true;
        if (!hasPerms) throw new Error('You do not have permission to use this command');
        const user = await interaction.options.getUser('user');
        if (!user) throw new Error('User not found?');
        if (!isBlacklisted(user.id, ticketBlacklist)) {
          throw new Error("User isn't ticket blacklisted");
        }

        await writeAt('data/tickets.json', 'blacklist', await removeFromArray(ticketBlacklist, '1234567893'));

        const userUnbanEmbed = new EmbedBuilder()
          .setColor(config.other.colors.red)
          .setTitle('Ticket Blacklist')
          .setDescription(`Successfully removed <@${user.id}> from tickets blacklist`)
          .setTimestamp()
          .setFooter({
            text: `by @kathund | ${config.discord.supportInvite} for support`,
            iconURL: config.other.logo,
          });

        await interaction.reply({ embeds: [userUnbanEmbed] });
      }
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error Id - ${errorId}`);
      console.log(error);
      const errorEmbed = new EmbedBuilder()
        .setColor(config.other.colors.red)
        .setTitle('An error occurred')
        .setDescription(
          `Use </report-bug:${
            config.discord.commands['report-bug']
          }> to report it\nError id - ${errorId}\nError Info - \`${cleanMessage(error)}\``
        )
        .setFooter({ text: `by @kathund | ${config.discord.supportInvite} for support`, iconURL: config.other.logo });
      const supportDisc = new ButtonBuilder()
        .setLabel('Support Discord')
        .setURL(config.discord.supportInvite)
        .setStyle(ButtonStyle.Link);
      const row = new ActionRowBuilder().addComponents(supportDisc);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], rows: [row], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], rows: [row], ephemeral: true });
      }
    }
  },
};
