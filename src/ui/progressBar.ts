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
  watched: number,
  total: number | null,
  e: ProgressEmojis,
): string {
  if (total === null || total <= 0) {
    return `${e.heartStart}${e.emptyMid.repeat(9)}${e.emptyEnd}  ${watched} / ?`;
  }
  const clamped = Math.min(Math.max(watched, 0), total);
  const k = Math.floor((clamped * 10) / total);

  let bar: string;
  if (clamped >= total) {
    bar = e.filledStart + e.filledMid.repeat(9) + e.heartEnd;
  } else if (k === 0) {
    bar = e.heartStart + e.emptyMid.repeat(9) + e.emptyEnd;
  } else {
    bar =
      e.filledStart +
      e.filledMid.repeat(k - 1) +
      e.heartMid +
      e.emptyMid.repeat(9 - k) +
      e.emptyEnd;
  }
  return `${bar}  ${watched} / ${total}`;
}
