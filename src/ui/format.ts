import type { ListStatus } from '../mal/types.js';

/** Truncate to at most `max` characters, ending with '…' when cut. */
export function truncate(_s: string, _max: number): string {
  throw new Error('not implemented');
}

/** 'tv' -> 'TV', 'ova' -> 'OVA', 'tv_special' -> 'TV Special', otherwise Title Case. */
export function formatMediaType(_mediaType: string): string {
  throw new Error('not implemented');
}

/** 'plan_to_watch' -> 'Plan to Watch', etc. */
export function formatStatus(_status: ListStatus): string {
  throw new Error('not implemented');
}
