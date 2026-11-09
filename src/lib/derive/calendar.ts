import type { CropCalendar } from '../api/types';
import { joinList, monthLong } from '../i18n/format';
import { i18n } from '../i18n/locale.svelte';



export interface CalendarRow {
  key: 'sow' | 'grow' | 'harvest';
  label: string;
  months: boolean[];
}

export function calendarRows(calendar: CropCalendar): CalendarRow[] {
  const mark = (months: number[]) => Array.from({ length: 12 }, (_, i) => months.includes(i + 1));
  return [
    { key: 'sow', label: i18n.m.calendar.first[calendar.mode], months: mark(calendar.sow) },
    { key: 'grow', label: i18n.m.calendar.grows, months: mark(calendar.grow) },
    { key: 'harvest', label: i18n.m.calendar.harvest, months: mark(calendar.harvest) },
  ];
}

/** Runs of consecutive months as ranges, wrapping past December: [11, 12, 1, 2] → "November to February". */
export function monthRanges(months: number[]): string {
  if (months.length === 0) return i18n.m.calendar.never;
  if (months.length === 12) return i18n.m.calendar.allYear;
  const set = new Set(months);
  const runs: [number, number][] = [];
  for (let m = 1; m <= 12; m++) {
    if (!set.has(m) || set.has(m === 1 ? 12 : m - 1)) continue;
    let end = m;
    while (set.has((end % 12) + 1) && (end % 12) + 1 !== m) end = (end % 12) + 1;
    runs.push([m, end]);
  }
  const words = runs.map(([a, b]) => (a === b ? monthLong(a - 1) : i18n.m.calendar.range(monthLong(a - 1), monthLong(b - 1))));
  return joinList(words);
}

/** One sentence for screen readers, e.g. "Sow March to May. Grows March to October. Harvest June to November." */
export function calendarSentence(calendar: CropCalendar): string {
  return i18n.m.calendar.sentence(i18n.m.calendar.first[calendar.mode], monthRanges(calendar.sow), monthRanges(calendar.grow), monthRanges(calendar.harvest));
}
