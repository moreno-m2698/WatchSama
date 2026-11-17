import type { Client } from 'discord.js';
import { log } from '../log.js';
import { UNICODE_FALLBACK, type ProgressEmojis } from './progressBar.js';

/** Mapping between ProgressEmojis keys, application emoji names and asset files. */
export const EMOJI_TABLE: readonly { key: keyof ProgressEmojis; name: string; file: string }[] = [
  { key: 'emptyMid', name: 'ws_empty_mid', file: 'Empty_Bar_1.png' },
  { key: 'emptyEnd', name: 'ws_empty_end', file: 'Empty_Bar_2.png' },
  { key: 'filledStart', name: 'ws_filled_start', file: 'Filled_Bar_1.png' },
  { key: 'filledMid', name: 'ws_filled_mid', file: 'Filled_Bar_2.png' },
  { key: 'heartStart', name: 'ws_heart_start', file: 'Heart_Bar_1.png' },
  { key: 'heartMid', name: 'ws_heart_mid', file: 'Heart_Bar_2.png' },
  { key: 'heartEnd', name: 'ws_heart_end', file: 'Heart_Bar_3.png' },
];

/** Fetch application emojis (ws_*) as a ProgressEmojis; falls back to UNICODE_FALLBACK with a warning. */
export async function loadProgressEmojis(client: Client<true>): Promise<ProgressEmojis> {
  try {
    const fetched = await client.application.emojis.fetch();
    const byName = new Map<string, string>();
    for (const emoji of fetched.values()) {
      if (emoji.name) byName.set(emoji.name, emoji.toString());
    }
    const missing = EMOJI_TABLE.filter((r) => !byName.has(r.name)).map((r) => r.name);
    if (missing.length > 0) {
      log.warn(
        `Missing application emojis: ${missing.join(', ')}. Using Unicode fallback; run \`pnpm emojis:upload\`.`,
      );
      return UNICODE_FALLBACK;
    }
    const result = { ...UNICODE_FALLBACK };
    for (const r of EMOJI_TABLE) result[r.key] = byName.get(r.name) ?? UNICODE_FALLBACK[r.key];
    return result;
  } catch (err) {
    log.warn('Could not fetch application emojis; using Unicode fallback.', err);
    return UNICODE_FALLBACK;
  }
}
