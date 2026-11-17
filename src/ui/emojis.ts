import type { Client } from 'discord.js';
import type { ProgressEmojis } from './progressBar.js';

/** Fetch application emojis (ws_*) as a ProgressEmojis; falls back to UNICODE_FALLBACK with a warning. */
export function loadProgressEmojis(_client: Client<true>): Promise<ProgressEmojis> {
  return Promise.reject(new Error('not implemented'));
}
