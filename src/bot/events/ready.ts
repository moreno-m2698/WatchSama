import type { Client } from 'discord.js';
import type { BotContext } from '../context.js';

/** Register the one-time ClientReady handler (owner ids, emojis, presence, startup message). */
export function registerReady(_client: Client, _ctx: BotContext): void {
  throw new Error('not implemented');
}
