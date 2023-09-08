const { generateID, toFixed, convertChannelType } = require('../functions/helper.js');
const { errorMessage } = require('../functions/logger.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel) {
    try {
      if (channel.guild.id != config.discord.devServer) return;
      const channelDeletedLoggerEmbed = new EmbedBuilder()
        .setDescription(`**${channel.name}** Deleted <#${channel.id}>`)
        .setColor(config.other.colors.red)
        .addFields(
          {
            name: 'Name',
            value: `${channel.name} (${channel.id})`,
            inline: false,
          },
          {
            name: 'Creation',
            value: `<t:${toFixed(channel.createdTimestamp / 1000, 0)}:F> (<t:${toFixed(
              channel.createdTimestamp / 1000,
              0
            )}:R>)`,
            inline: false,
          },
          {
            name: 'Type',
            value: `${convertChannelType(channel.type)}`,
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
        embeds: [channelDeletedLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      console.log(error);
    }
  },
};
