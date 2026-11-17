import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../types.js';

/** /stop command. */
export const stop: SlashCommand = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Shut the bot down (owner only)'),
  execute(_interaction, _ctx) {
    return Promise.reject(new Error('not implemented'));
  },
};
