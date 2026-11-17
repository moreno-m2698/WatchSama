# WatchSama Refactor Plan: Python/discord.py/Selenium → TypeScript/discord.js/MAL API v2

Branch: `refactor`. Status: **awaiting owner review**.

## 1. Decisions (locked)

| Topic | Decision |
|---|---|
| Language / library | TypeScript + **discord.js 14.28.x** (Python, discord.py and Selenium are removed) |
| Runtime model | Long-running **gateway** bot started from a terminal (`pnpm start`). No hosting or CI/CD in scope. |
| Web interaction | **Official MAL API v2** (`https://api.myanimelist.net/v2`, header `X-MAL-CLIENT-ID`). No browser, no scraping. |
| Scope | Feature parity, plus an optional `username` argument on list commands (defaults to `MAL_USERNAME`) |
| Commands | **Slash commands only**. No privileged intents. The `!` prefix and the custom help command are dropped. |
| Progress-bar emojis | **Application emojis** uploaded from `assets/progress_bar_emojis/` by a script |
| General commands | `/ping`, `/info`, `/serverinfo`, `/userinfo` (no presence "Status" field), `/stop` (app owner only) |
| Toolchain | Node **24** (active LTS; installed locally as v24.22), pnpm, TypeScript **~6.0.3**, Vitest, ESLint + typescript-eslint, Prettier |
| Old code | The Python code is deleted after parity (it stays in git history and on `main`) |

> Version notes, checked 2026-11-17:
> - typescript-eslint 8.73 declares `typescript >=4.8.4 <6.1.0`, so **do not use TypeScript 7**.
> - Node 22 is in maintenance until 2027-04, so the project targets Node 24 (`engines.node: ">=24"`, `.nvmrc` = `24`).

## 2. How the current app behaves (reference for parity)

| Python (today) | What it does | Replacement |
|---|---|---|
| `MAL_Controller.go_To_Anime_List` + `get_Anime_List_WebElements` | Load `myanimelist.net/animelist/{user}?status=N` in Chrome and scrape `.list-item` rows | `GET /v2/users/{user}/animelist` |
| `SeleniumRawData._get_Title/_Entry_URL/_Status/_Image_Src/_Media` | Title, entry URL, status class, cover image, media type | `node.title`, `https://myanimelist.net/anime/{node.id}`, `list_status.status`, `node.main_picture.large ?? medium`, `node.media_type` |
| `ExtendedSeleniumRawData._get_Progress` | Watched / total episodes. **Bug:** keeps only the first digit; `-` crashes | `list_status.num_episodes_watched`, `node.num_episodes` (`0` = unknown) |
| `SeleniumRawData.get_Description` | Opens every entry page to scrape the synopsis (one page load per embed) | `fields=synopsis` on the same list request, so no extra calls |
| `SeleniumSearchData.create_Anime_List` + `MAL_Controller.search_MAL` | Load the search page, `sleep(5)`, return the first 5 URLs | `GET /v2/anime?q=…&limit=5` with rich fields |
| `MAL_Controller.selenium_Account_Login`, `press_Entry_Edit_Button` | Unused (and login hits reCAPTCHA) | Not ported. Future list editing would use MAL OAuth2 (out of scope). |
| `ExtendedEmbed.progress_bar` | 11-emoji bar with a heart marker | `renderProgressBar()` (algorithm in §5.2) |
| `MALView` ◀ / More / ▶ | Cycle 5 embeds; "More" re-runs Selenium for the next 5 | One fetch, then ◀ ▶ paginate across all entries. **The "More" button is removed** (it only existed to batch slow Selenium fetches). |
| View `on_timeout` | Disable buttons. **Bug:** `self.message` is never set. | Collector `end` → edit the reply with disabled buttons |
| `!stop` | Anyone can shut the bot down | `/stop` restricted to the application owner |
| `on_ready` | Post "WatchSama is running" in the DEV_GUILD's first text channel; set presence idle | Same, but post to the first channel the bot can send to |
| `on_guild_join` | Post a welcome embed in the first text channel | Same, preferring `guild.systemChannel` |

## 3. Environment variables

