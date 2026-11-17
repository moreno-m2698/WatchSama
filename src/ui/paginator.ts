import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  type ChatInputCommandInteraction,
  type EmbedBuilder,
} from 'discord.js';
import { log } from '../log.js';

/** Options for sendPaginated. */
export interface PaginateOptions {
  content?: string;
  /** Default 180_000 */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 180_000;
const PREV_ID = 'page:prev';
const NEXT_ID = 'page:next';

/** Next page index with wrap-around; dir is -1 (prev) or 1 (next). */
export function nextIndex(current: number, count: number, dir: -1 | 1): number {
  if (count <= 1) return 0;
  return (((current + dir) % count) + count) % count;
}

/** Row with ◀ (`page:prev`) and ▶ (`page:next`) buttons. */
export function buildRow(disabled: boolean): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(PREV_ID)
      .setEmoji('◀')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(NEXT_ID)
      .setEmoji('▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
  );
}

/** Interaction must already be deferred. Builds pages lazily via `render(i)`. Throws if count is 0. */
export async function sendPaginated(
  interaction: ChatInputCommandInteraction,
  count: number,
  render: (index: number) => EmbedBuilder,
  opts: PaginateOptions = {},
): Promise<void> {
  if (count === 0) throw new Error('sendPaginated requires at least one page');

  const cache = new Map<number, EmbedBuilder>();
  const page = (i: number): EmbedBuilder => {
    let embed = cache.get(i);
    if (!embed) {
      embed = render(i);
      cache.set(i, embed);
    }
    return embed;
  };

  const message = await interaction.editReply({
    content: opts.content,
    embeds: [page(0)],
    components: [buildRow(count <= 1)],
  });
  if (count <= 1) return;

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  });
  let current = 0;

  collector.on('collect', (i) => {
    void (async () => {
      try {
        if (i.user.id !== interaction.user.id) {
          await i.reply({ content: "This menu isn't yours.", flags: MessageFlags.Ephemeral });
          return;
        }
        current = nextIndex(current, count, i.customId === PREV_ID ? -1 : 1);
        await i.update({ embeds: [page(current)] });
      } catch (err) {
        log.warn('Paginator interaction failed:', err);
      }
    })();
  });

  collector.on('end', () => {
    void (async () => {
      try {
        await interaction.editReply({ components: [buildRow(true)] });
      } catch (err) {
        log.warn('Could not disable paginator buttons:', err);
      }
    })();
  });
}
