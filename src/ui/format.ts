import type { ListStatus } from '../mal/types.js';

/** Truncate to at most `max` characters, ending with '…' when cut. */
export function truncate(s: string, max: number): string {
  if (max <= 0) return '';
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

const MEDIA_TYPES: Record<string, string> = {
  tv: 'TV',
  ova: 'OVA',
  ona: 'ONA',
  tv_special: 'TV Special',
  movie: 'Movie',
  special: 'Special',
  music: 'Music',
  unknown: 'Unknown',
};

/** 'tv' -> 'TV', 'ova' -> 'OVA', 'tv_special' -> 'TV Special', otherwise Title Case. */
export function formatMediaType(mediaType: string): string {
  const known = MEDIA_TYPES[mediaType];
  if (known !== undefined) return known;
  return mediaType
    .split('_')
    .filter((w) => w !== '')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const STATUSES: Record<ListStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  on_hold: 'On Hold',
  dropped: 'Dropped',
  plan_to_watch: 'Plan to Watch',
};

/** 'plan_to_watch' -> 'Plan to Watch', etc. */
export function formatStatus(status: ListStatus): string {
  return STATUSES[status];
}
