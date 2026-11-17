import { SlashCommandBuilder } from 'discord.js';
import { baseEmbed } from '../../ui/theme.js';
import type { SlashCommand } from '../types.js';

/** /info command. */
export const info: SlashCommand = {
  data: new SlashCommandBuilder().setName('info').setDescription('About WatchSama'),
  async execute(interaction, _ctx) {
    const embed = baseEmbed()
      .setTitle('WatchSama')
      .setURL('https://github.com/moreno-m2698/WatchSama')
      .setDescription('Developers: .keopi');
    await interaction.reply({ embeds: [embed] });
  },
};
