const { generateID, toFixed } = require('../functions/helper.js');
const { errorMessage } = require('../functions/logger.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.ChannelUpdate,
  async execute(oldChannel, newChannel) {
    try {
      if (oldChannel.guild.id != config.discord.devServer) return;
      const channelUpdateLoggerEmbed = new EmbedBuilder()
        .setDescription(`**${newChannel.name}** Updated <#${newChannel.id}>`)
        .setColor(config.other.colors.orange.hex)
        .addFields(
          {
            name: 'Old Channel',
            value: `<t:${toFixed(oldChannel.createdTimestamp / 1000, 0)}:F> (<t:${toFixed(
              oldChannel.createdTimestamp / 1000,
              0
            )}:R>) - ${oldChannel.name} (${oldChannel.id})`,
            inline: false,
          },
          {
            name: 'New Channel',
            value: `<t:${toFixed(newChannel.createdTimestamp / 1000, 0)}:F> (<t:${toFixed(
              newChannel.createdTimestamp / 1000,
              0
            )}:R>) - ${newChannel.name} (${newChannel.id})`,
            inline: false,
          },

          {
            name: 'User',
            value: 'when i work out how to get this i will add it',
            inline: false,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = oldChannel.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `Channel Updated - ${oldChannel.id}`,
        embeds: [channelUpdateLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      errorMessage(error);
    }
  },
};
