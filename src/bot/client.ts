import { Client, GatewayIntentBits } from 'discord.js';

/** Create a Client with GatewayIntentBits.Guilds only. */
export function createClient(): Client {
  return new Client({ intents: [GatewayIntentBits.Guilds] });
}
