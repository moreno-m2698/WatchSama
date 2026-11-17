import { describe, expect, it } from 'vitest';
import { renderProgressBar, type ProgressEmojis } from '../../src/ui/progressBar.js';

const E: ProgressEmojis = {
  emptyMid: 'a',
  emptyEnd: 'b',
  filledStart: 'c',
  filledMid: 'd',
  heartStart: 'e',
  heartMid: 'f',
  heartEnd: 'g',
};

const barOf = (s: string): string => s.split('  ')[0] ?? '';

describe('renderProgressBar', () => {
  it('k = 0', () => {
    expect(renderProgressBar(0, 100, E)).toBe('eaaaaaaaaab  0 / 100');
    expect(renderProgressBar(9, 100, E)).toBe('eaaaaaaaaab  9 / 100');
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('k = %i', (k) => {
    const out = renderProgressBar(k * 10, 100, E);
    expect(out).toBe(`c${'d'.repeat(k - 1)}f${'a'.repeat(9 - k)}b  ${k * 10} / 100`);
    expect(barOf(out)).toHaveLength(11);
  });

  it('k = 10 (complete)', () => {
    expect(renderProgressBar(100, 100, E)).toBe('cdddddddddg  100 / 100');
  });

  it('keeps both digits for 12 / 12', () => {
    expect(renderProgressBar(12, 12, E)).toBe('cdddddddddg  12 / 12');
  });

  it('0/12 and 1/12', () => {
    expect(renderProgressBar(0, 12, E)).toBe('eaaaaaaaaab  0 / 12');
    expect(renderProgressBar(1, 12, E)).toBe('eaaaaaaaaab  1 / 12');
  });

  it('clamps over-watched bar but shows the real number', () => {
    expect(renderProgressBar(13, 12, E)).toBe('cdddddddddg  13 / 12');
  });

  it('clamps negative watched', () => {
    expect(barOf(renderProgressBar(-3, 12, E))).toBe('eaaaaaaaaab');
  });

  it('unknown total renders k = 0 with ?', () => {
    expect(renderProgressBar(5, null, E)).toBe('eaaaaaaaaab  5 / ?');
    expect(renderProgressBar(5, 0, E)).toBe('eaaaaaaaaab  5 / ?');
  });

  it('is always 11 emojis for every watched value', () => {
    for (let w = 0; w <= 30; w++) {
      expect(barOf(renderProgressBar(w, 24, E))).toHaveLength(11);
    }
  });
});
