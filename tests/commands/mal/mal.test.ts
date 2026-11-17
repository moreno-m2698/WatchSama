import { MessageFlags } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { completed } from '../../../src/commands/mal/completed.js';
import { malErrorMessage } from '../../../src/commands/mal/errors.js';
import { search } from '../../../src/commands/mal/search.js';
import { watching } from '../../../src/commands/mal/watching.js';
import type { SlashCommand } from '../../../src/commands/types.js';
import { MalApiError, type MalErrorKind } from '../../../src/mal/errors.js';
import type { Anime, ListEntry } from '../../../src/mal/types.js';

vi.mock('../../../src/ui/paginator.js', () => ({ sendPaginated: vi.fn() }));
vi.mock('../../../src/ui/embeds.js', () => ({
  listEntryEmbed: vi.fn(),
  searchResultEmbed: vi.fn(),
}));
const logError = vi.hoisted(() => vi.fn());
vi.mock('../../../src/log.js', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: logError },
}));

const { sendPaginated } = await import('../../../src/ui/paginator.js');
const { listEntryEmbed, searchResultEmbed } = await import('../../../src/ui/embeds.js');

const sendPaginatedMock = vi.mocked(sendPaginated);

const anime = (id: number): Anime => ({
  id,
  title: `Anime ${id}`,
  url: `https://myanimelist.net/anime/${id}`,
  imageUrl: null,
  mediaType: 'tv',
  synopsis: '',
  totalEpisodes: 12,
});
const entry = (id: number): ListEntry => ({
  anime: anime(id),
  status: 'watching',
  episodesWatched: 1,
});

interface Harness {
  interaction: {
    options: { getString: ReturnType<typeof vi.fn> };
    reply: ReturnType<typeof vi.fn>;
    deferReply: ReturnType<typeof vi.fn>;
    editReply: ReturnType<typeof vi.fn>;
  };
  mal: { getUserAnimeList: ReturnType<typeof vi.fn>; searchAnime: ReturnType<typeof vi.fn> };
  ctx: unknown;
  run(): Promise<void>;
}

