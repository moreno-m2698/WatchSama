import { describe, expect, it } from 'vitest';
import type { Anime, ListEntry } from '../../src/mal/types.js';
import { listEntryEmbed, searchResultEmbed } from '../../src/ui/embeds.js';
import type { ProgressEmojis } from '../../src/ui/progressBar.js';
import { BRAND_COLOR, baseEmbed } from '../../src/ui/theme.js';

const E: ProgressEmojis = {
  emptyMid: 'a',
  emptyEnd: 'b',
  filledStart: 'c',
  filledMid: 'd',
  heartStart: 'e',
  heartMid: 'f',
  heartEnd: 'g',
};

const anime: Anime = {
  id: 1,
  title: 'Cowboy Bebop',
  url: 'https://myanimelist.net/anime/1',
  imageUrl: 'https://cdn.example/1l.jpg',
  mediaType: 'tv',
  synopsis: 'In the year 2071...',
  totalEpisodes: 26,
};

describe('baseEmbed', () => {
  it('has brand colour and author', () => {
    const json = baseEmbed().toJSON();
    expect(json.color).toBe(BRAND_COLOR);
    expect(json.author?.name).toBe('WatchSama');
  });
});

describe('listEntryEmbed', () => {
  it('watching entry has Progress, Type, Watch status in order', () => {
    const json = listEntryEmbed({ anime, status: 'watching', episodesWatched: 13 }, E, {
      index: 0,
      count: 3,
    }).toJSON();
    expect(json.title).toBe('Cowboy Bebop');
    expect(json.url).toBe(anime.url);
    expect(json.image?.url).toBe(anime.imageUrl);
    expect(json.description).toBe('In the year 2071...');
    expect(json.footer?.text).toBe('Entry 1 / 3');
    expect(json.fields).toEqual([
      { name: 'Progress', value: 'cddddfaaaab  13 / 26' },
      { name: 'Type', value: 'TV', inline: true },
      { name: 'Watch status', value: 'Watching', inline: true },
    ]);
  });

  it('non-watching entry omits Progress', () => {
    const entry: ListEntry = { anime, status: 'plan_to_watch', episodesWatched: 0 };
    const json = listEntryEmbed(entry, E, { index: 2, count: 3 }).toJSON();
    expect(json.fields?.map((f) => f.name)).toEqual(['Type', 'Watch status']);
    expect(json.fields?.[1]?.value).toBe('Plan to Watch');
    expect(json.footer?.text).toBe('Entry 3 / 3');
  });

  it('omits image and description when absent; unknown total shows ?', () => {
    const bare: Anime = { ...anime, imageUrl: null, synopsis: '', totalEpisodes: null };
    const json = listEntryEmbed({ anime: bare, status: 'watching', episodesWatched: 5 }, E, {
      index: 0,
      count: 1,
    }).toJSON();
    expect(json.image).toBeUndefined();
    expect(json.description).toBeUndefined();
    expect(json.fields?.[0]?.value.endsWith('  5 / ?')).toBe(true);
  });

  it('truncates long title and synopsis', () => {
    const long: Anime = { ...anime, title: 't'.repeat(300), synopsis: 's'.repeat(3000) };
    const json = listEntryEmbed({ anime: long, status: 'completed', episodesWatched: 26 }, E, {
      index: 0,
      count: 1,
    }).toJSON();
    expect(json.title).toHaveLength(256);
    expect(json.title?.endsWith('…')).toBe(true);
    expect(json.description).toHaveLength(1024);
    expect(json.description?.endsWith('…')).toBe(true);
  });
});

describe('searchResultEmbed', () => {
  it('has Type and Episodes fields and Result footer', () => {
    const json = searchResultEmbed(anime, { index: 1, count: 5 }).toJSON();
    expect(json.title).toBe('Cowboy Bebop');
    expect(json.url).toBe(anime.url);
    expect(json.image?.url).toBe(anime.imageUrl);
    expect(json.fields).toEqual([
      { name: 'Type', value: 'TV', inline: true },
      { name: 'Episodes', value: '26', inline: true },
    ]);
    expect(json.footer?.text).toBe('Result 2 / 5');
  });

  it('shows ? for unknown episodes, no image, truncated synopsis', () => {
    const a: Anime = { ...anime, totalEpisodes: null, imageUrl: null, synopsis: 'x'.repeat(2000) };
    const json = searchResultEmbed(a, { index: 0, count: 1 }).toJSON();
    expect(json.fields?.[1]?.value).toBe('?');
    expect(json.image).toBeUndefined();
    expect(json.description).toHaveLength(1024);
  });
});
