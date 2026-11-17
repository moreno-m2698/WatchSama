import type { Config } from '../config.js';
import type { MalClient } from '../mal/types.js';
import type { ProgressEmojis } from '../ui/progressBar.js';

/** Shared mutable context created in index.ts; `emojis` and `ownerIds` are filled on `ready`. */
export interface BotContext {
  config: Config;
  mal: MalClient;
  emojis: ProgressEmojis;
  ownerIds: Set<string>;
}
