import type { Client } from 'discord.js';
import type { BotContext } from '../context.js';

/** Register the guildCreate handler (welcome embed in the best channel). */
export function registerGuildCreate(_client: Client, _ctx: BotContext): void {
  throw new Error('not implemented');
}
