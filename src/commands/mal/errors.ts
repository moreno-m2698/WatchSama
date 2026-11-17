/** Map a thrown error to a user-facing message; null if it is not a MalApiError. */
export function malErrorMessage(_err: unknown, _username?: string): string | null {
  throw new Error('not implemented');
}
