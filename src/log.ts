type Level = 'debug' | 'info' | 'warn' | 'error';

const stamp = (level: Level): string => `${new Date().toISOString()} [${level.toUpperCase()}]`;

/** Tiny leveled console logger. `debug` prints only when LOG_LEVEL=debug. */
export const log = {
  debug(...args: unknown[]): void {
    if (process.env.LOG_LEVEL === 'debug') console.debug(stamp('debug'), ...args);
  },
  info(...args: unknown[]): void {
    console.info(stamp('info'), ...args);
  },
  warn(...args: unknown[]): void {
    console.warn(stamp('warn'), ...args);
  },
  error(...args: unknown[]): void {
    console.error(stamp('error'), ...args);
  },
};
