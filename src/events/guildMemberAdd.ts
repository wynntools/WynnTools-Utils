import {
  ActionRowBuilder,
  ColorResolvable,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  GuildMember,
  TextChannel,
  Events,
} from 'discord.js';
import { eventMessage, errorMessage } from '../functions/logger';
import { generateID, toFixed } from '../functions/helper';
import { other, discord } from '../../config.json';

export const name = Events.GuildMemberAdd;

export const execute = async (member: GuildMember) => {
  try {
    if (member.guild.id != discord.devServer) return;
    eventMessage(`${Events.GuildMemberAdd} Event triggered by ${member.user.id}`);
    const loggingChannel = member.guild.channels.cache.get(discord.channels.logger) as TextChannel;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const memberJoinLoggerEmbed = new EmbedBuilder()
      .setDescription(
        `Member Joined (${member.user.id}) - <@${member.user.id}>${member.user.bot ? ' (Bot)' : ''}${
          member.user.createdTimestamp > sevenDaysAgo.getTime() ? ' (New Account)' : ''
        }`
      )
      .setColor(other.colors.green.hex as ColorResolvable)
      .addFields(
        {
          name: 'User',
          value: `${
            member.user.globalName
              ? `${member.user.globalName} (${
                  member.user.discriminator == '0'
                    ? `@${member.user.username}`
                    : `${member.user.username}#${member.user.discriminator}`
                })`
              : member.user.discriminator == '0'
                ? `@${member.user.username}`
                : `${member.user.username}#${member.user.discriminator}`
          } - ${member.user.id} <@${member.user.id}>`,
          inline: false,
        },
        {
          name: 'Account Created',
          value: `<t:${toFixed(member.user.createdTimestamp / 1000, 0)}:F> (<t:${toFixed(
            member.user.createdTimestamp / 1000,
            0
          )}:R>)`,
          inline: false,
        },
        {
          name: 'Member Count',
          value: `${member.guild.memberCount}`,
          inline: true,
        }
      )
      .setTimestamp()
      .setAuthor({
        name: `@${member.user.username} Joined`,
        iconURL: `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=4096`,
      })
      .setFooter({
        text: `by @kathund | ${discord.supportInvite} for support`,
        iconURL: other.logo,
      });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Kick')
        .setCustomId(`LOGGING_KICK_USER_${member.user.id}`)
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setLabel('Ban').setCustomId(`LOGGING_BAN_USER_${member.user.id}`).setStyle(ButtonStyle.Danger)
    );
    await loggingChannel.send({
      content: `User Joined - ${member.user.id}${member.user.bot ? ' (Bot)' : ''}${
        member.user.createdTimestamp > sevenDaysAgo.getTime() ? ' (New Account) @here' : ''
      }`,
      embeds: [memberJoinLoggerEmbed],
      components: [row],
    });
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
  }
};
