const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { generateID, cleanMessage } = require('../../functions/helper.js');
const { errorMessage } = require('../../functions/logger.js');
const packageJson = require('../../../package.json');
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder().setName('about').setDescription('Shows info about the bot').setDMPermission(false),

  async execute(interaction) {
    try {
      const support = new ButtonBuilder()
        .setLabel('support')
        .setURL(config.discord.supportInvite)
        .setStyle(ButtonStyle.Link);
      const invite = new ButtonBuilder().setLabel('invite').setURL(config.discord.botInvite).setStyle(ButtonStyle.Link);
      const source = new ButtonBuilder()
        .setLabel('source')
        .setURL('https://github.com/Kathund/WynnTools')
        .setStyle(ButtonStyle.Link);
      const row = new ActionRowBuilder().addComponents(support, invite, source);
      var embed = new EmbedBuilder()
        .setTitle(`WynnTools Utils Stats`)
        .setColor(config.other.colors.green)
        .setTimestamp()
        .setDescription(
          'WynnTools - A bot that does stuff with the wynncraft api - The Only bot that uses images **that i have seen**'
        )
        .addFields({
          name: 'General',
          value: `<:Dev:1130772126769631272> Developer - \`@kathund\`\n<:bullet:1064700156789927936> Version \`${packageJson.version}\`\nUptime - <t:${global.uptime}:R>`,
          inline: true,
        })
        .setFooter({
          text: `by @kathund | ${config.discord.supportInvite} for support`,
          iconURL: config.other.logo,
        });
      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      var errorId = generateID(config.other.errorIdLength);
      errorMessage(`Error Id - ${errorId}`);
      console.log(error);
      const errorEmbed = new EmbedBuilder()
        .setColor(config.other.colors.red)
        .setTitle('An error occurred')
        .setDescription(
          `Use </report-bug:${
            config.discord.commands['report-bug']
          }> to report it\nError id - ${errorId}\nError Info - \`${cleanMessage(error)}\``
        )
        .setFooter({ text: `by @kathund | ${config.discord.supportInvite} for support`, iconURL: config.other.logo });
      const supportDisc = new ButtonBuilder()
        .setLabel('Support Discord')
        .setURL(config.discord.supportInvite)
        .setStyle(ButtonStyle.Link);
      const row = new ActionRowBuilder().addComponents(supportDisc);
      await interaction.reply({ embeds: [errorEmbed], rows: [row] });
    }
  },
};
