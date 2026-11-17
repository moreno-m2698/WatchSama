import { EmbedBuilder } from 'discord.js';

/** Brand colour (#FFB7C5). */
export const BRAND_COLOR = 0xffb7c5;

/** Embed pre-set with the brand colour and author name "WatchSama". */
export function baseEmbed(): EmbedBuilder {
  return new EmbedBuilder().setColor(BRAND_COLOR).setAuthor({ name: 'WatchSama' });
}
