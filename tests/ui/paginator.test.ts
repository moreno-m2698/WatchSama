import { EventEmitter } from 'node:events';
import { EmbedBuilder, MessageFlags, type ChatInputCommandInteraction } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRow, nextIndex, sendPaginated } from '../../src/ui/paginator.js';

vi.mock('../../src/log.js', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

interface ButtonJson {
  custom_id: string;
  style: number;
  disabled?: boolean;
  emoji?: { name: string };
}

const buttonsOf = (row: ReturnType<typeof buildRow>): ButtonJson[] =>
  row.toJSON().components as unknown as ButtonJson[];

describe('nextIndex', () => {
  it('wraps at both ends', () => {
    expect(nextIndex(0, 5, -1)).toBe(4);
    expect(nextIndex(4, 5, 1)).toBe(0);
  });
  it('moves within range', () => {
    expect(nextIndex(2, 5, 1)).toBe(3);
    expect(nextIndex(2, 5, -1)).toBe(1);
  });
  it('returns 0 for count <= 1', () => {
    expect(nextIndex(0, 1, 1)).toBe(0);
    expect(nextIndex(0, 1, -1)).toBe(0);
    expect(nextIndex(0, 0, 1)).toBe(0);
  });
});

describe('buildRow', () => {
  it('has prev and next primary buttons', () => {
    const buttons = buttonsOf(buildRow(false));
    expect(buttons).toHaveLength(2);
    expect(buttons.map((b) => b.custom_id)).toEqual(['page:prev', 'page:next']);
    expect(buttons.map((b) => b.emoji?.name)).toEqual(['◀', '▶']);
    expect(buttons.map((b) => b.style)).toEqual([1, 1]);
    expect(buttons.every((b) => !b.disabled)).toBe(true);
  });
  it('disables both buttons', () => {
    expect(buttonsOf(buildRow(true)).every((b) => b.disabled === true)).toBe(true);
  });
});

interface Click {
  customId: string;
  user: { id: string };
  update: ReturnType<typeof vi.fn>;
  reply: ReturnType<typeof vi.fn>;
}

const click = (customId: string, userId = 'u1'): Click => ({
  customId,
  user: { id: userId },
  update: vi.fn().mockResolvedValue(undefined),
  reply: vi.fn().mockResolvedValue(undefined),
});

function setup() {
  const collector = new EventEmitter();
  const message = { createMessageComponentCollector: vi.fn(() => collector) };
  const editReply = vi.fn().mockResolvedValue(message);
  const interaction = { user: { id: 'u1' }, editReply } as unknown as ChatInputCommandInteraction;
  const render = vi.fn((i: number) => new EmbedBuilder().setTitle(`page ${i}`));
  return { collector, message, editReply, interaction, render };
}

const titleOf = (c: Click): unknown => {
  const arg = c.update.mock.calls[0]?.[0] as { embeds: EmbedBuilder[] };
  return arg.embeds[0]?.toJSON().title;
};
const flush = (): Promise<void> => new Promise((r) => setImmediate(r));

interface EditArg {
  content?: string;
  embeds: EmbedBuilder[];
  components: ReturnType<typeof buildRow>[];
}

describe('sendPaginated', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when count is 0', async () => {
    const s = setup();
    await expect(sendPaginated(s.interaction, 0, s.render)).rejects.toThrow();
    expect(s.editReply).not.toHaveBeenCalled();
  });

  it('sends the first page with content and enabled buttons', async () => {
    const s = setup();
    await sendPaginated(s.interaction, 3, s.render, { content: 'hi', timeoutMs: 1000 });
    const arg = s.editReply.mock.calls[0]?.[0] as EditArg;
    expect(arg.content).toBe('hi');
    expect(arg.embeds[0]?.toJSON().title).toBe('page 0');
    expect(buttonsOf(arg.components[0]!).every((b) => !b.disabled)).toBe(true);
    expect(s.message.createMessageComponentCollector).toHaveBeenCalledWith({
      componentType: 2,
      time: 1000,
    });
    expect(s.render).toHaveBeenCalledTimes(1);
  });

  it('defaults timeout to 180000', async () => {
    const s = setup();
    await sendPaginated(s.interaction, 2, s.render);
    expect(s.message.createMessageComponentCollector).toHaveBeenCalledWith(
      expect.objectContaining({ time: 180_000 }),
    );
  });

  it('count 1 sends disabled buttons and no collector', async () => {
    const s = setup();
    await sendPaginated(s.interaction, 1, s.render);
    const arg = s.editReply.mock.calls[0]?.[0] as EditArg;
    expect(buttonsOf(arg.components[0]!).every((b) => b.disabled === true)).toBe(true);
    expect(s.message.createMessageComponentCollector).not.toHaveBeenCalled();
  });

  it('next and prev clicks wrap', async () => {
    const s = setup();
    await sendPaginated(s.interaction, 3, s.render);
    const prev = click('page:prev');
    s.collector.emit('collect', prev);
    await flush();
    expect(titleOf(prev)).toBe('page 2');
    const next = click('page:next');
    s.collector.emit('collect', next);
    await flush();
    expect(titleOf(next)).toBe('page 0');
  });

  it('rejects foreign users ephemerally without changing page', async () => {
    const s = setup();
    await sendPaginated(s.interaction, 3, s.render);
    const foreign = click('page:next', 'other');
    s.collector.emit('collect', foreign);
    await flush();
    expect(foreign.update).not.toHaveBeenCalled();
    expect(foreign.reply).toHaveBeenCalledWith({
      content: "This menu isn't yours.",
      flags: MessageFlags.Ephemeral,
    });
    const next = click('page:next');
    s.collector.emit('collect', next);
    await flush();
    expect(titleOf(next)).toBe('page 1');
  });

  it('survives a failed click', async () => {
    const s = setup();
    await sendPaginated(s.interaction, 3, s.render);
    const bad = click('page:next');
    bad.update.mockRejectedValueOnce(new Error('boom'));
    s.collector.emit('collect', bad);
    await flush();
    const ok = click('page:next');
    s.collector.emit('collect', ok);
    await flush();
    expect(ok.update).toHaveBeenCalled();
  });

  it('end disables the buttons', async () => {
    const s = setup();
    await sendPaginated(s.interaction, 3, s.render);
    s.collector.emit('end');
    await flush();
    const arg = s.editReply.mock.calls[1]?.[0] as EditArg;
    expect(buttonsOf(arg.components[0]!).every((b) => b.disabled === true)).toBe(true);
  });

  it('swallows errors on end', async () => {
    const s = setup();
    await sendPaginated(s.interaction, 3, s.render);
    s.editReply.mockRejectedValueOnce(new Error('Unknown Message'));
    expect(() => s.collector.emit('end')).not.toThrow();
    await flush();
  });
});
