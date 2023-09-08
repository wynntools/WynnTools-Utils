const { errorMessage, eventMessage } = require('../functions/logger.js');
const { generateID, toFixed } = require('../functions/helper.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      if (member.guild.id != config.discord.devServer) return;
      eventMessage(Events.GuildMemberRemove, member.user.id);
      const memberLeaveLoggerEmbed = new EmbedBuilder()
        .setDescription(`Member Left (${member.user.id})`)
        .setColor(config.other.colors.red)
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
            name: 'Account Joined',
            value: `<t:${toFixed(member.joinedTimestamp / 1000, 0)}:F> (<t:${toFixed(
              member.joinedTimestamp / 1000,
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
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = member.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `User Left - <@${member.user.id}>`,
        embeds: [memberLeaveLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      console.log(error);
    }
  },
};
