const { errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    try {
      if (oldMessage.guild.id != config.discord.devServer) return;
      const messageUpdatedLoggerEmbed = new EmbedBuilder()
        .setDescription(
          `Message Edited - <#${oldMessage.channel.id}> (${oldMessage.channel.id}) @ [Link](${oldMessage.url})`
        )
        .setColor(config.other.colors.orange.hex)
        .addFields(
          {
            name: 'User',
            value: `${oldMessage.author.globalName} - @${oldMessage.author.username} (${oldMessage.author.id})`,
            inline: true,
          },
          {
            name: 'Old Message',
            value: oldMessage.content,
            inline: false,
          },
          {
            name: 'New Message',
            value: newMessage.content,
            inline: false,
          }
        )
        .setTimestamp()
        .setAuthor({
          name: `@${oldMessage.author.username}`,
          iconURL: `https://cdn.discordapp.com/avatars/${oldMessage.author.id}/${oldMessage.author.avatar}.png?size=4096`,
        })
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = oldMessage.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `Message Edited - [Link](${oldMessage.url})`,
        embeds: [messageUpdatedLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      errorMessage(error);
    }
  },
};
