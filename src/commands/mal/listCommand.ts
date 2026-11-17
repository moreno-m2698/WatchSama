import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { ListStatus } from '../../mal/types.js';
import { listEntryEmbed } from '../../ui/embeds.js';
import { sendPaginated } from '../../ui/paginator.js';
import type { SlashCommand } from '../types.js';
import { replyWithMalError } from './errors.js';

const USERNAME_PATTERN = /^[A-Za-z0-9_-]{2,16}$/;

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
    async execute(interaction, ctx) {
      const username = interaction.options.getString('username') ?? ctx.config.malUsername;
      if (!username) {
        await interaction.reply({
          content: 'No MAL username given and no default is configured.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      if (!USERNAME_PATTERN.test(username)) {
        await interaction.reply({
          content: "That doesn't look like a valid MAL username.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferReply();

      let entries;
      try {
        entries = await ctx.mal.getUserAnimeList(username, spec.status);
      } catch (err) {
        if (await replyWithMalError(interaction, err, username)) return;
        throw err;
      }

      if (entries.length === 0) {
        await interaction.editReply({ content: spec.emptyMessage(username) });
        return;
      }

      await sendPaginated(
        interaction,
        entries.length,
        (i) => {
          const entry = entries[i];
          if (!entry) throw new RangeError(`No list entry at index ${i}`);
          return listEntryEmbed(entry, ctx.emojis, { index: i, count: entries.length });
        },
        { content: spec.heading(username) },
      );
    },
  };
}
