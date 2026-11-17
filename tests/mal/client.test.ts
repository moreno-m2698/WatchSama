import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createMalClient } from '../../src/mal/client.js';
import { MalApiError, type MalErrorKind } from '../../src/mal/errors.js';
import { mapAnime, mapListEntry } from '../../src/mal/mapping.js';

const fixture = (name: string): string =>
  readFileSync(new URL(`../fixtures/mal/${name}.json`, import.meta.url), 'utf8');

interface Call {
  url: string;
  init: RequestInit | undefined;
}

function fakeFetch(responses: (() => Response)[]): {
  fetch: typeof globalThis.fetch;
  calls: Call[];
} {
  const calls: Call[] = [];
  let i = 0;
  const fetch: typeof globalThis.fetch = (input, init) => {
    calls.push({ url: input instanceof Request ? input.url : input.toString(), init });
    const r = responses[Math.min(i++, responses.length - 1)];
    if (!r) throw new Error('no response configured');
    return Promise.resolve(r());
  };
  return { fetch, calls };
}

const json =
  (body: string, status = 200) =>
  (): Response =>
    new Response(body, { status, headers: { 'content-type': 'application/json' } });

const client = (f: typeof globalThis.fetch, baseUrl?: string) =>
  createMalClient({ clientId: 'abc123', fetch: f, ...(baseUrl ? { baseUrl } : {}) });

const header = (c: Call | undefined): string | null =>
  new Headers(c?.init?.headers).get('X-MAL-CLIENT-ID');

