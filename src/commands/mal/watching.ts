import type { SlashCommand } from '../types.js';
import { createListCommand } from './listCommand.js';

/** /watching command. */
export const watching: SlashCommand = createListCommand({
  name: 'watching',
  description: 'Show what a MyAnimeList user is currently watching',
  status: 'watching',
  emptyMessage: (u) => `${u} isn't watching anything right now.`,
  heading: (u) => `Here's what ${u} is watching!`,
});
