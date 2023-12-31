const { errorMessage, eventMessage } = require('../functions/logger.js');
const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const { generateID } = require('../functions/helper.js');
const config = require('../../config.json');

module.exports = {
  name: Events.ChannelCreate,
  async execute(channel) {
    try {
      if (channel.guild.id != config.discord.devServer) return;
      eventMessage(Events.ChannelCreate, channel.id);
      var logs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelCreate,
        limit: 1,
      });
      var log = logs.entries.first();
      var permissions = log.changes.find((item) => item.key === 'permission_overwrites').new;
      var permissionsString = '';
      permissions.forEach((permission) => {
        permissionsString += `${permission.type} - ${permission.id} - ${permission.allow} - ${permission.deny}\n`;
      });
      // eslint-disable-next-line
      console.log(permissionsString);
      permissions.forEach(async (permission) => {
        var role = await channel.guild.roles.cache.get(permission.id);
        var perms = await channel.permissionsFor(role).toArray();
        // eslint-disable-next-line
        console.log(`Role: ${role.name} (${role.id}) - Permissions: ${perms.join(', ')}`);
      });
      const channelCreatedLoggerEmbed = new EmbedBuilder()
        .setDescription(`**${channel.name}** Created <#${channel.id}>`)
        .setColor(config.other.colors.green.hex)
        .addFields(
          {
            name: 'Name',
            value: `${channel.name} (${channel.id})`,
            inline: false,
          },
          {
            name: 'User',
            value: `${
              log.executor.globalName
                ? `${log.executor.globalName} (${
                    log.executor.discriminator == '0'
                      ? `@${log.executor.username}`
                      : `${log.executor.username}#${log.executor.discriminator}`
                  })`
                : log.executor.discriminator == '0'
                ? `@${log.executor.username}`
                : `${log.executor.username}#${log.executor.discriminator}`
            } - ${log.executor.id} <@${log.executor.id}>`,
            inline: false,
          },
          {
            name: 'Permissions',
            value: 'when i work out how to get this i will add it',
            inline: false,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `by @kathund`,
          iconURL: config.other.logo,
        });
      var loggerChannel = channel.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `Channel Created - ${channel.id}`,
        embeds: [channelCreatedLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      errorMessage(error);
    }
  },
};
