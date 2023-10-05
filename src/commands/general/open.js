const {
  PermissionFlagsBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { isBlacklisted, cleanMessage, generateID, toFixed, writeAt } = require('../../functions/helper.js');
const { errorMessage } = require('../../functions/logger.js');
const config = require('../../../config.json');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('open')
    .setDescription('Open a support ticket')
    .setDMPermission(false)
    .addStringOption((option) => option.setName('reason').setDescription('The reason for opening a ticket')),

  async execute(interaction) {
    try {
      var tickets = JSON.parse(fs.readFileSync('data/tickets.json'));
      var ticketBlacklist = tickets.blacklist;
      if (isBlacklisted(interaction.user.id, ticketBlacklist)) {
        throw new Error('You are blacklisted from tickets');
      }
      var reason = (await interaction.options.getString('reason')) || 'No reason provided';
      if (tickets[interaction.user.id]) throw new Error('You already have a ticket');
      var channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}-${generateID(tickets.total + 1)}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
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

      await writeAt('data/tickets.json', interaction.user.id, {
        user: interaction.user.id,
        channel: channel.id,
        channelName: `ticket-${interaction.user.username}-${generateID(tickets.total + 1)}`,
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
        .setCustomID(`TICKET_CLOSE_${channel.id}_${interaction.user.id}`)
        .setStyle(ButtonStyle.Danger);

      const ticketClaim = new ButtonBuilder()
        .setLabel('Claim Ticket')
        .setCustomID(`TICKET_CLAIM_${channel.id}_${interaction.user.id}`)
        .setStyle(ButtonStyle.Primary);

      const ticketBan = new ButtonBuilder()
        .setLabel('Ban User')
        .setCustomID(`TICKET_BAN_${channel.id}_${interaction.user.id}`)
        .setStyle(ButtonStyle.Danger);

      const ticketCloseAndBan = new ButtonBuilder()
        .setLabel('Close Ticket and Ban User')
        .setCustomID(`TICKET_CLOSE_BAN_${channel.id}_${interaction.user.id}`)
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(ticketCloseButton, ticketClaim, ticketBan, ticketCloseAndBan);

      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [row] });
      await channel.send({ content: `<@&${config.discord.roles.mod}>` });
      var message = channel.lastMessage();
      if (message.content === `<@&${config.discord.roles.mod}>` && message.author.id === interaction.client.user.id) {
        await message.delete();
      }
      const ticketOpenedEmbed = new EmbedBuilder()
        .setColor(config.other.colors.green)
        .setTitle('Ticket Opened')
        .setDescription(`Your ticket has been opened in <#${channel.id}>`);
      await interaction.reply({ embeds: [ticketOpenedEmbed], ephemeral: true });
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
      await interaction.reply({ embeds: [errorEmbed], rows: [row] });
    }
  },
};
