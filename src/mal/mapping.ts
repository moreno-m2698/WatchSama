import type { Anime, ListEntry } from './types.js';

/** Map a raw API `node` object to an Anime. */
export function mapAnime(_node: unknown): Anime {
  throw new Error('not implemented');
}

/** Map a raw API list item (`{ node, list_status }`) to a ListEntry. */
export function mapListEntry(_item: unknown): ListEntry {
  throw new Error('not implemented');
}
