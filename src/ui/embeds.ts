import type { EmbedBuilder } from 'discord.js';
import type { Anime, ListEntry } from '../mal/types.js';
import type { ProgressEmojis } from './progressBar.js';

/** Position of an item within a paginated result set (0-based index). */
export interface Position {
  index: number;
  count: number;
}

/** Embed for one list entry (progress bar only for 'watching'). */
export function listEntryEmbed(
  _entry: ListEntry,
  _e: ProgressEmojis,
  _position: Position,
): EmbedBuilder {
  throw new Error('not implemented');
}

/** Embed for one search result. */
export function searchResultEmbed(_anime: Anime, _position: Position): EmbedBuilder {
  throw new Error('not implemented');
}
