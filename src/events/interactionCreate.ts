import {
  PermissionFlagsBits,
  ActionRowBuilder,
  ColorResolvable,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
  GuildMember,
  TextChannel,
  Interaction,
  Events,
  Guild,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  InteractionType,
} from 'discord.js';
import { cleanMessage, generateID, toFixed } from '../functions/helper';
import { getTicket, saveTicket, updateTicket } from '../functions/mongo';
import { eventMessage, errorMessage } from '../functions/logger';
import { other, discord } from '../../config.json';
import { Message, Ticket } from '../types/main';

export const name = Events.InteractionCreate;

export const execute = async (interaction: Interaction) => {
  try {
    const memberRoles = (
      (await (interaction.guild as Guild).members.fetch(interaction.user.id)) as GuildMember
    ).roles.cache.map((role) => role.id);
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        try {
          let commandString = interaction.commandName;
          if (interaction.options) {
            for (const option of interaction.options.data) {
              commandString += ` ${option.name}:`;
              commandString += `${option.autocomplete ? option.autocomplete : ''}`;
              commandString += `${option.value ? option.value : ''}`;
              if (option.options) {
                for (const subOption of option.options) {
                  commandString += ` ${subOption.name}:`;
                  commandString += subOption.autocomplete ? subOption.autocomplete : '';
                  commandString += subOption.value ? subOption.value : '';
                  if (subOption.options) {
                    for (const subSubOption of subOption.options) {
                      commandString += ` ${subSubOption.name}:`;
                      commandString += subSubOption.autocomplete ? subSubOption.autocomplete : '';
                      commandString += subSubOption.value ? subSubOption.value : '';
                      commandString += subSubOption.user ? subSubOption.user : '';
                      commandString += subSubOption.member ? subSubOption.member : '';
                      commandString += subSubOption.channel ? subSubOption.channel : '';
                      commandString += subSubOption.role ? subSubOption.role : '';
                      commandString += subSubOption.attachment ? subSubOption.attachment : '';
                    }
                    commandString += ` ${subOption.user ? subOption.user : ''}`;
                    commandString += ` ${subOption.member ? subOption.member : ''}`;
                    commandString += ` ${subOption.channel ? subOption.channel : ''}`;
                    commandString += ` ${subOption.role ? subOption.role : ''}`;
                    commandString += ` ${subOption.attachment ? subOption.attachment : ''}`;
                  }
                  commandString += subOption.user ? subOption.user : '';
                  commandString += subOption.member ? subOption.member : '';
                  commandString += subOption.channel ? subOption.channel : '';
                  commandString += subOption.role ? subOption.role : '';
                  commandString += subOption.attachment ? subOption.attachment : '';
                }
              }
              commandString += option.user ? option.user : '';
              commandString += option.member ? option.member : '';
              commandString += option.channel ? option.channel : '';
              commandString += option.role ? option.role : '';
              commandString += option.attachment ? option.attachment : '';
            }
          }
          eventMessage(
            `Interaction Event trigged by ${
              interaction.user.discriminator == '0'
                ? interaction.user.username
                : `${interaction.user.username}#${interaction.user.discriminator}`
            } (${interaction.user.id}) ran command ${commandString} in ${(interaction.guild as Guild).id} in ${
              (interaction.channel as TextChannel).id
            }`
          );
        } catch (error: any) {
          const errorIdLogger = generateID(other.errorIdLength);
          errorMessage(`Error ID: ${errorIdLogger}`);
          errorMessage(error);
        }

        await command.execute(interaction);
      } catch (error: any) {
        const errorIdCheck = generateID(other.errorIdLength);
        errorMessage(`Error ID: ${errorIdCheck}`);
        errorMessage(error);
        const errorEmbed = new EmbedBuilder()
          .setColor(other.colors.red as ColorResolvable)
          .setTitle('An error occurred')
          .setDescription(
            `Use </report-bug:${
              discord.commands['report-bug']
            }> to report it\nError id - ${errorIdCheck}\nError Info - \`${cleanMessage(error)}\``
          )
          .setFooter({
            text: `by @kathund | ${discord.supportInvite} for support`,
            iconURL: other.logo,
          });
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setLabel('Support Discord').setURL(discord.supportInvite).setStyle(ButtonStyle.Link)
        );
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errorEmbed], components: [row], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [errorEmbed], components: [row], ephemeral: true });
        }
      }
    } else if (interaction.isButton()) {
      try {
        eventMessage(
          `Interaction Event trigged by ${
            interaction.user.discriminator == '0'
              ? interaction.user.username
              : `${interaction.user.username}#${interaction.user.discriminator}`
          } (${interaction.user.id}) clicked button ${interaction.customId} in ${(interaction.guild as Guild).id} in ${
            (interaction.channel as TextChannel).id
          } at ${interaction.message.id}`
        );
        if (interaction.customId === 'TICKET_OPEN') {
          await interaction.deferReply({ ephemeral: true });
          const reason = 'No reason provided';
          const uuid = crypto.randomUUID();
          const channel = (await interaction?.guild?.channels.create({
            name: `ticket-${interaction.user.username}`,
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
            .setColor(other.colors.cherryBlossomPink as ColorResolvable)
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
              .setCustomId(`TICKET_CLOSE_${uuid}`)
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setLabel('Close Ticket With Reason')
              .setCustomId(`TICKET_REASON_${uuid}`)
              .setStyle(ButtonStyle.Danger)
          );

          await channel.send({
            content: `<@${interaction.user.id}> | ${uuid}`,
            embeds: [ticketEmbed],
            components: [row],
          });
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
          await interaction.followUp({ embeds: [ticketOpenedEmbed], ephemeral: true });
        } else if (interaction.customId.startsWith('TICKET_CLOSE_')) {
          if (
            !memberRoles.some((role) =>
              ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
            )
          ) {
            throw new Error('You do not have permission to use this command');
          }
          await interaction.reply({ content: 'Closing ticket...', ephemeral: true });

          const reason = 'No reason provided';
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
          const uuid = interaction.customId.split('TICKET_CLOSE_')[1];
          const ticket = (await getTicket(uuid)).ticket as unknown as Ticket;
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
                {
                  name: 'Reason',
                  value: reason,
                  inline: true,
                },
                {
                  name: 'Ticket ID',
                  value: uuid,
                  inline: true,
                },
                {
                  name: 'Transcript',
                  value: `https://tickets.kath.lol/${uuid}`,
                  inline: true,
                },
                {
                  name: 'Ticket Opened',
                  value: `<t:${ticket.ticketInfo.opened.timestamp}:R>`,
                  inline: true,
                },
                {
                  name: 'Ticket Opened By',
                  value: `<@${ticket.ticketInfo.opened.by.id}>`,
                  inline: true,
                },
                {
                  name: 'Ticket Closed',
                  value: `<t:${toFixed(new Date().getTime() / 1000, 0)}:R>`,
                  inline: true,
                },
                {
                  name: 'Ticket Closed By',
                  value: `<@${interaction.user.id}>`,
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
            await loggingChannel.send({ embeds: [closeEmbed] });
            await interaction.client.users.send(ticket.ticketInfo.opened.by.id, { embeds: [closeEmbed] });
            await (interaction.channel as TextChannel).delete();
          }
        } else if (interaction.customId.startsWith('TICKET_REASON_')) {
          const uuid = interaction.customId.split('TICKET_REASON_')[1];
          const modal = new ModalBuilder().setCustomId(`CLOSE_INPUT_${uuid}`).setTitle('Close Reason');

          const reasonInput = new TextInputBuilder()
            .setCustomId('REASON')
            .setLabel('Close Reason')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const reason = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(reasonInput);

          modal.addComponents(reason);

          await interaction.showModal(modal);
        } else if (interaction.customId.startsWith('TICKET_ACCEPT_')) {
          const uuid = interaction.customId.split('TICKET_ACCEPT_')[1];
          const ticket = (await getTicket(uuid)).ticket as unknown as Ticket;
          if (interaction.user.id !== ticket.ticketInfo.opened.by.id) {
            throw new Error('You did not open this ticket');
          }

          const reason = ticket.reason;

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
                {
                  name: 'Reason',
                  value: `${reason}`,
                  inline: true,
                },
                {
                  name: 'Ticket ID',
                  value: uuid,
                  inline: true,
                },
                {
                  name: 'Transcript',
                  value: `https://tickets.kath.lol/${uuid}`,
                  inline: true,
                },
                {
                  name: 'Ticket Opened',
                  value: `<t:${ticket.ticketInfo.opened.timestamp}:R>`,
                  inline: true,
                },
                {
                  name: 'Ticket Opened By',
                  value: `<@${ticket.ticketInfo.opened.by.id}>`,
                  inline: true,
                },
                {
                  name: 'Ticket Closed',
                  value: `<t:${toFixed(new Date().getTime() / 1000, 0)}:R>`,
                  inline: true,
                },
                {
                  name: 'Ticket Closed By',
                  value: `<@${interaction.user.id}>`,
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
            await loggingChannel.send({ embeds: [closeEmbed] });
            await interaction.client.users.send(ticket.ticketInfo.opened.by.id, { embeds: [closeEmbed] });
            await (interaction.channel as TextChannel).delete();
          }
        } else if (interaction.customId.startsWith('TICKET_DENY_')) {
          const uuid = interaction.customId.split('TICKET_DENY_')[1];
          const ticket = (await getTicket(uuid)).ticket as unknown as Ticket;
          if (interaction.user.id !== ticket.ticketInfo.opened.by.id) {
            throw new Error('You did not open this ticket');
          }
          if (!(interaction.channel as TextChannel).name.toLowerCase().includes('ticket-')) {
            throw new Error('This is not a ticket channel');
          }

          const responseEmbed = new EmbedBuilder()
            .setColor(other.colors.red as ColorResolvable)
            .setTitle('Ticket Denied')
            .setDescription(`Ticket Close request has been denied by ${interaction.user.tag} (${interaction.user.id})`)
            .setTimestamp()
            .setFooter({
              text: `by @kathund | ${discord.supportInvite} for support`,
              iconURL: other.logo,
            });
          const update = await updateTicket({
            uuid: uuid,
            ticketInfo: {
              name: (interaction.channel as TextChannel).name,
              channelId: (interaction.channel as TextChannel).id,
              opened: ticket.ticketInfo.opened,
              closed: null,
              users: ticket.ticketInfo.users,
            },
            messages: ticket.messages,
            reason: null,
          });
          if (!update.success) throw new Error('Failed to save ticket');

          await interaction.update({ components: [] });

          await interaction.followUp({ embeds: [responseEmbed], content: `<@&${discord.roles.mod}>` });
        } else if (interaction.customId.startsWith('LOGGING_')) {
          try {
            if (interaction.customId.startsWith('LOGGING_KICK_USER_')) {
              if (
                !memberRoles.some((role) =>
                  ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
                )
              ) {
                throw new Error('NO_ERROR_ID_You do not have permission to use this button');
              }
              const user = (await (interaction.guild as Guild).members.fetch(
                interaction.customId.split('LOGGING_KICK_USER_')[1]
              )) as GuildMember;

              const userRoles = (interaction.member as GuildMember).roles.cache.map((role) => role.id);
              if (
                !userRoles.some((role) =>
                  ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
                )
              ) {
                throw new Error('NO_ERROR_ID_This person is a staff member');
              }

              user.kick(
                `Kicked by ${
                  interaction.user.discriminator == '0'
                    ? interaction.user.username
                    : `${interaction.user.username}#${interaction.user.discriminator}`
                } (${interaction.user.id}) for clicking button @ ${interaction.message.url}`
              );

              const responseEmbed = new EmbedBuilder()
                .setColor(other.colors.red as ColorResolvable)
                .setTitle('User Kicked')
                .setDescription(`Successfully kicked <@${user.id}>`)
                .setTimestamp()
                .setFooter({
                  text: `by @kathund | ${discord.supportInvite} for support`,
                  iconURL: other.logo,
                });

              await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
            } else if (interaction.customId.startsWith('LOGGING_BAN_USER_')) {
              if (
                !memberRoles.some((role) =>
                  ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
                )
              ) {
                throw new Error('NO_ERROR_ID_You do not have permission to use this button');
              }
              const user = (await (interaction.guild as Guild).members.fetch(
                interaction.customId.split('LOGGING_BAN_USER_')[1]
              )) as GuildMember;

              const userRoles = (interaction.member as GuildMember).roles.cache.map((role) => role.id);
              if (
                !userRoles.some((role) =>
                  ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
                )
              ) {
                throw new Error('NO_ERROR_ID_This person is a staff member');
              }

              user.ban({
                reason: `Banned by ${
                  interaction.user.discriminator == '0'
                    ? interaction.user.username
                    : `${interaction.user.username}#${interaction.user.discriminator}`
                } (${interaction.user.id}) for clicking button @ ${interaction.message.url}`,
              });

              const responseEmbed = new EmbedBuilder()
                .setColor(other.colors.red as ColorResolvable)
                .setTitle('User Banned')
                .setDescription(`Successfully banned <@${user.id}>`)
                .setTimestamp()
                .setFooter({
                  text: `by @kathund | ${discord.supportInvite} for support`,
                  iconURL: other.logo,
                });

              await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
            }
          } catch (error: any) {
            if (String(error).includes('NO_ERROR_ID_')) {
              errorMessage(error);
              const errorEmbed = new EmbedBuilder()
                .setColor(other.colors.red as ColorResolvable)
                .setTitle('An error occurred')
                .setDescription(`Error Info - \`${cleanMessage(error)}\``)
                .setFooter({
                  text: `by @kathund | ${discord.supportInvite} for support`,
                  iconURL: other.logo,
                });
              const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setLabel('Support Discord').setURL(discord.supportInvite).setStyle(ButtonStyle.Link)
              );
              await interaction.reply({ embeds: [errorEmbed], components: [row] });
              if (interaction.replied || interaction.deferred) {
                return await interaction.followUp({ embeds: [errorEmbed], components: [row], ephemeral: true });
              } else {
                return await interaction.reply({ embeds: [errorEmbed], components: [row], ephemeral: true });
              }
            } else {
              const errorIdButtons = generateID(other.errorIdLength);
              errorMessage(`Error Id - ${errorIdButtons}`);
              errorMessage(error);
              const errorEmbed = new EmbedBuilder()
                .setColor(other.colors.red as ColorResolvable)
                .setTitle('An error occurred')
                .setDescription(
                  `Use </report-bug:${
                    discord.commands['report-bug']
                  }> to report it\nError id - ${errorIdButtons}\nError Info - \`${cleanMessage(error)}\``
                )
                .setFooter({
                  text: `by @kathund | ${discord.supportInvite} for support`,
                  iconURL: other.logo,
                });
              const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setLabel('Support Discord').setURL(discord.supportInvite).setStyle(ButtonStyle.Link)
              );
              if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], components: [row], ephemeral: true });
              } else {
                await interaction.reply({ embeds: [errorEmbed], components: [row], ephemeral: true });
              }
            }
          }
        }
      } catch (error: any) {
        if (String(error).includes('NO_ERROR_ID_')) {
          errorMessage(error);
          const errorEmbed = new EmbedBuilder()
            .setColor(other.colors.red as ColorResolvable)
            .setTitle('An error occurred')
            .setDescription(`Error Info - \`${cleanMessage(error)}\``)
            .setFooter({
              text: `by @kathund | ${discord.supportInvite} for support`,
              iconURL: other.logo,
            });
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setLabel('Support Discord').setURL(discord.supportInvite).setStyle(ButtonStyle.Link)
          );
          await interaction.reply({ embeds: [errorEmbed], components: [row] });
          if (interaction.replied || interaction.deferred) {
            return await interaction.followUp({ embeds: [errorEmbed], components: [row], ephemeral: true });
          } else {
            return await interaction.reply({ embeds: [errorEmbed], components: [row], ephemeral: true });
          }
        } else {
          const errorIdButtons = generateID(other.errorIdLength);
          errorMessage(`Error Id - ${errorIdButtons}`);
          errorMessage(error);
          const errorEmbed = new EmbedBuilder()
            .setColor(other.colors.red as ColorResolvable)
            .setTitle('An error occurred')
            .setDescription(
              `Use </report-bug:${
                discord.commands['report-bug']
              }> to report it\nError id - ${errorIdButtons}\nError Info - \`${cleanMessage(error)}\``
            )
            .setFooter({
              text: `by @kathund | ${discord.supportInvite} for support`,
              iconURL: other.logo,
            });
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setLabel('Support Discord').setURL(discord.supportInvite).setStyle(ButtonStyle.Link)
          );
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], components: [row], ephemeral: true });
          } else {
            await interaction.reply({ embeds: [errorEmbed], components: [row], ephemeral: true });
          }
        }
      }
    } else if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId.includes('CLOSE_INPUT_')) {
        if (
          !memberRoles.some((role) =>
            ([discord.roles.mod, discord.roles.admin, discord.roles.dev] as string[]).includes(role)
          )
        ) {
          throw new Error('You do not have permission to use this command');
        }

        await interaction.reply({ content: 'Closing ticket...', ephemeral: true });
        const reason = interaction.fields.getTextInputValue('REASON');
        const uuid = interaction.customId.split('CLOSE_INPUT_')[1];
        const ticket = (await getTicket(uuid)).ticket as unknown as Ticket;
        if (ticket.ticketInfo.closed === null) {
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
              {
                name: 'Reason',
                value: reason,
                inline: true,
              },
              {
                name: 'Ticket ID',
                value: uuid,
                inline: true,
              },
              {
                name: 'Transcript',
                value: `https://tickets.kath.lol/${uuid}`,
                inline: true,
              },
              {
                name: 'Ticket Opened',
                value: `<t:${ticket.ticketInfo.opened.timestamp}:R>`,
                inline: true,
              },
              {
                name: 'Ticket Opened By',
                value: `<@${ticket.ticketInfo.opened.by.id}>`,
                inline: true,
              },
              {
                name: 'Ticket Closed',
                value: `<t:${toFixed(new Date().getTime() / 1000, 0)}:R>`,
                inline: true,
              },
              {
                name: 'Ticket Closed By',
                value: `<@${interaction.user.id}>`,
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
          await loggingChannel.send({ embeds: [closeEmbed] });
          await interaction.client.users.send(ticket.ticketInfo.opened.by.id, { embeds: [closeEmbed] });
          await (interaction.channel as TextChannel).delete();
        }
      }
    }
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
  }
};
