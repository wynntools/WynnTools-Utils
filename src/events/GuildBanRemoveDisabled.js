const { generateID, toFixed } = require('../functions/helper.js');
const { errorMessage } = require('../functions/logger.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.GuildBanRemove,
  async execute(ban) {
    try {
      if (ban.guild.id != config.discord.devServer) return;
      const guildBanAddLoggerEmbed = new EmbedBuilder()
        .setDescription(`Member UnBanned - <@${ban.user.id}> (${ban.user.id})`)
        .setColor(config.other.colors.green.hex)
        .addFields(
          {
            name: 'User',
            value: `${
              ban.user.globalName
                ? `${ban.user.globalName} (${
                    ban.user.discriminator == '0'
                      ? `@${ban.user.username}`
                      : `${ban.user.username}#${ban.user.discriminator}`
                  })`
                : ban.user.discriminator == '0'
                ? `@${ban.user.username}`
                : `${ban.user.username}#${ban.user.discriminator}`
            } - ${ban.user.id} <@${ban.user.id}>\n\n\nAccount Create Date: <t:${toFixed(
              ban.user.createdTimestamp / 1000,
              0
            )}:F> (<t:${toFixed(ban.user.createdTimestamp / 1000, 0)}:R>)\nJoin Date: <t:${toFixed(
              ban.joinedTimestamp / 1000,
              0
            )}:F> (<t:${toFixed(ban.joinedTimestamp / 1000, 0)}:R>)`,
            inline: false,
          },
          {
            name: 'Reason',
            value: ban.reason,
            inline: true,
          },
          {
            name: 'Staff',
            value: ':shrug:',
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = ban.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `Member UnBanned - ${ban.user.id}`,
        embeds: [guildBanAddLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      errorMessage(error);
    }
  },
};
