import type { EmbedBuilder } from 'discord.js';
import type { Anime, ListEntry } from '../mal/types.js';
import { formatMediaType, formatStatus, truncate } from './format.js';
import { renderProgressBar, type ProgressEmojis } from './progressBar.js';
import { baseEmbed } from './theme.js';

/** Position of an item within a paginated result set (0-based index). */
export interface Position {
  index: number;
  count: number;
}

function animeEmbed(anime: Anime): EmbedBuilder {
  const embed = baseEmbed().setTitle(truncate(anime.title, 256)).setURL(anime.url);
  if (anime.imageUrl !== null) embed.setImage(anime.imageUrl);
  if (anime.synopsis !== '') embed.setDescription(truncate(anime.synopsis, 1024));
  return embed;
}

/** Embed for one list entry (progress bar only for 'watching'). */
export function listEntryEmbed(
  entry: ListEntry,
  e: ProgressEmojis,
  position: Position,
): EmbedBuilder {
  const embed = animeEmbed(entry.anime);
  if (entry.status === 'watching') {
    embed.addFields({
      name: 'Progress',
      value: renderProgressBar(entry.episodesWatched, entry.anime.totalEpisodes, e),
    });
  }
  embed.addFields(
    { name: 'Type', value: formatMediaType(entry.anime.mediaType), inline: true },
    { name: 'Watch status', value: formatStatus(entry.status), inline: true },
  );
  return embed.setFooter({ text: `Entry ${position.index + 1} / ${position.count}` });
}

/** Embed for one search result. */
export function searchResultEmbed(anime: Anime, position: Position): EmbedBuilder {
  return animeEmbed(anime)
    .addFields(
      { name: 'Type', value: formatMediaType(anime.mediaType), inline: true },
      { name: 'Episodes', value: String(anime.totalEpisodes ?? '?'), inline: true },
    )
    .setFooter({ text: `Result ${position.index + 1} / ${position.count}` });
}
