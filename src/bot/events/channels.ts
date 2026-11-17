import { ChannelType, PermissionFlagsBits } from 'discord.js';
import type { Guild, TextChannel } from 'discord.js';

/** Can the bot view and send messages in this channel? */
function canSend(guild: Guild, channel: TextChannel): boolean {
  const me = guild.members.me;
  if (!me) return false;
  const perms = channel.permissionsFor(me);
  return (
    perms !== null &&
    perms.has(PermissionFlagsBits.ViewChannel) &&
    perms.has(PermissionFlagsBits.SendMessages)
  );
}

/** Best channel to announce in: the system channel if sendable, else the first sendable text channel. */
export function pickAnnounceChannel(guild: Guild): TextChannel | null {
  const sys = guild.systemChannel;
  if (sys && canSend(guild, sys)) return sys;
  const texts = [...guild.channels.cache.values()]
    .filter((c): c is TextChannel => c.type === ChannelType.GuildText)
    .sort((a, b) => a.position - b.position);
  return texts.find((c) => canSend(guild, c)) ?? null;
}
