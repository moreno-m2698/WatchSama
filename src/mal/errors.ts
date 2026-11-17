/** Category of a failed MAL API call. */
export type MalErrorKind =
  | 'not_found'
  | 'forbidden'
  | 'invalid_request'
  | 'unauthorized'
  | 'rate_limited'
  | 'network'
  | 'unknown';

/** Error thrown by MalClient for any failed request. */
export class MalApiError extends Error {
  constructor(
    public readonly kind: MalErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'MalApiError';
  }
}
