const { errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.GuildRoleCreate,
  async execute(role) {
    try {
      if (role.guild.id != config.discord.devServer) return;
      const guildRoleCreatedLoggerEmbed = new EmbedBuilder()
        .setDescription(`Role Created - ${role.name} (${role.id}) - <@&${role.id}>`)
        .setColor(config.other.colors.green.hex)
        .addFields(
          {
            name: 'User',
            value: 'when i work out how to get this i will add it',
            inline: true,
          },
          {
            name: 'Role',
            value: `<t:${role.createdTimestamp}:F> (<t:${role.createdTimestamp}:R>) - ${role.name} (${role.id})`,
            inline: true,
          },
          {
            name: 'Role Information',
            value: `Color: ${role.hexColor}\nHoisted: ${
              role.hoist ? config.other.emojis.yes : config.other.emojis.no
            }\nMentionable: ${role.mentionable ? config.other.emojis.yes : config.other.emojis.no}`,
            inline: true,
          },
          {
            name: 'Role Permissions',
            // value: role.permissions.toArray().join('\n'),
            value: 'soon',
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = role.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `Channel Created - ${role.id}`,
        embeds: [guildRoleCreatedLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      errorMessage(error);
    }
  },
};
