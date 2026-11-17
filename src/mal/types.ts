/** MAL anime list status values (API `list_status.status`). */
export type ListStatus = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';

/** An anime as returned by the MAL API, mapped to the domain. */
export interface Anime {
  id: number;
  title: string;
  /** https://myanimelist.net/anime/{id} */
  url: string;
  /** main_picture.large ?? main_picture.medium ?? null */
  imageUrl: string | null;
  /** Raw API value: tv | movie | ova | ona | special | tv_special | music | unknown */
  mediaType: string;
  /** '' if absent */
  synopsis: string;
  /** num_episodes; 0 maps to null (unknown) */
  totalEpisodes: number | null;
}

/** One row of a user's anime list. */
export interface ListEntry {
  anime: Anime;
  status: ListStatus;
  episodesWatched: number;
}

/** Read-only MAL API v2 client. */
export interface MalClient {
  /** Up to `limit` entries (default 100), sorted by list_updated_at, following paging.next as needed. */
  getUserAnimeList(
    username: string,
    status: ListStatus,
    opts?: { limit?: number },
  ): Promise<ListEntry[]>;
  /** `query` must be >=3 chars (MAL rejects shorter with "invalid q"). Default limit 5. */
  searchAnime(query: string, opts?: { limit?: number }): Promise<Anime[]>;
}
