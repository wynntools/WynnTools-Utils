const { errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.GuildBanRemove,
  async execute(ban) {
    try {
      if (ban.guild.id != config.discord.devServer) return;
      const guildBanAddLoggerEmbed = new EmbedBuilder()
        .setDescription(`Member UnBanned - <@${ban.user.id}> (${ban.user.id})`)
        .setColor(config.other.colors.green)
        .addFields(
          {
            name: 'User',
            value: `${ban.user.globalName} - @${ban.user.username} (${ban.user.id}) - <@${ban.user.id}>\nCreated -<t:${ban.user.createdTimestamp}:F> (<t:${ban.user.createdTimestamp}:R>)\nJoined - <t:${ban.joinedTimestamp}:F> (<t:${ban.joinedTimestamp}:R>)`,
            inline: true,
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
      console.log(error);
    }
  },
};
