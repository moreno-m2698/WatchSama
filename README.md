<h2 align="center">
    This project is currently in development!<br>
</h2>

## About

WatchSama is an open-source Discord bot that connects your Discord server with MyAnimeList (MAL). It shows the anime you're watching or have completed on your MAL account as paginated embeds, including a custom progress bar, and it can search MAL for anime.

The bot is written in TypeScript with [discord.js](https://discord.js.org). It reads all MAL data from the official [MyAnimeList API v2](https://myanimelist.net/apiconfig/references/api/v2), so no browser or scraping is involved.

This bot is available for anyone to clone and edit to match their server needs.

## Planned Features

- Per-user MAL account linking
- MyAnimeList list editing (MAL OAuth2)
- Moderation tools

## Commands

| Command | Description |
|---|---|
| `/watching [username]` | Shows currently-watching anime with a progress bar. Defaults to `MAL_USERNAME`. |
| `/completed [username]` | Shows completed anime. Defaults to `MAL_USERNAME`. |
| `/search <query>` | Searches MAL (3+ characters). Only you can see the results. |
| `/ping` | Bot latency |
| `/info` | About WatchSama |
| `/serverinfo` | Member and channel counts for the current server |
| `/userinfo [user]` | Info about a server member |
| `/stop` | Shuts the bot down (application owner only) |

Results are paginated with ◀ ▶ buttons. Only the person who ran the command can page, and the buttons disable after 3 minutes.

## Setup

### Requirements

- [Node.js 24+](https://nodejs.org)
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)

### 1. Create a Discord application

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Under **General Information**, copy the **Application ID**.
3. Under **Bot**, reset and copy the **Token**. (Never share this token.)
   - WatchSama needs **no privileged gateway intents**, so you can leave all of them off.
4. Under **OAuth2 → URL Generator**, select the scopes `bot` and `applications.commands`.
5. Grant the bot permissions **View Channels**, **Send Messages** and **Embed Links**.
6. Open the generated URL to invite the bot to your server.

### 2. Get a MyAnimeList client ID

1. While logged in to MAL, go to [myanimelist.net/apiconfig](https://myanimelist.net/apiconfig) and click **Create ID**.
2. Use App Type **other** and Redirect URL `http://localhost`, and fill in the remaining fields.
3. Copy the **Client ID**. No client secret is needed.

### 3. Install and configure

```sh
git clone https://github.com/moreno-m2698/WatchSama.git
cd WatchSama
pnpm install
cp .env.example .env
```

Fill in `.env`:

| Key | Required | Description |
|---|---|---|
| `BOT_TOKEN` | yes | Discord bot token |
| `DISCORD_APPLICATION_ID` | yes | Discord application ID |
| `MAL_CLIENT_ID` | yes | MyAnimeList API client ID |
| `MAL_USERNAME` | no | Default MAL user for `/watching` and `/completed` |
| `DEV_GUILD` | no | Server ID for instant command deploys and a startup message |

Real environment variables take precedence over `.env`.

### 4. One-time setup: emojis and commands

```sh
pnpm emojis:upload             # uploads the progress-bar emojis to your application
pnpm commands:deploy --guild   # registers slash commands in DEV_GUILD (instant)
pnpm commands:deploy           # or register globally (can take a while to appear)
```

`emojis:upload` is idempotent and only uploads emojis that are missing. If you skip it, the progress bar falls back to Unicode characters (▰▱♥).

Re-run `commands:deploy` whenever command names or options change.

### 5. Run

```sh
pnpm dev      # development, restarts on file changes
pnpm build && pnpm start   # compiled
```

Stop the bot with `Ctrl+C` or `/stop`.

## Development

```sh
pnpm typecheck   # tsc
pnpm lint        # eslint
pnpm test        # vitest
pnpm format      # prettier
```

Source layout:

| Path | Contents |
|---|---|
| `src/mal/` | MAL API client |
| `src/ui/` | Embeds, progress bar, paginator, emojis |
| `src/commands/` | Slash commands |
| `src/bot/` | Client, router and events |
| `scripts/` | Command deploy and emoji upload |

The migration plan from the original Python version is in [`docs/refactor-plan.md`](docs/refactor-plan.md).