Read from `process.env`. Locally they are loaded via `node --env-file-if-exists=.env`; real env vars take precedence.

| Name | Required | Used for | In GH `prod` today? |
|---|---|---|---|
| `BOT_TOKEN` | yes | Login, REST scripts | ✅ |
| `DISCORD_APPLICATION_ID` | yes | Command deploy, emoji upload | ✅ |
| `MAL_CLIENT_ID` | yes | MAL API header | ✅ |
| `MAL_USERNAME` | no | Default user for `/watching` and `/completed` | ❌ |
| `DEV_GUILD` | no | Guild-scoped command deploy and startup message | ❌ |
| `PUBLIC_KEY` | no | **Unused** (only needed for HTTP interactions). Kept in prod for future use. | ✅ |

Validate with **zod** in `src/config.ts`. Fail fast with a readable message that lists the missing or invalid keys. `DEV_GUILD` must be a snowflake (`/^\d{17,20}$/`) if present.

## 4. Target layout

```
.gitignore              (tracked again: node_modules, dist, coverage, .env, *.log)
.nvmrc                  24
.env.example
package.json            type: module, engines.node >=24, packageManager pnpm
pnpm-lock.yaml
tsconfig.json           module/moduleResolution nodenext, target es2024, strict,
                        noUncheckedIndexedAccess, verbatimModuleSyntax, outDir dist
eslint.config.js        flat config, typescript-eslint recommendedTypeChecked
.prettierrc
vitest.config.ts
assets/progress_bar_emojis/*.png        (kept)
scripts/deploy-commands.ts              pnpm commands:deploy [--guild]
scripts/upload-emojis.ts                pnpm emojis:upload
src/index.ts                            entry: config → client → handlers → login
src/config.ts
src/log.ts                              tiny leveled console logger (info/warn/error/debug)
src/bot/client.ts                       createClient(): Client with GatewayIntentBits.Guilds only
src/bot/context.ts                      BotContext type
src/bot/registry.ts                     the list of all SlashCommands, plus a lookup by name
src/bot/router.ts                       interactionCreate → command.execute, uniform error reply
src/bot/events/ready.ts
src/bot/events/guildCreate.ts
src/commands/types.ts                   SlashCommand interface
src/commands/general/{ping,info,serverinfo,userinfo,stop}.ts
src/commands/mal/{watching,completed,search}.ts
src/commands/mal/listCommand.ts         shared builder for watching/completed
src/mal/types.ts                        domain types + MalClient interface
src/mal/errors.ts                       MalApiError
src/mal/client.ts                       createMalClient()
src/mal/mapping.ts                      raw API JSON → domain types
src/ui/theme.ts                         brand colour #FFB7C5, baseEmbed()
src/ui/embeds.ts                        listEntryEmbed(), searchResultEmbed()
src/ui/format.ts                        truncate(), formatMediaType(), formatStatus()
src/ui/progressBar.ts
src/ui/emojis.ts                        loadProgressEmojis(client)
src/ui/paginator.ts                     sendPaginated()
tests/**                                mirrors src/, plus tests/fixtures/mal/*.json
```

Imports use the `.js` extension (nodenext ESM).

**package.json scripts:**
- `dev`: `tsx watch --env-file-if-exists=.env src/index.ts`
- `build`: `tsc -p tsconfig.json`
- `start`: `node --env-file-if-exists=.env dist/index.js`
- `typecheck`: `tsc --noEmit`
- `lint`, `format`, `test`: `vitest run`
- `commands:deploy`, `emojis:upload`: run via tsx with the same env-file flag

## 5. Contracts (written in Phase 0; everything else codes against these)

### 5.1 MAL domain (`src/mal/types.ts`, `src/mal/errors.ts`)

