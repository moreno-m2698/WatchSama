import { describe, expect, it } from 'vitest';
import type { ListStatus } from '../../src/mal/types.js';
import { formatMediaType, formatStatus, truncate } from '../../src/ui/format.js';

describe('truncate', () => {
  it('leaves short strings alone', () => {
    expect(truncate('abc', 5)).toBe('abc');
    expect(truncate('abcde', 5)).toBe('abcde');
  });
  it('cuts with an ellipsis within max', () => {
    expect(truncate('abcdef', 5)).toBe('abcd…');
    expect(truncate('x'.repeat(2000), 1024)).toHaveLength(1024);
  });
  it('handles tiny max and empty input', () => {
    expect(truncate('abc', 1)).toBe('…');
    expect(truncate('abc', 0)).toBe('');
    expect(truncate('', 5)).toBe('');
  });
});

describe('formatMediaType', () => {
  it.each([
    ['tv', 'TV'],
    ['ova', 'OVA'],
    ['ona', 'ONA'],
    ['tv_special', 'TV Special'],
    ['movie', 'Movie'],
    ['special', 'Special'],
    ['music', 'Music'],
    ['unknown', 'Unknown'],
    ['cm', 'Cm'],
    ['some_new_type', 'Some New Type'],
  ])('%s -> %s', (input, out) => {
    expect(formatMediaType(input)).toBe(out);
  });
});

describe('formatStatus', () => {
  it.each<[ListStatus, string]>([
    ['watching', 'Watching'],
    ['completed', 'Completed'],
    ['on_hold', 'On Hold'],
    ['dropped', 'Dropped'],
    ['plan_to_watch', 'Plan to Watch'],
  ])('%s -> %s', (input, out) => {
    expect(formatStatus(input)).toBe(out);
  });
});
