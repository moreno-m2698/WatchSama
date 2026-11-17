import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { log } from '../../log.js';
import type { SlashCommand } from '../types.js';

/** /stop command. */
export const stop: SlashCommand = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Shut the bot down (owner only)'),
  async execute(interaction, ctx) {
    if (!ctx.ownerIds.has(interaction.user.id)) {
      await interaction.reply({
        content: 'Only the bot owner can do that.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.reply({ content: 'Goodbye!', flags: MessageFlags.Ephemeral });
    log.info(`Bot stopped by ${interaction.user.tag} (${interaction.user.id})`);
    await interaction.client.destroy();
    process.exit(0);
  },
};
