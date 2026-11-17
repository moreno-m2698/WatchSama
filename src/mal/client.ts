import type { MalClient } from './types.js';

/** Options for createMalClient. `fetch` is injectable for tests. */
export interface MalClientOptions {
  clientId: string;
  fetch?: typeof globalThis.fetch;
  /** Default 'https://api.myanimelist.net/v2' */
  baseUrl?: string;
}

/** Create a MAL API v2 client. */
export function createMalClient(_opts: MalClientOptions): MalClient {
  throw new Error('not implemented');
}
