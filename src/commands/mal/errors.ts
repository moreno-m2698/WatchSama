import type { ChatInputCommandInteraction } from 'discord.js';
import { log } from '../../log.js';
import { MalApiError } from '../../mal/errors.js';

/** Map a thrown error to a user-facing message; null if it is not a MalApiError. */
export function malErrorMessage(err: unknown, username?: string): string | null {
  if (!(err instanceof MalApiError)) return null;
  switch (err.kind) {
    case 'not_found':
      return username === undefined
        ? 'Not found on MyAnimeList.'
        : `MAL user \`${username}\` not found.`;
    case 'forbidden':
      return username === undefined
        ? 'MyAnimeList refused the request.'
        : `Couldn't access \`${username}\`'s list. It may be private.`;
    case 'invalid_request':
      return 'MyAnimeList rejected that request. Check your input.';
    case 'unauthorized':
      return 'The bot is misconfigured (MAL client ID). Please tell the bot owner.';
    case 'rate_limited':
      return 'MyAnimeList is rate-limiting requests. Try again shortly.';
    case 'network':
    case 'unknown':
      return "Couldn't reach MyAnimeList. Try again later.";
  }
}

/**
 * Edit the deferred reply with a mapped message for a MalApiError.
 * Returns false (without replying) when the error is not a MalApiError, so callers can rethrow.
 */
export async function replyWithMalError(
  interaction: ChatInputCommandInteraction,
  err: unknown,
  username?: string,
): Promise<boolean> {
  const content = malErrorMessage(err, username);
  if (content === null) return false;
  if (err instanceof MalApiError && err.kind === 'unauthorized') {
    log.error('MAL API rejected the client ID', err);
  }
  await interaction.editReply({ content });
  return true;
}
