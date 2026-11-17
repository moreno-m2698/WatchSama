import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../types.js';

/** /ping command. */
export const ping: SlashCommand = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot latency'),
  execute(_interaction, _ctx) {
    return Promise.reject(new Error('not implemented'));
  },
};
