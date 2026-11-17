import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../types.js';

/** /userinfo command. */
export const userinfo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show information about a member')
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Member to look up (default: you)')),
  execute(_interaction, _ctx) {
    return Promise.reject(new Error('not implemented'));
  },
};
