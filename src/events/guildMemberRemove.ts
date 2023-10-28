import { ColorResolvable, EmbedBuilder, GuildMember, TextChannel, Events } from 'discord.js';
import { eventMessage, errorMessage } from '../functions/logger';
import { generateID, toFixed } from '../functions/helper';
import { other, discord } from '../../config.json';

export const name = Events.GuildMemberRemove;

export const execute = async (member: GuildMember) => {
  try {
    if (member.guild.id != discord.devServer) return;
    const loggerChannel = member.guild.channels.cache.get(discord.channels.logger) as TextChannel;
    eventMessage(`${Events.GuildMemberRemove} Event triggered by ${member.user.id}`);
    const memberLeaveLoggerEmbed = new EmbedBuilder()
      .setDescription(`Member Left (${member.user.id})${member.user.bot ? ' (Bot)' : ''}`)
      .setColor(other.colors.red.hex as ColorResolvable)
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
          name: 'Roles',
          value: member.roles.cache
            .map((role) => {
              if (role.id == member.guild.id) return;
              `<@&${role.id}>`;
            })
            .join(', '),
          inline: false,
        }
      )
      .setTimestamp()
      .setAuthor({
        name: `@${member.user.username}`,
        iconURL: `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=4096`,
      })
      .setFooter({
        text: `by @kathund | ${discord.supportInvite} for support`,
        iconURL: other.logo,
      });

    await loggerChannel.send({
      content: `User Left - <@${member.user.id}>`,
      embeds: [memberLeaveLoggerEmbed],
    });
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
  }
};
