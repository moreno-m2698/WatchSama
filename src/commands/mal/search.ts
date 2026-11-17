import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../types.js';

/** /search command. */
export const search: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search MyAnimeList for an anime')
    .addStringOption((o) =>
      o
        .setName('query')
        .setDescription('Anime title to search for')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(100),
    ),
  execute(_interaction, _ctx) {
    return Promise.reject(new Error('not implemented'));
  },
};