describe('getUserAnimeList request', () => {
  it('builds the URL, params and headers', async () => {
    const { fetch, calls } = fakeFetch([json(fixture('list-page2'))]);
    await client(fetch).getUserAnimeList('someuser', 'completed', { limit: 5 });
    const url = new URL(calls[0]!.url);
    expect(url.origin + url.pathname).toBe(
      'https://api.myanimelist.net/v2/users/someuser/animelist',
    );
    expect(url.searchParams.get('status')).toBe('completed');
    expect(url.searchParams.get('sort')).toBe('list_updated_at');
    expect(url.searchParams.get('limit')).toBe('5');
    expect(url.searchParams.get('fields')).toBe(
      'list_status,num_episodes,media_type,synopsis,main_picture',
    );
    expect(header(calls[0])).toBe('abc123');
    expect(calls[0]!.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('caps page size at 100 and defaults limit to 100', async () => {
    const { fetch, calls } = fakeFetch([json(fixture('list-page2'))]);
    await client(fetch).getUserAnimeList('someuser', 'watching', { limit: 500 });
    expect(new URL(calls[0]!.url).searchParams.get('limit')).toBe('100');
    await client(fetch).getUserAnimeList('someuser', 'watching');
    expect(new URL(calls[1]!.url).searchParams.get('limit')).toBe('100');
  });

  it('encodes the username and honors a custom baseUrl', async () => {
    const { fetch, calls } = fakeFetch([json(fixture('list-page2'))]);
    await client(fetch, 'https://example.test/v2/').getUserAnimeList('a b/c?', 'dropped');
    expect(calls[0]!.url.startsWith('https://example.test/v2/users/a%20b%2Fc%3F/animelist?')).toBe(
      true,
    );
  });

  it('follows paging.next with the same header, then stops when absent', async () => {
    const { fetch, calls } = fakeFetch([json(fixture('list-page1')), json(fixture('list-page2'))]);
    const list = await client(fetch).getUserAnimeList('someuser', 'completed', { limit: 100 });
    expect(list.map((e) => e.anime.id)).toEqual([16498, 21, 9999]);
    expect(calls).toHaveLength(2);
    expect(calls[1]!.url).toContain('offset=2');
    expect(header(calls[1])).toBe('abc123');
  });

  it('trims to limit and stops fetching early', async () => {
    const { fetch, calls } = fakeFetch([json(fixture('list-page1')), json(fixture('list-page2'))]);
    const list = await client(fetch).getUserAnimeList('someuser', 'completed', { limit: 1 });
    expect(list).toHaveLength(1);
    expect(calls).toHaveLength(1);
  });

  it('trims across pages', async () => {
    const { fetch, calls } = fakeFetch([json(fixture('list-page1')), json(fixture('list-page2'))]);
    const list = await client(fetch).getUserAnimeList('someuser', 'completed', { limit: 3 });
    expect(list).toHaveLength(3);
    expect(calls).toHaveLength(2);
  });

  it('maps entries from fixtures', async () => {
    const { fetch } = fakeFetch([json(fixture('list-page1')), json(fixture('list-page2'))]);
    const [snk, op, none] = await client(fetch).getUserAnimeList('someuser', 'completed');
    expect(snk).toEqual({
      anime: {
        id: 16498,
        title: 'Shingeki no Kyojin',
        url: 'https://myanimelist.net/anime/16498',
        imageUrl: 'https://cdn.myanimelist.net/images/anime/10/47347l.webp',
        mediaType: 'tv',
        synopsis: 'Centuries ago, mankind was slaughtered...',
        totalEpisodes: 25,
      },
      status: 'completed',
      episodesWatched: 25,
    });
    expect(op!.anime.totalEpisodes).toBeNull();
    expect(none!.anime.imageUrl).toBeNull();
    expect(none!.anime.synopsis).toBe('');
    expect(none!.anime.totalEpisodes).toBeNull();
    expect(none!.anime.mediaType).toBe('ova');
  });
});

describe('searchAnime', () => {
  it('encodes q with spaces and ampersands and sends one request', async () => {
    const { fetch, calls } = fakeFetch([json(fixture('search'))]);
    const res = await client(fetch).searchAnime('one & piece', { limit: 2 });
    expect(calls).toHaveLength(1);
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe('/v2/anime');
    expect(url.searchParams.get('q')).toBe('one & piece');
    expect(calls[0]!.url).not.toContain('one & piece');
    expect(calls[0]!.url).toContain('%26');
    expect(url.searchParams.get('limit')).toBe('2');
    expect(url.searchParams.get('fields')).toBe('synopsis,media_type,num_episodes,main_picture');
    expect(header(calls[0])).toBe('abc123');
    expect(res.map((a) => a.id)).toEqual([21, 459]);
    expect(res[1]!.imageUrl).toBe('https://cdn.myanimelist.net/images/anime/1/1.webp');
  });

  it('defaults limit to 5', async () => {
    const { fetch, calls } = fakeFetch([json(fixture('search'))]);
    await client(fetch).searchAnime('naruto');
    expect(new URL(calls[0]!.url).searchParams.get('limit')).toBe('5');
  });
});

describe('error mapping', () => {
  const cases: [number, string, MalErrorKind][] = [
    [400, '{"message":"Invalid client id","error":"bad_request"}', 'unauthorized'],
    [400, '{"message":"invalid q","error":"bad_request"}', 'invalid_request'],
    [400, 'not json', 'invalid_request'],
    [401, '{"error":"invalid_token"}', 'unauthorized'],
    [403, '{"message":"","error":"forbidden"}', 'forbidden'],
    [404, '{"message":"","error":"not_found"}', 'not_found'],
    [429, '', 'rate_limited'],
    [500, '<html>oops</html>', 'unknown'],
    [418, '{"message":"teapot"}', 'unknown'],
  ];
  it.each(cases)('status %i %s -> %s', async (status, body, kind) => {
    const { fetch } = fakeFetch([() => new Response(body, { status })]);
    const err = await client(fetch)
      .searchAnime('abc')
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MalApiError);
    expect((err as MalApiError).kind).toBe(kind);
    expect((err as MalApiError).status).toBe(status);
  });

  it('maps fetch rejection to network', async () => {
    const f: typeof globalThis.fetch = () => Promise.reject(new TypeError('fetch failed'));
    const err = await client(f)
      .getUserAnimeList('someuser', 'watching')
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MalApiError);
    expect((err as MalApiError).kind).toBe('network');
  });

  it('maps timeout/abort to network', async () => {
    const f: typeof globalThis.fetch = () =>
      Promise.reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    const err = await client(f)
      .searchAnime('abc')
      .catch((e: unknown) => e);
    expect((err as MalApiError).kind).toBe('network');
  });

  it.each(['{"nope":1}', 'not json', '{"data":[{"node":{"id":"x"}}]}'])(
    'maps malformed success body %s to unknown',
    async (body) => {
      const { fetch } = fakeFetch([json(body)]);
      const err = await client(fetch)
        .searchAnime('abc')
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(MalApiError);
      expect((err as MalApiError).kind).toBe('unknown');
    },
  );
});

describe('mapping edge cases', () => {
  it('defaults mediaType, prefers large image, falls back to medium', () => {
    expect(mapAnime({ id: 1, title: 'T' }).mediaType).toBe('unknown');
    expect(
      mapAnime({ id: 1, title: 'T', main_picture: { medium: 'm', large: 'l' } }).imageUrl,
    ).toBe('l');
    expect(mapAnime({ id: 1, title: 'T', main_picture: { medium: 'm' } }).imageUrl).toBe('m');
  });

  it('rejects malformed nodes and statuses', () => {
    expect(() => mapAnime(null)).toThrow(MalApiError);
    expect(() => mapAnime({ id: 1 })).toThrow(MalApiError);
    const node = { id: 1, title: 'T' };
    expect(() =>
      mapListEntry({ node, list_status: { status: 'bogus', num_episodes_watched: 1 } }),
    ).toThrow(MalApiError);
    expect(() => mapListEntry({ node })).toThrow(MalApiError);
    expect(() =>
      mapListEntry({ node, list_status: { status: 'watching', num_episodes_watched: '1' } }),
    ).toThrow(MalApiError);
  });
});
