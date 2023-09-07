const { errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.ChannelUpdate,
  async execute(oldChannel, newChannel) {
    try {
      if (oldChannel.guild.id != config.discord.devServer) return;
      const channelUpdateLoggerEmbed = new EmbedBuilder()
        .setDescription(`Channel Updated - ${oldChannel.name} (${oldChannel.id}) - <#${oldChannel.id}>`)
        .setColor(config.other.colors.orange)
        .addFields(
          {
            name: 'User',
            value: 'when i work out how to get this i will add it',
            inline: true,
          },
          {
            name: 'Old Channel',
            value: `<t:${oldChannel.createdTimestamp}:F> (<t:${oldChannel.createdTimestamp}:R>) - ${oldChannel.name} (${oldChannel.id})`,
            inline: true,
          },
          {
            name: 'New Channel',
            value: `<t:${newChannel.createdTimestamp}:F> (<t:${newChannel.createdTimestamp}:R>) - ${newChannel.name} (${newChannel.id})`,
            inline: true,
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
      console.log(error);
    }
  },
};
