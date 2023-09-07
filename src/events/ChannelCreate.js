const { errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.ChannelCreate,
  async execute(channel) {
    try {
      if (channel.guild.id != config.discord.devServer) return;
      const channelCreatedLoggerEmbed = new EmbedBuilder()
        .setDescription(`**${channel.name}** Created <#${channel.id}>`)
        .setColor(config.other.colors.green)
        .addFields(
          {
            name: 'Name',
            value: `${channel.name} (${channel.id})`,
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

      var loggerChannel = channel.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `Channel Created - ${channel.id}`,
        embeds: [channelCreatedLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      console.log(error);
    }
  },
};
