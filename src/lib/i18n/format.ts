import { i18n } from './locale.svelte';

// Locale-aware formatting. Reads the active locale on every call, so Svelte templates and $derived update when it changes.

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.ListFormat>();

function cached<T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.ListFormat>(key: string, make: () => T): T {
  let value = cache.get(key) as T | undefined;
  if (!value) {
    value = make();
    cache.set(key, value);
  }
  return value;
}

/** 6,740 in English, 6.740 in German, 6 740 in French and Russian. */
export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  const tag = i18n.intl('number');
  return cached(`n|${tag}|${JSON.stringify(options)}`, () => new Intl.NumberFormat(tag, options)).format(value);
}

function month(index: number, style: 'short' | 'long'): string {
  const tag = i18n.intl('month');
  const format = cached(`m|${tag}|${style}`, () => new Intl.DateTimeFormat(tag, { month: style, timeZone: 'UTC' }));
  return format.format(new Date(Date.UTC(2021, index, 1)));
}

/** "Jan" … "Dec"; index 0–11. */
export const monthShort = (index: number): string => month(index, 'short');
/** "January" … "December"; index 0–11. */
export const monthLong = (index: number): string => month(index, 'long');
/** "J" … "D" for chart axes; index 0–11. */
export const monthInitial = (index: number): string => monthLong(index).charAt(0).toLocaleUpperCase(i18n.intl('text'));

/** "kale, cabbage and lettuce" in the active language. */
export function joinList(items: string[]): string {
  const tag = i18n.intl('list');
  return cached(`l|${tag}`, () => new Intl.ListFormat(tag, { type: 'conjunction' })).format(items);
}

/** Lower-case with the language's rules (Turkish: I → ı, İ → i). */
export const lower = (text: string): string => text.toLocaleLowerCase(i18n.intl('text'));
