const { errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    try {
      if (oldMember.guild.id != config.discord.devServer) return;
      const memberUpdateLoggerEmbed = new EmbedBuilder()
        .setDescription(`Member Updated - <@${oldMember.user.id}> (${oldMember.user.id})`)
        .setColor(config.other.colors.red)
        .addFields(
          {
            name: 'User',
            value: `${oldMember.user.globalName} - @${oldMember.user.username} (${oldMember.user.id}) - <@${oldMember.user.id}>`,
            inline: true,
          },
          {
            name: 'Account Created',
            value: `<t:${oldMember.user.createdTimestamp}:F> (<t:${oldMember.user.createdTimestamp}:R>)`,
            inline: true,
          },
          {
            name: 'Account Joined',
            value: `<t:${oldMember.joinedTimestamp}:F> (<t:${oldMember.joinedTimestamp}:R>)`,
            inline: true,
          },
          {
            name: 'Member Count',
            value: `${oldMember.guild.memberCount}`,
            inline: true,
          },
          {
            name: 'New Member',
            value: `${newMember.user.globalName} - @${newMember.user.username} (${newMember.user.id}) - <@${newMember.user.id}>`,
            inline: true,
          }
        )
        .setTimestamp()
        .setAuthor({
          name: `@${oldMember.user.username}`,
          iconURL: oldMember.user.avatarURL,
        })
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = oldMember.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `User Updated - ${oldMember.user.id}`,
        embeds: [memberUpdateLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      console.log(error);
    }
  },
};
