import { Events } from 'discord.js';
import type { Client, Team, User } from 'discord.js';
import { log } from '../../log.js';
import { loadProgressEmojis } from '../../ui/emojis.js';
import type { BotContext } from '../context.js';
import { pickAnnounceChannel } from './channels.js';

/** Owner user id(s) from an application owner: a User gives one id, a Team gives all member ids. */
export function extractOwnerIds(owner: User | Team | null | undefined): string[] {
  if (!owner) return [];
  if ('members' in owner) return [...owner.members.values()].map((m) => m.user.id);
  return [owner.id];
}

/** Run one startup step; a failure is logged and does not stop the others. */
async function step(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
  } catch (err) {
    log.error(`Startup step failed: ${name}`, err);
  }
}

/** Register the one-time ClientReady handler (owner ids, emojis, presence, startup message). */
export function registerReady(client: Client, ctx: BotContext): void {
  client.once(Events.ClientReady, (ready) => {
    void (async () => {
      await step('log', () => {
        log.info(`Logged in as ${ready.user.tag}`);
      });
      await step('owners', async () => {
        const app = await ready.application.fetch();
        for (const id of extractOwnerIds(app.owner)) ctx.ownerIds.add(id);
      });
      await step('emojis', async () => {
        ctx.emojis = await loadProgressEmojis(ready);
      });
      await step('presence', () => {
        ready.user.setPresence({ status: 'idle' });
      });
      await step('startup message', async () => {
        const guildId = ctx.config.devGuildId;
        if (!guildId) return;
        const guild = ready.guilds.cache.get(guildId);
        if (!guild) {
          log.warn(`Dev guild ${guildId} not in cache; skipping startup message`);
          return;
        }
        const channel = pickAnnounceChannel(guild);
        if (!channel) {
          log.info('No sendable channel in dev guild; skipping startup message');
          return;
        }
        await channel.send('WatchSama is running');
      });
    })();
  });
}
