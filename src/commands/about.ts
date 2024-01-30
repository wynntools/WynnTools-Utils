import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ColorResolvable,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
} from 'discord.js';
import { generateID, cleanMessage } from '../functions/helper';
import { errorMessage } from '../functions/logger';
import { discord, other } from '../../config.json';
import { version } from '../../package.json';

export const data = new SlashCommandBuilder()
  .setName('about')
  .setDescription('Shows info about the bot')
  .setDMPermission(false);

export const execute = async (interaction: ChatInputCommandInteraction) => {
  try {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel('source').setURL('https://github.com/Kathund/WynnTools').setStyle(ButtonStyle.Link),
      new ButtonBuilder().setLabel('support').setURL(discord.supportInvite).setStyle(ButtonStyle.Link),
      new ButtonBuilder().setLabel('invite').setURL(discord.botInvite).setStyle(ButtonStyle.Link)
    );
    const embed = new EmbedBuilder()
      .setTitle(`WynnTools Utils Stats`)
      .setColor(other.colors.green as ColorResolvable)
      .setTimestamp()
      .setDescription(
        'WynnTools - A bot that does stuff with the wynncraft api - The Only bot that uses images **that i have seen**'
      )
      .addFields({
        name: 'General',
        value: `<:Dev:1130772126769631272> Developer - \`@kathund\`\n<:bullet:1064700156789927936> Version \`${version}\`\nUptime - <t:${Math.floor(
          (Date.now() - interaction.client.uptime) / 1000
        )}:R>`,
        inline: true,
      })
      .setFooter({
        text: `by @kathund | ${discord.supportInvite} for support`,
        iconURL: other.logo,
      });
    await interaction.reply({ embeds: [embed], components: [row] });
  } catch (error: any) {
    const errorId = generateID(other.errorIdLength);
    errorMessage(`Error Id - ${errorId}`);
    errorMessage(error);
    const errorEmbed = new EmbedBuilder()
      .setColor(other.colors.red as ColorResolvable)
      .setTitle('An error occurred')
      .setDescription(
        `Use </report-bug:${
          discord.commands['report-bug']
        }> to report it\nError id - ${errorId}\nError Info - \`${cleanMessage(error)}\``
      )
      .setFooter({ text: `by @kathund | ${discord.supportInvite} for support`, iconURL: other.logo });
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel('Support Discord').setURL(discord.supportInvite).setStyle(ButtonStyle.Link)
    );
    await interaction.reply({ embeds: [errorEmbed], components: [row] });
  }
};
