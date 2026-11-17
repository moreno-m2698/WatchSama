import { ChannelType, PermissionFlagsBits } from 'discord.js';
import type { Guild, Team, User } from 'discord.js';
import { describe, expect, it } from 'vitest';
import { pickAnnounceChannel } from '../../src/bot/events/channels.js';
import { extractOwnerIds } from '../../src/bot/events/ready.js';

describe('extractOwnerIds', () => {
  it('returns the single id for a User owner', () => {
    expect(extractOwnerIds({ id: '1' } as unknown as User)).toEqual(['1']);
  });

  it('returns all member user ids for a Team owner', () => {
    const team = {
      id: 'team',
      members: new Map([
        ['a', { user: { id: '10' } }],
        ['b', { user: { id: '20' } }],
      ]),
    } as unknown as Team;
    expect(extractOwnerIds(team)).toEqual(['10', '20']);
  });

  it('returns nothing for a missing owner', () => {
    expect(extractOwnerIds(null)).toEqual([]);
  });
});

interface FakeChannel {
  id: string;
  type: ChannelType;
  position: number;
  permissionsFor: () => { has: (p: bigint) => boolean } | null;
}

const perms = (canView: boolean, canSend: boolean): FakeChannel['permissionsFor'] => {
  return () => ({
    has: (p: bigint) =>
      (p === PermissionFlagsBits.ViewChannel && canView) ||
      (p === PermissionFlagsBits.SendMessages && canSend),
  });
};

const channel = (
  id: string,
  position: number,
  canSend: boolean,
  type: ChannelType = ChannelType.GuildText,
): FakeChannel => ({ id, type, position, permissionsFor: perms(true, canSend) });

const guild = (system: FakeChannel | null, channels: FakeChannel[]): Guild =>
  ({
    systemChannel: system,
    members: { me: { id: 'bot' } },
    channels: { cache: new Map(channels.map((c) => [c.id, c])) },
  }) as unknown as Guild;

describe('pickAnnounceChannel', () => {
  it('prefers a sendable system channel', () => {
    const sys = channel('sys', 5, true);
    const other = channel('other', 0, true);
    expect(pickAnnounceChannel(guild(sys, [sys, other]))?.id).toBe('sys');
  });

  it('falls back to the first sendable text channel by position', () => {
    const sys = channel('sys', 0, false);
    const blocked = channel('blocked', 1, false);
    const late = channel('late', 9, true);
    const early = channel('early', 3, true);
    const voice = channel('voice', 2, true, ChannelType.GuildVoice);
    expect(pickAnnounceChannel(guild(sys, [sys, blocked, late, voice, early]))?.id).toBe('early');
  });

  it('returns null when nothing is sendable', () => {
    const a = channel('a', 0, false);
    expect(pickAnnounceChannel(guild(null, [a]))).toBeNull();
  });
});
