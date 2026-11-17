import type { Client } from 'discord.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMOJI_ASSETS, missingEmojis } from '../../scripts/upload-emojis.js';
import { EMOJI_TABLE, loadProgressEmojis } from '../../src/ui/emojis.js';
import { UNICODE_FALLBACK } from '../../src/ui/progressBar.js';

function fakeClient(fetch: () => Promise<Map<string, { name: string; toString(): string }>>) {
  return { application: { emojis: { fetch } } } as unknown as Client<true>;
}

function emojiMap(names: string[]): Map<string, { name: string; toString(): string }> {
  return new Map(
    names.map((name, i) => [String(i), { name, toString: () => `<:${name}:${i}>` }] as const),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadProgressEmojis', () => {
  it('maps all seven emojis', async () => {
    const names = EMOJI_TABLE.map((r) => r.name);
    const client = fakeClient(() => Promise.resolve(emojiMap([...names, 'other'])));
    const result = await loadProgressEmojis(client);
    expect(result.emptyMid).toBe('<:ws_empty_mid:0>');
    expect(result.heartEnd).toBe('<:ws_heart_end:6>');
    expect(Object.keys(result).sort()).toEqual(Object.keys(UNICODE_FALLBACK).sort());
  });

  it('falls back with a warning when some are missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const client = fakeClient(() => Promise.resolve(emojiMap(['ws_empty_mid', 'ws_heart_end'])));
    expect(await loadProgressEmojis(client)).toBe(UNICODE_FALLBACK);
    expect(warn).toHaveBeenCalledTimes(1);
    const msg = String(warn.mock.calls[0]?.join(' '));
    expect(msg).toContain('ws_filled_start');
    expect(msg).not.toContain('ws_empty_mid,');
    expect(msg).toContain('pnpm emojis:upload');
  });

  it('falls back with a warning when fetch rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const client = fakeClient(() => Promise.reject(new Error('boom')));
    expect(await loadProgressEmojis(client)).toBe(UNICODE_FALLBACK);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('upload helpers', () => {
  it('table has the seven name/file pairs', () => {
    expect(EMOJI_ASSETS).toHaveLength(7);
    expect(EMOJI_ASSETS).toContainEqual({ name: 'ws_empty_mid', file: 'Empty_Bar_1.png' });
    expect(EMOJI_ASSETS).toContainEqual({ name: 'ws_heart_end', file: 'Heart_Bar_3.png' });
    for (const a of EMOJI_ASSETS) expect(a.name).toMatch(/^[A-Za-z0-9_]{2,32}$/);
  });

  it('diff returns all when none exist, none when all exist, rest otherwise', () => {
    expect(missingEmojis([])).toEqual(EMOJI_ASSETS);
    expect(missingEmojis(EMOJI_ASSETS.map((a) => a.name))).toEqual([]);
    const partial = missingEmojis(['ws_empty_mid', 'unrelated']);
    expect(partial).toHaveLength(6);
    expect(partial.map((p) => p.name)).not.toContain('ws_empty_mid');
  });
});
