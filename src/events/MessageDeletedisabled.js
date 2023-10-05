const { errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    console.log(message);
    try {
      if (message.guild.id != config.discord.devServer) return;
      const messageDeleteLoggerEmbed = new EmbedBuilder()
        .setDescription(`Message Deleted - <#${message.channel.id}> (${message.channel.id})`)
        .setColor(config.other.colors.red)
        .addFields(
          {
            name: 'User',
            value: `${message.author.globalName} - @${message.author.username} (${message.author.id})`,
            inline: true,
          },
          {
            name: 'Message',
            value: message.content,
            inline: false,
          }
        )
        .setTimestamp()
        .setAuthor({
          name: `@${message.author.username}`,
          iconURL: `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=4096`,
        })
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = message.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `Message Deleted - [Link](${message.url})]`,
        embeds: [messageDeleteLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      console.log(error);
    }
  },
};
