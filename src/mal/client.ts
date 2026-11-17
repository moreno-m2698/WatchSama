import { MalApiError, type MalErrorKind } from './errors.js';
import { mapListEntry, mapSearchItem, parsePage } from './mapping.js';
import type { Anime, ListEntry, ListStatus, MalClient } from './types.js';

/** Options for createMalClient. `fetch` is injectable for tests. */
export interface MalClientOptions {
  clientId: string;
  fetch?: typeof globalThis.fetch;
  /** Default 'https://api.myanimelist.net/v2' */
  baseUrl?: string;
}

const MAX_PAGE = 100;
const TIMEOUT_MS = 10_000;

function kindForStatus(status: number, message: string): MalErrorKind {
  switch (status) {
    case 400:
      return message === 'Invalid client id' ? 'unauthorized' : 'invalid_request';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 429:
      return 'rate_limited';
    default:
      return 'unknown';
  }
}

/** Create a MAL API v2 client. */
export function createMalClient(opts: MalClientOptions): MalClient {
  const { clientId } = opts;
  const doFetch = opts.fetch ?? globalThis.fetch;
  const baseUrl = (opts.baseUrl ?? 'https://api.myanimelist.net/v2').replace(/\/+$/, '');

  async function getJson(url: string): Promise<unknown> {
    let res: Response;
    try {
      res = await doFetch(url, {
        method: 'GET',
        headers: { 'X-MAL-CLIENT-ID': clientId },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new MalApiError('network', `Request to MAL failed: ${reason}`);
    }

    if (!res.ok) {
      let message = '';
      try {
        const body: unknown = JSON.parse(await res.text());
        if (typeof body === 'object' && body !== null && 'message' in body) {
          const m = (body as { message?: unknown }).message;
          if (typeof m === 'string') message = m;
        }
      } catch {
        // non-JSON or unreadable body: fall through with empty message
      }
      const kind = kindForStatus(res.status, message);
      throw new MalApiError(
        kind,
        message !== '' ? `MAL API error ${res.status}: ${message}` : `MAL API error ${res.status}`,
        res.status,
      );
    }

    try {
      return await res.json();
    } catch {
      throw new MalApiError('unknown', 'MAL returned a non-JSON success body', res.status);
    }
  }

  return {
    async getUserAnimeList(
      username: string,
      status: ListStatus,
      o: { limit?: number } = {},
    ): Promise<ListEntry[]> {
      const limit = o.limit ?? 100;
      const entries: ListEntry[] = [];
      if (limit <= 0) return entries;

      const params = new URLSearchParams({
        status,
        sort: 'list_updated_at',
        limit: String(Math.min(limit, MAX_PAGE)),
        fields: 'list_status,num_episodes,media_type,synopsis,main_picture',
      });
      let url: string | null =
        `${baseUrl}/users/${encodeURIComponent(username)}/animelist?${params.toString()}`;

      while (url !== null && entries.length < limit) {
        const { items, next } = parsePage(await getJson(url));
        for (const item of items) entries.push(mapListEntry(item));
        url = next;
      }
      return entries.slice(0, limit);
    },

    async searchAnime(query: string, o: { limit?: number } = {}): Promise<Anime[]> {
      const params = new URLSearchParams({
        q: query,
        limit: String(o.limit ?? 5),
        fields: 'synopsis,media_type,num_episodes,main_picture',
      });
      const { items } = parsePage(await getJson(`${baseUrl}/anime?${params.toString()}`));
      return items.map(mapSearchItem);
    },
  };
}
