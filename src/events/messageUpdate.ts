import { ColorResolvable, EmbedBuilder, TextChannel, Events, Message } from 'discord.js';
import { eventMessage, errorMessage } from '../functions/logger';
import { generateID } from '../functions/helper';
import { other, discord } from '../../config.json';

export const name = Events.MessageUpdate;

export const execute = async (oldMessage: Message, newMessage: Message) => {
  try {
    const loggerChannel = oldMessage.guild?.channels.cache.get(discord.channels.logger) as TextChannel;
    if (oldMessage.guildId != discord.devServer) return;
    eventMessage(`${Events.MessageUpdate} Event triggered by ${oldMessage.author.id}`);
    const messageUpdatedLoggerEmbed = new EmbedBuilder()
      .setDescription(
        `Message Edited - <#${oldMessage.channel.id}> (${oldMessage.channel.id}) @ [Link](${oldMessage.url})`
      )
      .setColor(other.colors.orange.hex as ColorResolvable)
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
        text: `by @kathund | ${discord.supportInvite} for support`,
        iconURL: other.logo,
      });

    await loggerChannel.send({
      content: `Message Edited - [Link](${oldMessage.url})`,
      embeds: [messageUpdatedLoggerEmbed],
    });
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
  }
};
