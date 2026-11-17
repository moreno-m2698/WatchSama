import { describe, expect, it, vi } from 'vitest';
import type { Config } from '../../src/config.js';
import { resolveDeployTarget } from '../../scripts/deploy-commands.js';

vi.mock('../../src/bot/registry.js', () => ({ commands: [] }));

const base: Config = { botToken: 't', applicationId: 'a', malClientId: 'm' };

describe('resolveDeployTarget', () => {
  it('is global without --guild', () => {
    expect(resolveDeployTarget([], { ...base, devGuildId: '1'.repeat(18) })).toEqual({
      scope: 'global',
    });
  });

  it('is the dev guild with --guild', () => {
    const id = '1'.repeat(18);
    expect(resolveDeployTarget(['--guild'], { ...base, devGuildId: id })).toEqual({
      scope: 'guild',
      guildId: id,
    });
  });

  it('throws with --guild but no DEV_GUILD', () => {
    expect(() => resolveDeployTarget(['--guild'], base)).toThrow(/DEV_GUILD/);
  });
});
