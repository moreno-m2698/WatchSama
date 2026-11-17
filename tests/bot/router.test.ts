import { Events, MessageFlags } from 'discord.js';
import type { Client } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BotContext } from '../../src/bot/context.js';
import { registerRouter } from '../../src/bot/router.js';

const mocks = vi.hoisted(() => ({
  getCommand: vi.fn(),
  malErrorMessage: vi.fn(),
}));

vi.mock('../../src/bot/registry.js', () => ({ getCommand: mocks.getCommand }));
vi.mock('../../src/commands/mal/errors.js', () => ({ malErrorMessage: mocks.malErrorMessage }));
vi.mock('../../src/log.js', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

type Handler = (interaction: unknown) => void;

const ctx = {} as unknown as BotContext;
const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

function setup(): Handler {
  let handler: Handler | undefined;
  const client = {
    on: (event: string, h: Handler) => {
      expect(event).toBe(Events.InteractionCreate);
      handler = h;
    },
  } as unknown as Client;
  registerRouter(client, ctx);
  if (!handler) throw new Error('no handler registered');
  return handler;
}

function fakeInteraction(overrides: Record<string, unknown> = {}) {
  return {
    isChatInputCommand: () => true,
    commandName: 'ping',
    deferred: false,
    replied: false,
    reply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.malErrorMessage.mockReturnValue(null);
});

describe('router', () => {
  it('ignores non-chat-input interactions', async () => {
    const handler = setup();
    handler({ isChatInputCommand: () => false });
    await flush();
    expect(mocks.getCommand).not.toHaveBeenCalled();
  });

  it('replies ephemerally to unknown commands', async () => {
    mocks.getCommand.mockReturnValue(undefined);
    const i = fakeInteraction({ commandName: 'nope' });
    setup()(i);
    await flush();
    expect(i.reply).toHaveBeenCalledWith({
      content: 'Unknown command.',
      flags: MessageFlags.Ephemeral,
    });
  });

  it('executes the command with the interaction and context', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    mocks.getCommand.mockReturnValue({ execute });
    const i = fakeInteraction();
    setup()(i);
    await flush();
    expect(execute).toHaveBeenCalledWith(i, ctx);
    expect(i.reply).not.toHaveBeenCalled();
    expect(i.followUp).not.toHaveBeenCalled();
  });

  it('uses reply when the command throws before deferring', async () => {
    mocks.getCommand.mockReturnValue({ execute: vi.fn().mockRejectedValue(new Error('boom')) });
    const i = fakeInteraction();
    setup()(i);
    await flush();
    expect(i.reply).toHaveBeenCalledWith({
      content: 'Something went wrong.',
      flags: MessageFlags.Ephemeral,
    });
    expect(i.followUp).not.toHaveBeenCalled();
  });

  it('uses followUp when the command throws after deferring', async () => {
    mocks.getCommand.mockReturnValue({ execute: vi.fn().mockRejectedValue(new Error('boom')) });
    const i = fakeInteraction({ deferred: true });
    setup()(i);
    await flush();
    expect(i.followUp).toHaveBeenCalledWith({
      content: 'Something went wrong.',
      flags: MessageFlags.Ephemeral,
    });
    expect(i.reply).not.toHaveBeenCalled();
  });

  it('uses a mapped MAL error message when available', async () => {
    const err = new Error('mal');
    mocks.getCommand.mockReturnValue({ execute: vi.fn().mockRejectedValue(err) });
    mocks.malErrorMessage.mockReturnValue('MAL is rate-limiting, try again shortly.');
    const i = fakeInteraction();
    setup()(i);
    await flush();
    expect(mocks.malErrorMessage).toHaveBeenCalledWith(err);
    expect(i.reply).toHaveBeenCalledWith({
      content: 'MAL is rate-limiting, try again shortly.',
      flags: MessageFlags.Ephemeral,
    });
  });

  it('swallows a failing error reply', async () => {
    mocks.getCommand.mockReturnValue({ execute: vi.fn().mockRejectedValue(new Error('boom')) });
    const i = fakeInteraction({ reply: vi.fn().mockRejectedValue(new Error('gone')) });
    const unhandled = vi.fn();
    process.once('unhandledRejection', unhandled);
    setup()(i);
    await flush();
    process.off('unhandledRejection', unhandled);
    expect(i.reply).toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });
});
