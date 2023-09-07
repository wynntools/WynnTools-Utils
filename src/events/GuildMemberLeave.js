const { errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      if (member.guild.id != config.discord.devServer) return;
      const memberLeaveLoggerEmbed = new EmbedBuilder()
        .setDescription(`Member Left (${member.user.id})`)
        .setColor(config.other.colors.red)
        .addFields(
          {
            name: 'User',
            value: `${member.user.globalName} - @${member.user.username} (${member.user.id}) - <@${member.user.id}>`,
            inline: true,
          },
          {
            name: 'Account Created',
            value: `<t:${member.user.createdTimestamp}:F> (<t:${member.user.createdTimestamp}:R>)`,
            inline: true,
          },
          {
            name: 'Account Joined',
            value: `<t:${member.joinedTimestamp}:F> (<t:${member.joinedTimestamp}:R>)`,
            inline: true,
          },
          {
            name: 'Member Count',
            value: `${member.guild.memberCount}`,
            inline: true,
          }
        )
        .setTimestamp()
        .setAuthor({
          name: `@${member.user.username}`,
          iconURL: member.user.avatarURL,
        })
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = member.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `User Left - <@${member.user.id}>`,
        embeds: [memberLeaveLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      console.log(error);
    }
  },
};