```ts
export type ListStatus = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';

export interface Anime {
  id: number;
  title: string;
  url: string;                 // https://myanimelist.net/anime/{id}
  imageUrl: string | null;     // main_picture.large ?? main_picture.medium ?? null
  mediaType: string;           // raw API value: tv | movie | ova | ona | special | tv_special | music | unknown
  synopsis: string;            // '' if absent
  totalEpisodes: number | null; // num_episodes; 0 → null (unknown)
}

export interface ListEntry {
  anime: Anime;
  status: ListStatus;
  episodesWatched: number;
}

export interface MalClient {
  /** Up to `limit` entries (default 100), sorted by list_updated_at, following paging.next as needed. */
  getUserAnimeList(username: string, status: ListStatus, opts?: { limit?: number }): Promise<ListEntry[]>;
  /** `query` must be ≥3 chars (MAL rejects shorter with "invalid q"). Default limit 5. */
  searchAnime(query: string, opts?: { limit?: number }): Promise<Anime[]>;
}

export type MalErrorKind =
  | 'not_found' | 'forbidden' | 'invalid_request' | 'unauthorized'
  | 'rate_limited' | 'network' | 'unknown';

export class MalApiError extends Error {
  constructor(public readonly kind: MalErrorKind, message: string, public readonly status?: number) { super(message); }
}
```

### 5.2 UI (`src/ui/progressBar.ts`, `src/ui/emojis.ts`, `src/ui/embeds.ts`, `src/ui/paginator.ts`)

```ts
export interface ProgressEmojis {   // values are ready-to-render strings, e.g. "<:ws_empty_mid:123>"
  emptyMid: string; emptyEnd: string;
  filledStart: string; filledMid: string;
  heartStart: string; heartMid: string; heartEnd: string;
}
export const UNICODE_FALLBACK: ProgressEmojis; // used if app emojis are missing
export function renderProgressBar(watched: number, total: number | null, e: ProgressEmojis): string;

export async function loadProgressEmojis(client: Client<true>): Promise<ProgressEmojis>;

export function listEntryEmbed(entry: ListEntry, e: ProgressEmojis, position: { index: number; count: number }): EmbedBuilder;
export function searchResultEmbed(anime: Anime, position: { index: number; count: number }): EmbedBuilder;

export interface PaginateOptions { content?: string; timeoutMs?: number /* default 180_000 */; }
/** Interaction must already be deferred. Builds pages lazily via `render(i)`. */
export async function sendPaginated(
  interaction: ChatInputCommandInteraction, count: number,
  render: (index: number) => EmbedBuilder, opts?: PaginateOptions): Promise<void>;
```

### 5.3 Commands (`src/commands/types.ts`, `src/bot/context.ts`)

```ts
export interface BotContext { config: Config; mal: MalClient; emojis: ProgressEmojis; ownerIds: Set<string>; }
export interface SlashCommand {
  data: SharedSlashCommand;   // from discord.js; SlashCommandBuilder output
  execute(interaction: ChatInputCommandInteraction, ctx: BotContext): Promise<void>;
}
```

`ctx.emojis` and `ctx.ownerIds` are filled in on `ready`. `ctx` is a single mutable object created in `index.ts`.

## 6. Behaviour specs

### 6.1 MAL client (`src/mal/client.ts`)
- `createMalClient({ clientId, fetch = globalThis.fetch, baseUrl = 'https://api.myanimelist.net/v2' })`. The injectable `fetch` is for tests.
- **List request:** `GET /users/{encodeURIComponent(user)}/animelist?status=…&sort=list_updated_at&limit=min(limit,100)&fields=list_status,num_episodes,media_type,synopsis,main_picture`. Follow `paging.next` until `limit` is reached or there is no next page.
- **Search request:** `GET /anime?q=…&limit=…&fields=synopsis,media_type,num_episodes,main_picture`. Build the query with `URLSearchParams` (the old code hand-joined with `%20`).
- **Request options:** header `X-MAL-CLIENT-ID`, `signal: AbortSignal.timeout(10_000)`.
- **Error mapping** to `MalApiError`. Error bodies are JSON `{"message": string, "error": string}` (`message` may be `""`). Status codes were **verified live on 2026-11-17** unless marked otherwise.

  | Response | Kind | Verified example |
  |---|---|---|
  | 400 and `message === "Invalid client id"` | `unauthorized` | Bad or garbled `MAL_CLIENT_ID` → `{"message":"Invalid client id","error":"bad_request"}` |
  | 400 (anything else) | `invalid_request` | `q` < 3 chars → `{"message":"invalid q","error":"bad_request"}`; bad status or limit > 1000 → `bad_request` |
  | 401 | `unauthorized` | `/users/@me` without OAuth → `{"error":"invalid_token"}` (not used by us) |
  | 403 | `forbidden` | Missing header → `{"message":"","error":"forbidden"}`. Config validation guarantees the header, so in practice this means a private list. *(Private-list status is unverified: no known private account to test.)* |
  | 404 | `not_found` | Unknown user → `{"message":"","error":"not_found"}` |
  | 429 | `rate_limited` | (not verified) |
  | fetch throw / timeout | `network` | |
  | anything else | `unknown` | |

