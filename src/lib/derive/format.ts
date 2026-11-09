import { i18n } from '../i18n/locale.svelte';
import { formatNumber, joinList } from '../i18n/format';

/** "6,740 kg", or "28.3 t" from 10 t up. `approx` adds "~". */
export function formatKg(kg: number, { approx = false } = {}): string {
  const prefix = approx ? '~' : '';
  if (kg >= 10_000) return `${prefix}${formatNumber(kg / 1000, { maximumFractionDigits: 1 })} t`;
  if (kg >= 100) return `${prefix}${formatNumber(Math.round(kg / 10) * 10)} kg`;
  return `${prefix}${formatNumber(Math.round(kg))} kg`;
}

export function formatMm(mm: number): string {
  return `${formatNumber(Math.round(mm))} mm`;
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} h`;
}

/** "Four beds", "One bed". */
export function bedCount(n: number): string {
  return i18n.m.beds(n);
}

/** "kale, cabbage and lettuce", in the active language. */
export const listJoin = joinList;

/** Labels follow the active language (read on access). */
const live = (section: 'season' | 'frost'): Record<string, string> =>
  new Proxy({}, { get: (_, key) => (typeof key === 'string' ? i18n.m[section][key] : undefined) });

export const SEASON_LABEL: Record<string, string> = live('season');

export const FROST_LABEL: Record<string, string> = live('frost');
