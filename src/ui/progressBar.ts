/** Ready-to-render emoji strings, e.g. "<:ws_empty_mid:123>". */
export interface ProgressEmojis {
  emptyMid: string;
  emptyEnd: string;
  filledStart: string;
  filledMid: string;
  heartStart: string;
  heartMid: string;
  heartEnd: string;
}

/** Unicode set used if application emojis are missing. */
export const UNICODE_FALLBACK: ProgressEmojis = {
  emptyMid: '▱',
  emptyEnd: '▱',
  filledStart: '▰',
  filledMid: '▰',
  heartStart: '♥',
  heartMid: '♥',
  heartEnd: '♥',
};

/** Render the 11-emoji bar followed by `  {watched} / {total ?? '?'}`. */
export function renderProgressBar(
  _watched: number,
  _total: number | null,
  _e: ProgressEmojis,
): string {
  throw new Error('not implemented');
}
