const { errorMessage } = require('../functions/logger.js');
const { generateID } = require('../functions/helper.js');
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: Events.InviteCreate,
  async execute(invite) {
    try {
      if (invite.guild.id != config.discord.devServer) return;
      const inviteCreateLoggerEmbed = new EmbedBuilder()
        .setDescription(`Invite - discord.gg/${invite.code}`)
        .setColor(config.other.colors.green)
        .addFields(
          {
            name: 'User',
            value: `${invite.inviter.globalName} - @${invite.inviter.username} (${invite.inviter.id}) - <@${invite.inviter.id}>\nCreated -<t:${invite.inviter.createdTimestamp}:F> (<t:${invite.inviter.createdTimestamp}:R>)\nJoined - <t:${invite.inviter.joinedTimestamp}:F> (<t:${invite.inviter.joinedTimestamp}:R>)`,
            inline: true,
          },
          {
            name: 'Invite Info',
            value: `Channel: <#${invite.channel.id}> (${invite.channel.id})\nCode: ${invite.code}\nMax Uses: ${invite.maxUses}\nMax Age: ${invite.maxAge} seconds\nTemporary: ${invite.temporary}\nCreated - <t:${invite.createdTimestamp}:F> (<t:${invite.createdTimestamp}:R>)`,
            // https://discord.js.org/#/docs/discord.js/main/class/Invite?scrollTo=uses
            // https://github.com/pterodactyl/panel/issues/2486
            inline: true,
          },
          {
            name: 'Staff',
            value: ':shrug:',
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });

      var loggerChannel = invite.guild.channels.cache.get(config.discord.channels.logger);
      await loggerChannel.send({
        content: `Member Banned - ${invite.user.id}`,
        embeds: [inviteCreateLoggerEmbed],
      });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error ID: ${errorId}`);
      console.log(error);
    }
  },
};
