import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../types.js';

/** /serverinfo command. */
export const serverinfo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show information about this server')
    .setContexts(InteractionContextType.Guild),
  execute(_interaction, _ctx) {
    return Promise.reject(new Error('not implemented'));
  },
};
