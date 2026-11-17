import { pathToFileURL } from 'node:url';
import { REST, Routes } from 'discord.js';
import { commands } from '../src/bot/registry.js';
import { loadConfig } from '../src/config.js';
import type { Config } from '../src/config.js';
import { log } from '../src/log.js';

/** Where to deploy: global, or one guild (with --guild). */
export type DeployTarget = { scope: 'global' } | { scope: 'guild'; guildId: string };

/** Pure: decide the deploy target from argv and config; throws if --guild lacks DEV_GUILD. */
export function resolveDeployTarget(argv: readonly string[], config: Config): DeployTarget {
  if (!argv.includes('--guild')) return { scope: 'global' };
  if (!config.devGuildId) throw new Error('--guild requires DEV_GUILD to be set');
  return { scope: 'guild', guildId: config.devGuildId };
}

/** `pnpm commands:deploy [--guild]`: PUT all command definitions from the registry. */
async function main(): Promise<void> {
  try {
    const config = loadConfig();
    const target = resolveDeployTarget(process.argv.slice(2), config);
    const rest = new REST({ version: '10' }).setToken(config.botToken);
    const body = commands.map((c) => c.data.toJSON());
    const route =
      target.scope === 'guild'
        ? Routes.applicationGuildCommands(config.applicationId, target.guildId)
        : Routes.applicationCommands(config.applicationId);
    await rest.put(route, { body });
    const where = target.scope === 'guild' ? `guild ${target.guildId}` : 'global';
    log.info(`Deployed ${body.length} commands (${where})`);
  } catch (err) {
    log.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

// Only run when executed directly, so tests can import resolveDeployTarget.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
