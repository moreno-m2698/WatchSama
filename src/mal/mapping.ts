import { MalApiError } from './errors.js';
import type { Anime, ListEntry, ListStatus } from './types.js';

/** Raw `main_picture` object as returned by the API. */
export interface RawPicture {
  medium?: string;
  large?: string;
}

/** Raw anime `node` as returned by the API (fields depend on `fields=`). */
export interface RawNode {
  id: number;
  title: string;
  main_picture?: RawPicture;
  num_episodes?: number;
  media_type?: string;
  synopsis?: string;
}

/** Raw `list_status` as returned by the API. */
export interface RawListStatus {
  status: ListStatus;
  num_episodes_watched: number;
}

/** Raw list item. */
export interface RawListItem {
  node: RawNode;
  list_status: RawListStatus;
}

const LIST_STATUSES: readonly string[] = [
  'watching',
  'completed',
  'on_hold',
  'dropped',
  'plan_to_watch',
];

const malformed = (what: string): MalApiError =>
  new MalApiError('unknown', `Malformed MAL response: ${what}`);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function optString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' && v !== '' ? v : undefined;
}

/** Map a raw API `node` object to an Anime. */
export function mapAnime(node: unknown): Anime {
  if (!isRecord(node)) throw malformed('node is not an object');
  const { id, title } = node;
  if (typeof id !== 'number' || !Number.isInteger(id)) throw malformed('node.id');
  if (typeof title !== 'string') throw malformed('node.title');

  const pic = isRecord(node.main_picture) ? node.main_picture : {};
  const eps = node.num_episodes;

  return {
    id,
    title,
    url: `https://myanimelist.net/anime/${id}`,
    imageUrl: optString(pic, 'large') ?? optString(pic, 'medium') ?? null,
    mediaType: optString(node, 'media_type') ?? 'unknown',
    synopsis: typeof node.synopsis === 'string' ? node.synopsis : '',
    totalEpisodes: typeof eps === 'number' && eps > 0 ? eps : null,
  };
}

/** Map a raw API list item (`{ node, list_status }`) to a ListEntry. */
export function mapListEntry(item: unknown): ListEntry {
  if (!isRecord(item)) throw malformed('list item is not an object');
  const ls = item.list_status;
  if (!isRecord(ls)) throw malformed('list_status');
  const status = ls.status;
  if (typeof status !== 'string' || !LIST_STATUSES.includes(status)) {
    throw malformed('list_status.status');
  }
  const watched = ls.num_episodes_watched;
  if (typeof watched !== 'number') throw malformed('list_status.num_episodes_watched');
  return {
    anime: mapAnime(item.node),
    status: status as ListStatus,
    episodesWatched: watched,
  };
}

/** Extract the `data` array and optional `paging.next` from a raw list/search body. */
export function parsePage(body: unknown): { items: unknown[]; next: string | null } {
  if (!isRecord(body) || !Array.isArray(body.data)) throw malformed('missing data array');
  const paging = body.paging;
  const next = isRecord(paging) ? optString(paging, 'next') : undefined;
  return { items: body.data, next: next ?? null };
}

/** Map a search response item (`{ node }`) to an Anime. */
export function mapSearchItem(item: unknown): Anime {
  if (!isRecord(item)) throw malformed('search item is not an object');
  return mapAnime(item.node);
}
