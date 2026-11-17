import type { SlashCommand } from '../types.js';
import { createListCommand } from './listCommand.js';

/** /completed command. */
export const completed: SlashCommand = createListCommand({
  name: 'completed',
  description: 'Show what a MyAnimeList user has completed',
  status: 'completed',
  emptyMessage: (u) => `${u} hasn't completed anything yet.`,
  heading: (u) => `Here's what ${u} has completed!`,
});
