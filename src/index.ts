import { loadConfig } from './config.js';
import type { Config } from './config.js';
import { log } from './log.js';
import { createMalClient } from './mal/client.js';
import { UNICODE_FALLBACK } from './ui/progressBar.js';
import { createClient } from './bot/client.js';
import type { BotContext } from './bot/context.js';
import { registerGuildCreate } from './bot/events/guildCreate.js';
import { registerReady } from './bot/events/ready.js';
import { registerRouter } from './bot/router.js';

/** Entry point: config -> client -> handlers -> login. */
async function main(): Promise<void> {
  let config: Config;
  try {
    config = loadConfig();
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const mal = createMalClient({ clientId: config.malClientId });
  const ctx: BotContext = { config, mal, emojis: UNICODE_FALLBACK, ownerIds: new Set() };

  const client = createClient();
  registerReady(client, ctx);
  registerGuildCreate(client, ctx);
  registerRouter(client, ctx);

  const shutdown = (signal: string): void => {
    log.info(`Received ${signal}, shutting down`);
    void client.destroy().finally(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    log.error('Unhandled rejection', reason);
  });

  try {
    await client.login(config.botToken);
  } catch (err) {
    log.error('Failed to log in. Check BOT_TOKEN in your environment.', err);
    process.exit(1);
  }
}

void main();