- **Other verified facts:**
  - Airing shows return `num_episodes: 0` (e.g. One Piece), which maps to `null`.
  - Image URLs may be `.jpg` or `.webp`.
  - `list_status` may also contain `start_date` / `finish_date`.
  - `paging.next` is a full absolute URL.
  - Animelist `limit` max is 1000 (1001 → 400).
  - Fields not listed in `fields=` are omitted (search without `fields` returns only `id`, `title`, `main_picture`).
- **Test fixtures** (`tests/fixtures/mal/`) copy these **real** response shapes, captured 2026-11-17 and trimmed:
  ```json
  {"data":[{"node":{"id":16498,"title":"Shingeki no Kyojin",
     "main_picture":{"medium":"https://cdn.myanimelist.net/images/anime/10/47347.webp","large":"https://cdn.myanimelist.net/images/anime/10/47347l.webp"},
     "num_episodes":25,"media_type":"tv","synopsis":"Centuries ago, mankind was slaughtered…"},
    "list_status":{"status":"completed","score":0,"num_episodes_watched":25,"is_rewatching":false,"updated_at":"2023-09-29T23:10:52+00:00"}}],
   "paging":{"next":"https://api.myanimelist.net/v2/users/someuser/animelist?offset=1&status=completed&sort=list_updated_at&limit=1&fields=list_status%2Cnum_episodes%2Cmedia_type%2Csynopsis%2Cmain_picture"}}
  ```
  ```json
  {"data":[{"node":{"id":21,"title":"One Piece",
     "main_picture":{"medium":"https://cdn.myanimelist.net/images/anime/1244/138851.jpg","large":"https://cdn.myanimelist.net/images/anime/1244/138851l.jpg"},
     "synopsis":"Barely surviving in a barrel…","media_type":"tv","num_episodes":0}}],
   "paging":{"next":"https://api.myanimelist.net/v2/anime?offset=1&q=one+piece&limit=1&fields=synopsis%2Cmedia_type%2Cnum_episodes%2Cmain_picture"}}
  ```
  The second example is a search response, which has no `list_status`. The last page has `"paging":{}`, with no `next`.

### 6.2 Progress bar (port of `Embeds.py` `ExtendedEmbed.progress_bar`)
- The bar is always 11 emojis, followed by `  {watched} / {total ?? '?'}`.
- `k = Math.floor((watched * 10) / total)`. Use integer arithmetic, not float ratios. Clamp `watched` to `[0, total]`.
  - watched ≥ total: `filledStart + filledMid×9 + heartEnd`
  - k = 0: `heartStart + emptyMid×9 + emptyEnd`
  - 1 ≤ k ≤ 9: `filledStart + filledMid×(k−1) + heartMid + emptyMid×(9−k) + emptyEnd`
- If `total` is null or 0 (unknown), render the k = 0 bar with `?` as the total.

**Emoji mapping.** The old IDs were e1 / e2 / f1 / f2 / h1 / h2 / h3. Emoji names must be 2–32 characters, `[A-Za-z0-9_]`.

| Asset | Key | App emoji name |
|---|---|---|
| Empty_Bar_1.png | emptyMid | `ws_empty_mid` |
| Empty_Bar_2.png | emptyEnd | `ws_empty_end` |
| Filled_Bar_1.png | filledStart | `ws_filled_start` |
| Filled_Bar_2.png | filledMid | `ws_filled_mid` |
| Heart_Bar_1.png | heartStart | `ws_heart_start` |
| Heart_Bar_2.png | heartMid | `ws_heart_mid` |
| Heart_Bar_3.png | heartEnd | `ws_heart_end` |