function harness(
  command: SlashCommand,
  opts: { username?: string; query?: string; defaultUser?: string },
): Harness {
  const interaction = {
    options: {
      getString: vi.fn((name: string) => (name === 'query' ? opts.query : opts.username) ?? null),
    },
    reply: vi.fn(),
    deferReply: vi.fn(),
    editReply: vi.fn(),
  };
  const mal = { getUserAnimeList: vi.fn(), searchAnime: vi.fn() };
  const emojis = { fake: 'emojis' };
  const ctx = {
    config: { malUsername: opts.defaultUser },
    mal,
    emojis,
    ownerIds: new Set<string>(),
  };
  return {
    interaction,
    mal,
    ctx,
    run: () => command.execute(interaction as never, ctx as never),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('malErrorMessage', () => {
  it('returns null for non-Mal errors', () => {
    expect(malErrorMessage(new Error('x'), 'bob')).toBeNull();
    expect(malErrorMessage('str')).toBeNull();
  });

  const cases: [MalErrorKind, string | undefined, string][] = [
    ['not_found', 'bob', 'MAL user `bob` not found.'],
    ['not_found', undefined, 'Not found on MyAnimeList.'],
    ['forbidden', 'bob', "Couldn't access `bob`'s list. It may be private."],
    ['forbidden', undefined, 'MyAnimeList refused the request.'],
    ['invalid_request', 'bob', 'MyAnimeList rejected that request. Check your input.'],
    ['invalid_request', undefined, 'MyAnimeList rejected that request. Check your input.'],
    ['unauthorized', 'bob', 'The bot is misconfigured (MAL client ID). Please tell the bot owner.'],
    [
      'unauthorized',
      undefined,
      'The bot is misconfigured (MAL client ID). Please tell the bot owner.',
    ],
    ['rate_limited', 'bob', 'MyAnimeList is rate-limiting requests. Try again shortly.'],
    ['rate_limited', undefined, 'MyAnimeList is rate-limiting requests. Try again shortly.'],
    ['network', 'bob', "Couldn't reach MyAnimeList. Try again later."],
    ['network', undefined, "Couldn't reach MyAnimeList. Try again later."],
    ['unknown', 'bob', "Couldn't reach MyAnimeList. Try again later."],
    ['unknown', undefined, "Couldn't reach MyAnimeList. Try again later."],
  ];
  it.each(cases)('%s (username %s)', (kind, username, expected) => {
    expect(malErrorMessage(new MalApiError(kind, 'boom'), username)).toBe(expected);
  });
});

describe.each([
  [
    'watching',
    watching,
    'watching',
    "Here's what bob is watching!",
    "bob isn't watching anything right now.",
  ],
  [
    'completed',
    completed,
    'completed',
    "Here's what bob has completed!",
    "bob hasn't completed anything yet.",
  ],
] as const)('/%s', (name, command, status, heading, empty) => {
  it('has the right command name', () => {
    expect(command.data.name).toBe(name);
  });

  it('prefers the option over the configured default', async () => {
    const h = harness(command, { username: 'bob', defaultUser: 'carol' });
    h.mal.getUserAnimeList.mockResolvedValue([]);
    await h.run();
    expect(h.mal.getUserAnimeList).toHaveBeenCalledWith('bob', status);
  });

  it('falls back to the configured default', async () => {
    const h = harness(command, { defaultUser: 'carol' });
    h.mal.getUserAnimeList.mockResolvedValue([]);
    await h.run();
    expect(h.mal.getUserAnimeList).toHaveBeenCalledWith('carol', status);
  });

  it('replies ephemerally when no username is available', async () => {
    const h = harness(command, {});
    await h.run();
    expect(h.interaction.reply).toHaveBeenCalledWith({
      content: 'No MAL username given and no default is configured.',
      flags: MessageFlags.Ephemeral,
    });
    expect(h.interaction.deferReply).not.toHaveBeenCalled();
    expect(h.mal.getUserAnimeList).not.toHaveBeenCalled();
  });

  it.each(['a', 'has space', 'bad!name', 'x'.repeat(17)])(
    'rejects invalid username %j',
    async (u) => {
      const h = harness(command, { username: u });
      await h.run();
      expect(h.interaction.reply).toHaveBeenCalledWith({
        content: "That doesn't look like a valid MAL username.",
        flags: MessageFlags.Ephemeral,
      });
      expect(h.mal.getUserAnimeList).not.toHaveBeenCalled();
    },
  );

  it('defers publicly', async () => {
    const h = harness(command, { username: 'bob' });
    h.mal.getUserAnimeList.mockResolvedValue([]);
    await h.run();
    expect(h.interaction.deferReply).toHaveBeenCalledWith();
  });

  it('reports an empty list', async () => {
    const h = harness(command, { username: 'bob' });
    h.mal.getUserAnimeList.mockResolvedValue([]);
    await h.run();
    expect(h.interaction.editReply).toHaveBeenCalledWith({ content: empty });
    expect(sendPaginatedMock).not.toHaveBeenCalled();
  });

  it('paginates entries with the heading and a lazy render callback', async () => {
    const entries = [entry(1), entry(2), entry(3)];
    const h = harness(command, { username: 'bob' });
    h.mal.getUserAnimeList.mockResolvedValue(entries);
    await h.run();

    expect(sendPaginatedMock).toHaveBeenCalledTimes(1);
    const call = sendPaginatedMock.mock.calls[0];
    expect(call?.[0]).toBe(h.interaction);
    expect(call?.[1]).toBe(3);
    expect(call?.[3]).toEqual({ content: heading });

    expect(listEntryEmbed).not.toHaveBeenCalled();
    call?.[2](1);
    expect(listEntryEmbed).toHaveBeenCalledWith(entries[1], (h.ctx as { emojis: unknown }).emojis, {
      index: 1,
      count: 3,
    });
  });

  it('maps MalApiError to a message with the username', async () => {
    const h = harness(command, { username: 'bob' });
    h.mal.getUserAnimeList.mockRejectedValue(new MalApiError('not_found', 'nf', 404));
    await h.run();
    expect(h.interaction.editReply).toHaveBeenCalledWith({ content: 'MAL user `bob` not found.' });
    expect(logError).not.toHaveBeenCalled();
  });

  it('logs unauthorized errors', async () => {
    const h = harness(command, { username: 'bob' });
    h.mal.getUserAnimeList.mockRejectedValue(new MalApiError('unauthorized', 'no', 401));
    await h.run();
    expect(logError).toHaveBeenCalled();
    expect(h.interaction.editReply).toHaveBeenCalledWith({
      content: 'The bot is misconfigured (MAL client ID). Please tell the bot owner.',
    });
  });

  it('rethrows non-Mal errors', async () => {
    const h = harness(command, { username: 'bob' });
    const err = new Error('kaboom');
    h.mal.getUserAnimeList.mockRejectedValue(err);
    await expect(h.run()).rejects.toBe(err);
    expect(h.interaction.editReply).not.toHaveBeenCalled();
  });
});

describe('/search', () => {
  it('rejects queries that are too short after trimming', async () => {
    const h = harness(search, { query: '  ab  ' });
    await h.run();
    expect(h.interaction.reply).toHaveBeenCalledWith({
      content: 'Your search needs at least 3 characters.',
      flags: MessageFlags.Ephemeral,
    });
    expect(h.interaction.deferReply).not.toHaveBeenCalled();
    expect(h.mal.searchAnime).not.toHaveBeenCalled();
  });

  it('defers ephemerally and searches with the trimmed query', async () => {
    const h = harness(search, { query: '  naruto ' });
    h.mal.searchAnime.mockResolvedValue([]);
    await h.run();
    expect(h.interaction.deferReply).toHaveBeenCalledWith({ flags: MessageFlags.Ephemeral });
    expect(h.mal.searchAnime).toHaveBeenCalledWith('naruto');
  });

  it('reports no results', async () => {
    const h = harness(search, { query: 'naruto' });
    h.mal.searchAnime.mockResolvedValue([]);
    await h.run();
    expect(h.interaction.editReply).toHaveBeenCalledWith({ content: 'No results for `naruto`.' });
    expect(sendPaginatedMock).not.toHaveBeenCalled();
  });

  it('paginates results', async () => {
    const results = [anime(1), anime(2)];
    const h = harness(search, { query: 'naruto' });
    h.mal.searchAnime.mockResolvedValue(results);
    await h.run();

    const call = sendPaginatedMock.mock.calls[0];
    expect(call?.[1]).toBe(2);
    expect(call?.[3]).toEqual({ content: 'Here are some entries that might fit your search:' });
    call?.[2](0);
    expect(searchResultEmbed).toHaveBeenCalledWith(results[0], { index: 0, count: 2 });
  });

  it('maps MalApiError without a username', async () => {
    const h = harness(search, { query: 'naruto' });
    h.mal.searchAnime.mockRejectedValue(new MalApiError('invalid_request', 'bad', 400));
    await h.run();
    expect(h.interaction.editReply).toHaveBeenCalledWith({
      content: 'MyAnimeList rejected that request. Check your input.',
    });
  });

  it('rethrows non-Mal errors', async () => {
    const h = harness(search, { query: 'naruto' });
    const err = new TypeError('kaboom');
    h.mal.searchAnime.mockRejectedValue(err);
    await expect(h.run()).rejects.toBe(err);
  });
});
