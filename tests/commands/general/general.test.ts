import { EmbedBuilder, GuildMember, MessageFlags } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import type { BotContext } from '../../../src/bot/context.js';
import { info } from '../../../src/commands/general/info.js';
import { ping } from '../../../src/commands/general/ping.js';
import { serverinfo } from '../../../src/commands/general/serverinfo.js';
import { stop } from '../../../src/commands/general/stop.js';
import { userinfo } from '../../../src/commands/general/userinfo.js';

vi.mock('../../../src/ui/theme.js', () => ({
  BRAND_COLOR: 0xffb7c5,
  baseEmbed: () => new EmbedBuilder().setAuthor({ name: 'WatchSama' }),
}));
vi.mock('../../../src/log.js', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const asInteraction = (o: unknown): ChatInputCommandInteraction => o as ChatInputCommandInteraction;
const makeCtx = (owners: string[] = []): BotContext =>
  ({ ownerIds: new Set(owners) }) as unknown as BotContext;

interface ReplyPayload {
  embeds: EmbedBuilder[];
}
function embedOf(reply: ReturnType<typeof vi.fn>) {
  const payload = reply.mock.calls[0]?.[0] as ReplyPayload;
  return payload.embeds[0]?.toJSON();
}

describe('/ping', () => {
  it('replies with rounded websocket ping', async () => {
    const reply = vi.fn();
    await ping.execute(asInteraction({ reply, client: { ws: { ping: 41.6 } } }), makeCtx());
    expect(reply).toHaveBeenCalledWith('Pong! 42 ms');
  });
});

describe('/info', () => {
  it('replies with the info embed', async () => {
    const reply = vi.fn();
    await info.execute(asInteraction({ reply }), makeCtx());
    const e = embedOf(reply);
    expect(e?.title).toBe('WatchSama');
    expect(e?.url).toBe('https://github.com/moreno-m2698/WatchSama');
    expect(e?.description).toBe('Developers: .keopi');
  });
});

describe('/serverinfo', () => {
  const fakeGuild = (icon: string | null, banner: string | null) => ({
    memberCount: 7,
    iconURL: () => icon,
    bannerURL: () => banner,
    channels: {
      cache: new Map([
        ['1', { type: 0 }],
        ['2', { type: 0 }],
        ['3', { type: 2 }],
        ['4', { type: 4 }],
      ]),
    },
  });

  it('refuses outside a cached guild', async () => {
    const reply = vi.fn();
    await serverinfo.execute(asInteraction({ reply, inCachedGuild: () => false }), makeCtx());
    expect(reply).toHaveBeenCalledWith({
      content: 'This command only works in a server.',
      flags: MessageFlags.Ephemeral,
    });
  });

  it('shows counts, thumbnail and banner', async () => {
    const reply = vi.fn();
    await serverinfo.execute(
      asInteraction({
        reply,
        inCachedGuild: () => true,
        guild: fakeGuild('https://i/icon.png', 'https://i/banner.png'),
      }),
      makeCtx(),
    );
    const e = embedOf(reply);
    expect(e?.fields).toEqual([
      { name: 'Member Count', value: '7' },
      { name: 'Channels', value: '2 : text | 1 : voice' },
    ]);
    expect(e?.thumbnail?.url).toBe('https://i/icon.png');
    expect(e?.image?.url).toBe('https://i/banner.png');
    expect(e?.timestamp).toBeTruthy();
  });

  it('omits thumbnail and banner when absent', async () => {
    const reply = vi.fn();
    await serverinfo.execute(
      asInteraction({ reply, inCachedGuild: () => true, guild: fakeGuild(null, null) }),
      makeCtx(),
    );
    const e = embedOf(reply);
    expect(e?.thumbnail).toBeUndefined();
    expect(e?.image).toBeUndefined();
  });
});

describe('/userinfo', () => {
  const fakeMember = (displayName: string, joinedAt: Date | null): GuildMember => {
    const m = Object.create(GuildMember.prototype) as GuildMember;
    Object.defineProperties(m, {
      displayName: { value: displayName },
      joinedAt: { value: joinedAt },
      displayAvatarURL: { value: () => 'https://i/avatar.png' },
    });
    return m;
  };
  const av = () => 'https://i/user.png';
  const user = {
    id: '42',
    username: 'alice',
    bot: false,
    displayName: 'Alice',
    displayAvatarURL: av,
  };

  it('describes the invoking member when no option is given', async () => {
    const reply = vi.fn();
    const joined = new Date('2024-01-02T03:04:05Z');
    await userinfo.execute(
      asInteraction({
        reply,
        inCachedGuild: () => true,
        user,
        member: fakeMember('Ali', joined),
        options: { getUser: () => null, getMember: () => null },
      }),
      makeCtx(),
    );
    const e = embedOf(reply);
    expect(e?.title).toBe('User Info:');
    expect(e?.description).toBe("Here is user Ali's info:");
    expect(e?.thumbnail?.url).toBe('https://i/avatar.png');
    expect(e?.fields).toEqual([
      { name: 'ID', value: '42' },
      { name: 'Username', value: 'alice' },
      { name: 'Nickname', value: 'Ali' },
      { name: 'Joined at', value: `<t:${Math.floor(joined.getTime() / 1000)}:F>` },
      { name: 'Bot?', value: 'No' },
    ]);
    expect(e?.fields?.some((f) => f.name === 'Status')).toBe(false);
  });

  it('uses the option target and falls back when the member is not resolved', async () => {
    const reply = vi.fn();
    const target = {
      id: '7',
      username: 'robo',
      bot: true,
      displayName: 'Robo',
      displayAvatarURL: av,
    };
    await userinfo.execute(
      asInteraction({
        reply,
        inCachedGuild: () => true,
        user,
        member: fakeMember('Ali', null),
        options: { getUser: () => target, getMember: () => ({ not: 'a GuildMember' }) },
      }),
      makeCtx(),
    );
    const e = embedOf(reply);
    expect(e?.fields).toEqual([
      { name: 'ID', value: '7' },
      { name: 'Username', value: 'robo' },
      { name: 'Nickname', value: 'Robo' },
      { name: 'Joined at', value: 'Unknown' },
      { name: 'Bot?', value: 'Yes' },
    ]);
  });
});

describe('/stop', () => {
  let exit: MockInstance<typeof process.exit>;
  beforeEach(() => {
    exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  });
  afterEach(() => {
    exit.mockRestore();
  });

  it('refuses non-owners', async () => {
    const reply = vi.fn();
    const destroy = vi.fn();
    await stop.execute(
      asInteraction({ reply, user: { id: '1', tag: 'x' }, client: { destroy } }),
      makeCtx(['2']),
    );
    expect(reply).toHaveBeenCalledWith({
      content: 'Only the bot owner can do that.',
      flags: MessageFlags.Ephemeral,
    });
    expect(destroy).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
  });

  it('shuts down for owners', async () => {
    const reply = vi.fn();
    const destroy = vi.fn().mockResolvedValue(undefined);
    await stop.execute(
      asInteraction({ reply, user: { id: '2', tag: 'owner#0' }, client: { destroy } }),
      makeCtx(['2']),
    );
    expect(reply).toHaveBeenCalledWith({ content: 'Goodbye!', flags: MessageFlags.Ephemeral });
    expect(destroy).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledWith(0);
  });
});
