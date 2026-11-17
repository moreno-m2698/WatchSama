import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../types.js';

/** /info command. */
export const info: SlashCommand = {
  data: new SlashCommandBuilder().setName('info').setDescription('About WatchSama'),
  execute(_interaction, _ctx) {
    return Promise.reject(new Error('not implemented'));
  },
};
