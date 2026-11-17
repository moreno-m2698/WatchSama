import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { searchResultEmbed } from '../../ui/embeds.js';
import { sendPaginated } from '../../ui/paginator.js';
import type { SlashCommand } from '../types.js';
import { replyWithMalError } from './errors.js';

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
  async execute(interaction, ctx) {
    const query = interaction.options.getString('query', true).trim();
    if (query.length < 3) {
      await interaction.reply({
        content: 'Your search needs at least 3 characters.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let results;
    try {
      results = await ctx.mal.searchAnime(query);
    } catch (err) {
      if (await replyWithMalError(interaction, err)) return;
      throw err;
    }

    if (results.length === 0) {
      await interaction.editReply({ content: `No results for \`${query}\`.` });
      return;
    }

    await sendPaginated(
      interaction,
      results.length,
      (i) => {
        const anime = results[i];
        if (!anime) throw new RangeError(`No search result at index ${i}`);
        return searchResultEmbed(anime, { index: i, count: results.length });
      },
      { content: 'Here are some entries that might fit your search:' },
    );
  },
};
