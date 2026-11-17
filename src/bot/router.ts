import type { Client } from 'discord.js';
import type { BotContext } from './context.js';

/** Attach the interactionCreate handler: dispatch chat-input commands with uniform error replies. */
export function registerRouter(_client: Client, _ctx: BotContext): void {
  throw new Error('not implemented');
}
