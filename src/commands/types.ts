import type { ChatInputCommandInteraction, SharedSlashCommand } from 'discord.js';
import type { BotContext } from '../bot/context.js';

/** A slash command: its definition (for deploy) and its handler. */
export interface SlashCommand {
  /** Builder output; `.toJSON()` is used by deploy-commands. */
  data: SharedSlashCommand;
  /** Handle an invocation of this command. */
  execute(interaction: ChatInputCommandInteraction, ctx: BotContext): Promise<void>;
}