**Loading emojis at runtime.** `loadProgressEmojis` calls `client.application.emojis.fetch()` and uses `emoji.toString()`. If any of the seven is missing, it logs a warning that names the missing ones (and mentions `pnpm emojis:upload`), then returns `UNICODE_FALLBACK` for the whole set (e.g. `▰` filled, `▱` empty, `♥` heart).

**Upload script** (`scripts/upload-emojis.ts`):
- Uses `REST` and `Routes.applicationEmojis(DISCORD_APPLICATION_ID)` from discord.js.
- Lists the existing emojis, then for each missing name POSTs `{ name, image: 'data:image/png;base64,…' }`.
- It is idempotent and prints what it created or skipped.

### 6.3 Embeds (port of `WatchSamaEmbed`, `BasicEmbed`, `ExtendedEmbed`)
- **`baseEmbed()`:** colour `#FFB7C5`, author name `WatchSama`.
- **`listEntryEmbed`:**
  - Title links to the entry URL; image is `imageUrl` when non-null.
  - Description is the synopsis, truncated to 1024 characters with `…`.
  - Fields:
    - `Progress`: the progress bar; only when `status === 'watching'`.
    - `Type`: formatted media type (`tv` → `TV`, `ova` → `OVA`, `tv_special` → `TV Special`, otherwise title case).
    - `Watch status`: formatted status (`plan_to_watch` → `Plan to Watch`).
  - Footer: `Entry {index+1} / {count}`.
- **`searchResultEmbed`:** title + URL, image, synopsis (truncated to 1024), fields `Type` and `Episodes` (`?` if unknown), footer `Result {i+1} / {n}`.
- **`truncate(s, max)`:** never exceeds `max`, accounting for the ellipsis.

### 6.4 Paginator (replaces `MALView` and `SearchView`)
- **Initial reply:** `interaction.editReply({ content, embeds: [render(0)], components: [row] })`.
  - The row has ◀ and ▶ buttons, with custom IDs `page:prev` and `page:next`, scoped to the message.
  - If `count === 1`, send the buttons disabled. If `count === 0`, the caller handles it; the paginator throws.
- **Collector:** `message.createMessageComponentCollector({ componentType: ComponentType.Button, time: timeoutMs })`.
  - Only the invoking user may page. Anyone else gets an ephemeral "This menu isn't yours" via `flags: MessageFlags.Ephemeral`. Do not use the deprecated `ephemeral: true`.
  - Index wraps around at both ends, matching the old behaviour.
  - On each press: `i.update({ embeds: [render(idx)] })`.
- **On collector end:** edit the reply so both buttons are disabled; swallow "Unknown Message" errors if the reply was deleted.
- **Unit-testable pieces:** export the pure helpers `nextIndex(current, count, dir)` and `buildRow(disabled)`.

### 6.5 Commands
| Command | Options | Behaviour |
|---|---|---|
| `/watching` | `username?` (string, 2–16 chars, `^[A-Za-z0-9_-]+$`) | Defer; resolve username (option ?? `MAL_USERNAME` ?? error); `getUserAnimeList(u, 'watching')`; empty → "{u} isn't watching anything right now."; else `sendPaginated` with content `Here's what {u} is watching!` |
| `/completed` | `username?` | Same with `'completed'`, content `Here's what {u} has completed!` |
| `/search` | `query` (required, min 3, max 100) | Defer **ephemeral**; `searchAnime(query)`; empty → "No results for …"; else paginate `searchResultEmbed`s |
| `/ping` | – | `Pong! {client.ws.ping} ms` |
| `/info` | – | baseEmbed: title `WatchSama`, URL `https://github.com/moreno-m2698/WatchSama`, description `Developers: .keopi` |
| `/serverinfo` | – | Guild only (`setContexts(InteractionContextType.Guild)`); thumbnail icon, Member Count, Channels `{text} : text \| {voice} : voice`, banner image |
| `/userinfo` | `user?` (User) | Guild only. Use the resolved `GuildMember` from the interaction (no Members intent needed). Fields: ID, Username, Nickname (display name), Joined at (Discord timestamp `<t:…:F>`), Bot?. **No Status field.** |
| `/stop` | – | If `!ctx.ownerIds.has(user.id)`, reply ephemeral "Only the bot owner can do that." Otherwise reply ephemeral "Goodbye!", then `client.destroy()` and `process.exit(0)`. |

