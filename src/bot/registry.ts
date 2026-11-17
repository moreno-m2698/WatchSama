import type { SlashCommand } from '../commands/types.js';
import { info } from '../commands/general/info.js';
import { ping } from '../commands/general/ping.js';
import { serverinfo } from '../commands/general/serverinfo.js';
import { stop } from '../commands/general/stop.js';
import { userinfo } from '../commands/general/userinfo.js';
import { completed } from '../commands/mal/completed.js';
import { search } from '../commands/mal/search.js';
import { watching } from '../commands/mal/watching.js';

/** All slash commands. */
export const commands: SlashCommand[] = [
  ping,
  info,
  serverinfo,
  userinfo,
  stop,
  watching,
  completed,
  search,
];

const byName = new Map(commands.map((c) => [c.data.name, c]));

/** Look up a command by name. */
export function getCommand(name: string): SlashCommand | undefined {
  return byName.get(name);
}
