/** `pnpm emojis:upload`: idempotently upload assets/progress_bar_emojis as application emojis. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REST, Routes } from 'discord.js';
import { loadConfig } from '../src/config.js';
import { EMOJI_TABLE } from '../src/ui/emojis.js';

/** The name/file pairs to upload. */
export const EMOJI_ASSETS: readonly { name: string; file: string }[] = EMOJI_TABLE.map(
  ({ name, file }) => ({ name, file }),
);

/** Entries of the table whose name is not in `existingNames`. */
export function missingEmojis(
  existingNames: Iterable<string>,
): readonly { name: string; file: string }[] {
  const have = new Set(existingNames);
  return EMOJI_ASSETS.filter((a) => !have.has(a.name));
}

const ASSET_DIR = fileURLToPath(new URL('../assets/progress_bar_emojis/', import.meta.url));

async function main(): Promise<void> {
  const config = loadConfig();
  const rest = new REST({ version: '10' }).setToken(config.botToken);
  const route = Routes.applicationEmojis(config.applicationId);

  const existing = (await rest.get(route)) as { items: { name: string }[] };
  const missing = missingEmojis(existing.items.map((e) => e.name));
  const missingNames = new Set(missing.map((m) => m.name));

  for (const { name } of EMOJI_ASSETS) {
    if (!missingNames.has(name)) console.log(`skipped ${name} (already exists)`);
  }
  for (const { name, file } of missing) {
    const data = await readFile(`${ASSET_DIR}${file}`);
    await rest.post(route, {
      body: { name, image: `data:image/png;base64,${data.toString('base64')}` },
    });
    console.log(`created ${name}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    console.error(`Emoji upload failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