The list commands share `listCommand.ts` (a factory taking status and copy).

**MalApiError → user-facing message** (`router.ts` or a shared helper in `src/commands/mal/`):

| Kind | Message |
|---|---|
| `not_found` | MAL user `{u}` not found. |
| `forbidden` | Couldn't access `{u}`'s list. It may be private. |
| `unauthorized` | Bot misconfigured (MAL client ID). This is also logged. |
| `rate_limited` | MAL is rate-limiting, try again shortly. |
| `network` / `unknown` | Couldn't reach MyAnimeList. |

### 6.6 Bot core
- **Client:** `new Client({ intents: [GatewayIntentBits.Guilds] })`.
- **`ready` (`Events.ClientReady`, once):**
  - Log the tag.
  - `await client.application.fetch()`. The owner is either a `User` (one ID) or a `Team` (all member IDs), and goes into `ctx.ownerIds`.
  - `ctx.emojis = await loadProgressEmojis(client)`.
  - Set presence `idle`.
  - If `DEV_GUILD` is set, send "WatchSama is running" to that guild's `systemChannel`, or the first text channel where the bot has `SendMessages`. If neither exists, skip with a log line.
- **`guildCreate`:** welcome embed (`WatchSama Bot Info` / `Thank you for choosing to use WatchSama!`), using the same channel-selection helper.
- **Router:**
  - Ignore non-chat-input interactions; component interactions are handled by collectors.
  - Look up the command, `await execute`, and catch any error.
  - On error: log it and reply ephemeral "Something went wrong." Use `followUp` if `deferred` or `replied`, otherwise `reply`.
  - `MalApiError` gets the mapped message instead.
- **`scripts/deploy-commands.ts`:**
  - `PUT Routes.applicationCommands(DISCORD_APPLICATION_ID)` (global), or `Routes.applicationGuildCommands(DISCORD_APPLICATION_ID, DEV_GUILD)` with `--guild`.
  - Imports the command data from `src/bot/registry.ts`.
- **Process:** `SIGINT`/`SIGTERM` → `client.destroy()`, then exit 0. Log unhandled rejections; don't crash on them.

## 7. Work breakdown

**Git workflow for agents:**
- Phase 1 agents each run in their own **worktree** branched from `refactor` at the Phase 0 commit.
- Each agent commits only the files it owns. Merges back into `refactor` happen in Phase 2, in the order WS-A → WS-B → WS-C → WS-D → WS-E.
- **No Phase 1 agent edits `package.json`, `pnpm-lock.yaml`, configs, or anything under §5 (contracts).** If a contract change is truly needed, stop and report it instead.

**Every Phase 1 agent's definition of done:**
- `pnpm typecheck && pnpm lint && pnpm test` pass.
- New logic has unit tests.
- No `any`; no unused stubs left in owned files.

### Phase 0: Scaffold & contracts (sequential, 1 agent; blocks everything)
1. Delete nothing yet. Add:
   - `package.json` with all deps installed up front: discord.js, zod; dev deps typescript@~6.0.3, tsx, vitest, eslint, typescript-eslint, prettier, @types/node.
   - The configs listed in §4, `.nvmrc`, a new **tracked** `.gitignore`, and a new `.env.example`.
2. Write `src/config.ts` (complete) and `src/log.ts` (complete).
3. Write every contract file from §5 in full:
   - `src/mal/types.ts`, `src/mal/errors.ts`, `src/commands/types.ts`, `src/bot/context.ts`.
4. Write a stub for every other file in §4 that exports the contracted signature and throws `new Error('not implemented')`.
   - `src/bot/registry.ts` must already import and list all 8 commands, so no later agent touches it.
