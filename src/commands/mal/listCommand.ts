import { SlashCommandBuilder } from 'discord.js';
import type { ListStatus } from '../../mal/types.js';
import type { SlashCommand } from '../types.js';

/** Copy and status for a list command. */
export interface ListCommandSpec {
  name: string;
  description: string;
  status: ListStatus;
  /** Reply when the list is empty. */
  emptyMessage: (username: string) => string;
  /** Message content above the paginated embeds. */
  heading: (username: string) => string;
}

/** Shared factory for /watching and /completed. */
export function createListCommand(spec: ListCommandSpec): SlashCommand {
  return {
    data: new SlashCommandBuilder()
      .setName(spec.name)
      .setDescription(spec.description)
      .addStringOption((o) =>
        o
          .setName('username')
          .setDescription('MyAnimeList username (default: the bot configured user)')
          .setMinLength(2)
          .setMaxLength(16),
      ),
    execute(_interaction, _ctx) {
      return Promise.reject(new Error('not implemented'));
    },
  };
}
