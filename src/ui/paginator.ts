import type {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';

/** Options for sendPaginated. */
export interface PaginateOptions {
  content?: string;
  /** Default 180_000 */
  timeoutMs?: number;
}

/** Next page index with wrap-around; dir is -1 (prev) or 1 (next). */
export function nextIndex(_current: number, _count: number, _dir: -1 | 1): number {
  throw new Error('not implemented');
}

/** Row with ◀ (`page:prev`) and ▶ (`page:next`) buttons. */
export function buildRow(_disabled: boolean): ActionRowBuilder<ButtonBuilder> {
  throw new Error('not implemented');
}

/** Interaction must already be deferred. Builds pages lazily via `render(i)`. Throws if count is 0. */
export function sendPaginated(
  _interaction: ChatInputCommandInteraction,
  _count: number,
  _render: (index: number) => EmbedBuilder,
  _opts?: PaginateOptions,
): Promise<void> {
  return Promise.reject(new Error('not implemented'));
}