5. Make `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass (one trivial config test).
6. Commit and push to `refactor`.

### Phase 1: Parallel (5 Sonnet agents)

| WS | Owns (only these files) | Spec | Tests |
|---|---|---|---|
| **A: MAL client** | `src/mal/client.ts`, `src/mal/mapping.ts`, `tests/mal/**`, `tests/fixtures/mal/**` | §5.1, §6.1 | Mapping (0 episodes → null, missing picture/synopsis), paging, limit, URL/params/header, every error kind, timeout → `network` |
| **B: Progress bar, embeds, emojis** | `src/ui/progressBar.ts`, `src/ui/emojis.ts`, `src/ui/embeds.ts`, `src/ui/format.ts`, `src/ui/theme.ts`, `scripts/upload-emojis.ts`, `tests/ui/{progressBar,embeds,format,emojis}.test.ts` | §5.2, §6.2, §6.3 | Bar for 0, 1/12, 12/12 (the old first-digit bug), 13/12, 5/null, every k = 0..10 with length 11; truncation limits; fallback when an emoji is missing |
| **C: Paginator** | `src/ui/paginator.ts`, `tests/ui/paginator.test.ts` | §6.4 | `nextIndex` wrap-around, `buildRow` disabled states; `sendPaginated` with a fake interaction/collector if practical |
| **D: Bot core + general commands** | `src/index.ts`, `src/bot/client.ts`, `src/bot/router.ts`, `src/bot/events/**`, `src/commands/general/**`, `scripts/deploy-commands.ts`, `tests/bot/**`, `tests/commands/general/**` | §6.5 (general rows), §6.6 | Router error paths (deferred vs not, MalApiError mapping); owner check on `/stop`; channel-selection helper; owner extraction for User vs Team |
| **E: MAL commands** | `src/commands/mal/**`, `tests/commands/mal/**` | §6.5 (MAL rows) | Mock `MalClient` + `sendPaginated` (vi.mock): username resolution precedence, missing-username error, empty-list copy, ephemeral search, error → message mapping |

WS-D and WS-E both need the "MalApiError → message" helper. **WS-E owns it** (`src/commands/mal/errors.ts`, exporting `malErrorMessage(err, username?)`). Phase 0 creates its stub; WS-D only imports it.

### Phase 2: Integration & cleanup (sequential: lead agent / Opus, with owner involvement)
1. Merge WS-A..E into `refactor`; resolve conflicts; run the full check suite.
2. Delete the Python code:
   - `watchsama/`, `__main__.py`, `requirements.txt`.
   - Remove the local `.venv/` from instructions; the owner deletes the directory.
3. Rewrite `README.md`:
   - Setup: Node 24 + pnpm.
   - Discord app setup, noting that no privileged intents are needed.
   - MAL client ID registration (myanimelist.net/apiconfig → Create ID → App Type "other").
   - `.env` keys, `pnpm emojis:upload`, `pnpm commands:deploy [--guild]`, `pnpm start`.
   - Command list.
4. **Live smoke test.** Both `DISCORD_APPLICATION_ID` and `MAL_CLIENT_ID` are already in `.env`. Then:
   1. Run `pnpm emojis:upload`, `pnpm commands:deploy --guild`, `pnpm dev`.
   2. Exercise all 8 commands in DEV_GUILD.
   3. Response shapes and error codes were already verified on 2026-11-17 (§6.1). Only the private-list status remains: if a private account is available, confirm it maps to `forbidden`.
5. Commit and push. Open a PR only when the owner asks.

## 8. Out of scope (later)
- Hosting, Docker, CI/CD, and deploys using the GH `prod` environment.
- Per-user account linking and a database; MAL OAuth2 list editing; caching.
- HTTP-interactions mode (`PUBLIC_KEY`).

## 9. Risks
| Risk | Mitigation |
|---|---|
| Private-list response code unverified | 403 is mapped to a "may be private" message; any other unexpected status falls through to `unknown` with logging |
| MAL rate limits are undocumented | One request per command (plus paging); 429 → `rate_limited` message |
| Large completed lists | `limit` defaults to 100 entries; pages render lazily |
| Agents drifting from contracts | Contracts are frozen in Phase 0; file ownership is disjoint; registry is pre-wired |
