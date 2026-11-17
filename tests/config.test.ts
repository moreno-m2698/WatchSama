import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

const base = {
  BOT_TOKEN: 'tok',
  DISCORD_APPLICATION_ID: '123456789012345678',
  MAL_CLIENT_ID: 'abc',
};

describe('loadConfig', () => {
  it('parses a valid config and maps to camelCase', () => {
    const cfg = loadConfig({
      ...base,
      MAL_USERNAME: ' "someone" ',
      DEV_GUILD: '123456789012345678',
    });
    expect(cfg).toEqual({
      botToken: 'tok',
      applicationId: '123456789012345678',
      malClientId: 'abc',
      malUsername: 'someone',
      devGuildId: '123456789012345678',
    });
  });

  it('lists every missing required key in one error', () => {
    expect(() => loadConfig({})).toThrow(
      /BOT_TOKEN[\s\S]*DISCORD_APPLICATION_ID[\s\S]*MAL_CLIENT_ID/,
    );
  });

  it('treats empty required values as missing', () => {
    expect(() => loadConfig({ ...base, BOT_TOKEN: '  ' })).toThrow(/BOT_TOKEN/);
  });

  it('treats empty DEV_GUILD and MAL_USERNAME as absent', () => {
    const cfg = loadConfig({ ...base, DEV_GUILD: '', MAL_USERNAME: '' });
    expect(cfg.devGuildId).toBeUndefined();
    expect(cfg.malUsername).toBeUndefined();
  });

  it('rejects a bad snowflake', () => {
    expect(() => loadConfig({ ...base, DEV_GUILD: 'not-a-number' })).toThrow(/DEV_GUILD/);
  });
});
