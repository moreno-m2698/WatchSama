import { z } from 'zod';

/** Strip surrounding whitespace and matching quotes; empty results become undefined. */
const cleaned = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  let s = v.trim();
  if (s.length >= 2 && (s.startsWith('"') || s.startsWith("'")) && s.endsWith(s[0] ?? '')) {
    s = s.slice(1, -1).trim();
  }
  return s === '' ? undefined : s;
};

const required = z.preprocess(cleaned, z.string({ error: 'is required' }).min(1));
const optional = z.preprocess(cleaned, z.string().optional());

const schema = z.object({
  BOT_TOKEN: required,
  DISCORD_APPLICATION_ID: required,
  MAL_CLIENT_ID: required,
  MAL_USERNAME: optional,
  DEV_GUILD: z.preprocess(
    cleaned,
    z
      .string()
      .regex(/^\d{17,20}$/, 'must be a Discord snowflake (17-20 digits)')
      .optional(),
  ),
});

/** Validated, camelCased runtime configuration. */
export interface Config {
  botToken: string;
  applicationId: string;
  malClientId: string;
  malUsername?: string;
  devGuildId?: string;
}

/** Parse and validate env vars; throws a single Error listing every missing/invalid key. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = schema.safeParse(env);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid configuration:\n${lines.join('\n')}`);
  }
  const d = result.data;
  const config: Config = {
    botToken: d.BOT_TOKEN,
    applicationId: d.DISCORD_APPLICATION_ID,
    malClientId: d.MAL_CLIENT_ID,
  };
  if (d.MAL_USERNAME !== undefined) config.malUsername = d.MAL_USERNAME;
  if (d.DEV_GUILD !== undefined) config.devGuildId = d.DEV_GUILD;
  return config;
}
