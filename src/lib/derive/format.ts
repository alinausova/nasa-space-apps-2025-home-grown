/** "6,740 kg", or "28.3 t" from 10 t up. `approx` adds "~". */
export function formatKg(kg: number, { approx = false } = {}): string {
  const prefix = approx ? '~' : '';
  if (kg >= 10_000) return `${prefix}${(kg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} t`;
  if (kg >= 100) return `${prefix}${(Math.round(kg / 10) * 10).toLocaleString('en-US')} kg`;
  return `${prefix}${Math.round(kg).toLocaleString('en-US')} kg`;
}

export function formatMm(mm: number): string {
  return `${Math.round(mm).toLocaleString('en-US')} mm`;
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} h`;
}

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four'];

/** "Four beds", "One bed". */
export function bedCount(n: number): string {
  return `${NUMBER_WORDS[n] ?? n} ${n === 1 ? 'bed' : 'beds'}`;
}

/** "kale, cabbage and lettuce" */
export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

export const SEASON_LABEL: Record<string, string> = {
  cool: 'Cool season',
  warm: 'Warm season',
};

export const FROST_LABEL: Record<string, string> = {
  very_hardy: 'Survives hard frost',
  hardy: 'Survives freezing',
  half_hardy: 'Takes light frost',
  tender: 'No frost',
};
