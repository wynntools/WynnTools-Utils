const {
  isTicketBlacklisted,
  blacklistCheck,
  cleanMessage,
  generateID,
  writeAt,
  toFixed,
} = require('../functions/helper.js');
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, Events } = require('discord.js');
const { commandMessage, errorMessage } = require('../functions/logger.js');
const config = require('../../config.json');
const fs = require('fs');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
          try {
            if (interaction.user.discriminator == '0') {
              commandMessage(
                `${interaction.user.username} (${interaction.user.id}) ran command ${interaction.commandName}`
              );
            } else {
              commandMessage(
                `${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id}) ran command ${interaction.commandName}`
              );
            }
          } catch (error) {
            var errorIdLogger = generateID(config.other.errorIdLength);
            errorMessage(`Error ID: ${errorIdLogger}`);
            console.log(error);
          }
          if (
            config.other.devMode &&
            !(await interaction.guild.members.fetch(interaction.user)).roles.cache.has(config.discord.roles.dev)
          ) {
            throw new Error('No Perms');
          }
          try {
            if (!config.discord.channels.noCommandTracking.includes(interaction.channel.id)) {
              var userData = JSON.parse(fs.readFileSync('data/userData.json'));
              let data;
              if (userData[interaction.user.id]) {
                data = {
                  commandsRun: userData[interaction.user.id].commandsRun + 1,
                  firstCommand: userData[interaction.user.id].firstCommand,
                  lastUpdated: toFixed(new Date().getTime() / 1000, 0),
                  commands: userData[interaction.user.id].commands,
                };
                const commands = data.commands;
                if (commands[interaction.commandName]) {
                  commands[interaction.commandName]++;
                } else {
                  commands[interaction.commandName] = 1;
                }
                await writeAt('data/userData.json', interaction.user.id, data);
              } else {
                data = {
                  commandsRun: 1,
                  firstCommand: toFixed(new Date().getTime() / 1000, 0),
                  lastUpdated: toFixed(new Date().getTime() / 1000, 0),
                  commands: { [interaction.commandName]: 1 },
                };
                await writeAt('data/userData.json', interaction.user.id, data);
              }
            }
          } catch (error) {
            var errorIdLogUserData = generateID(config.other.errorIdLength);
            errorMessage(`Error ID: ${errorIdLogUserData}`);
            console.log(error);
          }
          try {
            var blacklistTest = await blacklistCheck(interaction.user.id);
            if (blacklistTest) {
              const blacklisted = new EmbedBuilder()
                .setColor(config.other.colors.red)
                .setDescription('You are blacklisted')
                .setFooter({
                  text: `by @kathund | ${config.discord.supportInvite} for support`,
                  iconURL: config.other.logo,
                });
              return await interaction.reply({ embeds: [blacklisted], ephemeral: true });
            }
            await command.execute(interaction);
          } catch (error) {
            var errorIdBlacklistCheck = generateID(config.other.errorIdLength);
            errorMessage(`Error ID: ${errorIdBlacklistCheck}`);
            console.log(error);
            const errorEmbed = new EmbedBuilder()
              .setColor(config.other.colors.red)
              .setTitle('An error occurred')
              .setDescription(
                `Use </report-bug:${
                  config.discord.commands['report-bug']
                }> to report it\nError id - ${errorIdBlacklistCheck}\nError Info - \`${cleanMessage(error)}\``
              )
              .setFooter({
                text: `by @kathund | ${config.discord.supportInvite} for support`,
                iconURL: config.other.logo,
              });
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
        } catch (error) {
          var errorIdCheck = generateID(config.other.errorIdLength);
          errorMessage(`Error ID: ${errorIdCheck}`);
          console.log(error);
          const errorEmbed = new EmbedBuilder()
            .setColor(config.other.colors.red)
            .setTitle('An error occurred')
            .setDescription(
              `Use </report-bug:${
                config.discord.commands['report-bug']
              }> to report it\nError id - ${errorIdCheck}\nError Info - \`${cleanMessage(error)}\``
            )
            .setFooter({
              text: `by @kathund | ${config.discord.supportInvite} for support`,
              iconURL: config.other.logo,
            });
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
      } else if (interaction.isButton()) {
        try {
          console.log(interaction.customId);
          var tickets = JSON.parse(fs.readFileSync('data/tickets.json'));
          if (interaction.customId.includes('TICKET_CLOSE_')) {
            const channelId = interaction.customId.split('_')[2];
            let hasPerms = false;
            if (interaction.channel.id !== channelId) return;
            if (interaction.member.roles.cache.has(config.discord.roles.dev)) hasPerms = true;
            if (interaction.member.roles.cache.has(config.discord.roles.admin)) hasPerms = true;
            if (interaction.member.roles.cache.has(config.discord.roles.mod)) hasPerms = true;
            if (!hasPerms) throw new Error('You do not have permission to use this command');
            const reason = 'No reason provided';
            if (!interaction.channel.name.includes('ticket-')) throw new Error('This is not a ticket channel');
            const ticketId = interaction.customId.split('_')[4];
            const ticket = tickets[ticketId];
            const messages = await interaction.channel.messages.fetch();
            let changed = [];
            messages.forEach((message) => {
              changed.push({
                timestamp: message.createdTimestamp,
                content: message.content,
                user: message.author.id,
                username: message.author.username,
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
            const res = await fetch(`${config.api.transcripts.url}/transcript/save`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', key: config.api.transcripts.key },
              body: JSON.stringify(data),
            });
            if (res.status != 201) throw new Error('Error creating transcript');
            if (!ticket) throw new Error('Ticket not found? Please report this!');
            await interaction.reply({ content: 'Closing ticket...', ephemeral: true });
            const userCloseEmbed = new EmbedBuilder()
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

            const closedLoggingEmbed = new EmbedBuilder()
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
                text: `by @kathund | ${config.discord.supportInvite} for support`,
                iconURL: config.other.logo,
              });
            const loggingChannel = interaction.guild.channels.cache.get(config.discord.channels.ticketLogging);
            if (!loggingChannel) throw new Error('Ticket logging channel not found? Please report this!');
            await loggingChannel.send({ embeds: [closedLoggingEmbed] });
            await interaction.client.users.send(ticket.user, { embeds: [userCloseEmbed] });
            await interaction.channel.delete();
          } else if (interaction.customId.includes('TICKET_BAN_CLOSE_')) {
            console.log('blacklisting');
            const channelId = interaction.customId.split('_')[3];
            const userId = interaction.customId.split('_')[4];
            let hasPerms = false;
            if (interaction.channel.id !== channelId) return;
            if (interaction.member.roles.cache.has(config.discord.roles.dev)) hasPerms = true;
            if (interaction.member.roles.cache.has(config.discord.roles.admin)) hasPerms = true;
            if (interaction.member.roles.cache.has(config.discord.roles.mod)) hasPerms = true;
            if (!hasPerms) throw new Error('You do not have permission to use this command');
            const reason = 'No reason provided';
            if (!interaction.channel.name.includes('ticket-')) throw new Error('This is not a ticket channel');
            console.log('blacklisting');
            const ticketBlacklist = tickets.blacklist;
            if (isTicketBlacklisted(userId, ticketBlacklist)) {
              throw new Error('User already blacklisted from tickets');
            }
            ticketBlacklist.push({
              user: userId,
              reason: reason,
              blacklistedAt: toFixed(new Date().getTime() / 1000, 0),
            });
            await writeAt('data/tickets.json', 'blacklist', ticketBlacklist);

            const userBanEmbed = new EmbedBuilder()
              .setColor(config.other.colors.red)
              .setTitle('Ticket Blacklisted')
              .setDescription(`Successfully blacklisted <@${userId}> from tickets`)
              .setTimestamp()
              .setFooter({
                text: `by @kathund | ${config.discord.supportInvite} for support`,
                iconURL: config.other.logo,
              });

            await interaction.reply({ embeds: [userBanEmbed], ephemeral: true });

            const ticketId = interaction.customId.split('_')[5];
            const ticket = tickets[ticketId];
            if (!ticket) throw new Error('Ticket not found? Please report this!');
            const messages = await interaction.channel.messages.fetch();
            let changed = [];
            messages.forEach((message) => {
              changed.push({
                timestamp: message.createdTimestamp,
                content: message.content,
                user: message.author.id,
                username: message.author.username,
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
            const res = await fetch(`${config.api.transcripts.url}/transcript/save`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', key: config.api.transcripts.key },
              body: JSON.stringify(data),
            });
            if (res.status != 201) throw new Error('Error creating transcript');
            await interaction.followUp({ content: 'Closing ticket...', ephemeral: true });
            const userCloseEmbed = new EmbedBuilder()
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

            const closedLoggingEmbed = new EmbedBuilder()
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
                text: `by @kathund | ${config.discord.supportInvite} for support`,
                iconURL: config.other.logo,
              });
            const loggingChannel = interaction.guild.channels.cache.get(config.discord.channels.ticketLogging);
            if (!loggingChannel) throw new Error('Ticket logging channel not found? Please report this!');
            await loggingChannel.send({ embeds: [closedLoggingEmbed] });
            await interaction.client.users.send(ticket.user, { embeds: [userCloseEmbed] });
            await interaction.channel.delete();
          }
        } catch (error) {
          if (String(error).includes('NO_ERROR_ID_')) {
            console.log(error);
            const errorEmbed = new EmbedBuilder()
              .setColor(config.other.colors.red.hex)
              .setTitle('An error occurred')
              .setDescription(`Error Info - \`${cleanMessage(error)}\``)
              .setFooter({
                text: `by @kathund | ${config.discord.supportInvite} for support`,
                iconURL: config.other.logo,
              });
            const supportDisc = new ButtonBuilder()
              .setLabel('Support Discord')
              .setURL(config.discord.supportInvite)
              .setStyle(ButtonStyle.Link);
            const row = new ActionRowBuilder().addComponents(supportDisc);
            await interaction.reply({ embeds: [errorEmbed], rows: [row] });
            if (interaction.replied || interaction.deferred) {
              return await interaction.followUp({ embeds: [errorEmbed], rows: [row], ephemeral: true });
            } else {
              return await interaction.reply({ embeds: [errorEmbed], rows: [row], ephemeral: true });
            }
          } else {
            var errorIdButtons = generateID(config.other.errorIdLength);
            errorMessage(`Error Id - ${errorIdButtons}`);
            console.log(error);
            const errorEmbed = new EmbedBuilder()
              .setColor(config.other.colors.red.hex)
              .setTitle('An error occurred')
              .setDescription(
                `Use </report-bug:${
                  config.discord.commands['report-bug']
                }> to report it\nError id - ${errorIdButtons}\nError Info - \`${cleanMessage(error)}\``
              )
              .setFooter({
                text: `by @kathund | ${config.discord.supportInvite} for support`,
                iconURL: config.other.logo,
              });
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
        }
      }
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error Id - ${errorId}`);
      console.log(error);
    }
  },
};
