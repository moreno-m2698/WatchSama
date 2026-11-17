import { Events } from 'discord.js';
import type { Client } from 'discord.js';
import { log } from '../../log.js';
import { baseEmbed } from '../../ui/theme.js';
import type { BotContext } from '../context.js';
import { pickAnnounceChannel } from './channels.js';

/** Register the guildCreate handler (welcome embed in the best channel). */
export function registerGuildCreate(client: Client, _ctx: BotContext): void {
  client.on(Events.GuildCreate, (guild) => {
    void (async () => {
      try {
        const channel = pickAnnounceChannel(guild);
        if (!channel) {
          log.info(`No channel to welcome in guild ${guild.id}`);
          return;
        }
        await channel.send({
          embeds: [
            baseEmbed()
              .setTitle('WatchSama Bot Info')
              .setDescription('Thank you for choosing to use WatchSama!'),
          ],
        });
      } catch (err) {
        log.error('guildCreate handler failed', err);
      }
    })();
  });
}
