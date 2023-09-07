const { generateID, toFixed } = require('../functions/helper.js');
const { errorMessage } = require('../functions/logger.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      if (member.guild.id != config.discord.devServer) return;
      const memberJoinLoggerEmbed = new EmbedBuilder()
        .setDescription(`Member Joined (${member.user.id}) - <@${member.user.id}>`)
        .setColor(config.other.colors.green)
        .addFields(
          {
            name: 'User',
            value: `${member.user.globalName? `${member.user.globalName} (${member.user.discriminator == '0'? `@${member.user.username}`: `${member.user.username}#${member.user.discriminator}`})`: member.user.discriminator == '0'? `@${member.user.username}`: `${member.user.username}#${member.user.discriminator}`} - ${member.user.id} <@${member.user.id}>`,
            inline: false,
          },
          {
            name: 'Account Created',
            value: `<t:${toFixed(member.user.createdTimestamp / 1000, 0)}:F> (<t:${toFixed(
              member.user.createdTimestamp / 1000,
              0
            )}:R>)`,
            inline: false,
          },
          {
            name: 'Member Count',
            value: `${member.guild.memberCount}`,
            inline: false,
          }
        )
        .setTimestamp()
        .setAuthor({
          name: `@${member.user.username} Joined`,
          iconURL: `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=4096`,
        })
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = member.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `User Joined - ${member.user.id}`,
        embeds: [memberJoinLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      console.log(error);
    }
  },
};
