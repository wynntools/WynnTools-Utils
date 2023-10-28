import { ColorResolvable, EmbedBuilder, TextChannel, Events, Message } from 'discord.js';
import { eventMessage, errorMessage } from '../functions/logger';
import { generateID } from '../functions/helper';
import { other, discord } from '../../config.json';

export const name = Events.MessageDelete;

export const execute = async (message: Message) => {
  try {
    const loggerChannel = message.guild?.channels.cache.get(discord.channels.logger) as TextChannel;
    if (message.guildId != discord.devServer) return;
    eventMessage(`${Events.MessageDelete} Event triggered by ${message.author.id}`);
    const messageDeleteLoggerEmbed = new EmbedBuilder()
      .setDescription(`Message Deleted - <#${message.channel.id}> (${message.channel.id})`)
      .setColor(other.colors.red.hex as ColorResolvable)
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
        text: `by @kathund | ${discord.supportInvite} for support`,
        iconURL: other.logo,
      });

    await loggerChannel.send({
      content: `Message Deleted - [Link](${message.url})`,
      embeds: [messageDeleteLoggerEmbed],
    });
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
  }
};
