import { i18n } from './locale.svelte';

/** One plain sentence for a failed API call, in the active language. null status: the server could not be reached. */
export function errorSentence(status: number | null | undefined): string {
  const e = i18n.m.errors;
  if (status === null || status === undefined) return e.network;
  if (status === 429) return e.rateLimited;
  if (status === 404) return e.expired;
  if (status >= 500) return e.server;
  if (status === 400 || status === 409 || status === 422) return e.invalid;
  return e.other(status);
}
