const { errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.GuildRoleUpdate,
  async execute(oldRole, newRole) {
    try {
      if (oldRole.guild.id != config.discord.devServer) return;
      const roleUpdateLoggerEmbed = new EmbedBuilder()
        .setDescription(`Channel Updated - ${oldRole.name} (${oldRole.id}) - <@&${oldRole.id}>`)
        .setColor(config.other.colors.red)
        .addFields(
          {
            name: 'User',
            value: 'when i work out how to get this i will add it',
            inline: true,
          },
          {
            name: 'Old Role',
            value: `<t:${oldRole.createdTimestamp}:F> (<t:${oldRole.createdTimestamp}:R>) - ${oldRole.name} (${oldRole.id})`,
            inline: true,
          },
          {
            name: 'New Role',
            value: `<t:${newRole.createdTimestamp}:F> (<t:${newRole.createdTimestamp}:R>) - ${newRole.name} (${newRole.id})`,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = oldRole.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `Role Updated - ${oldRole.id}`,
        embeds: [roleUpdateLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      errorMessage(error);
    }
  },
};
