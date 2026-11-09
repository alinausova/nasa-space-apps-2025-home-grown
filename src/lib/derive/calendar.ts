import type { CropCalendar } from '../api/types';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const FIRST_ROW: Record<CropCalendar['mode'], string> = { sow: 'Sow', plant_out: 'Plant out', plant: 'Plant' };

export interface CalendarRow {
  key: 'sow' | 'grow' | 'harvest';
  label: string;
  months: boolean[];
}

export function calendarRows(calendar: CropCalendar): CalendarRow[] {
  const mark = (months: number[]) => Array.from({ length: 12 }, (_, i) => months.includes(i + 1));
  return [
    { key: 'sow', label: FIRST_ROW[calendar.mode], months: mark(calendar.sow) },
    { key: 'grow', label: 'Grows', months: mark(calendar.grow) },
    { key: 'harvest', label: 'Harvest', months: mark(calendar.harvest) },
  ];
}

/** Runs of consecutive months as ranges, wrapping past December: [11, 12, 1, 2] → "November to February". */
export function monthRanges(months: number[]): string {
  if (months.length === 0) return 'never';
  if (months.length === 12) return 'all year';
  const set = new Set(months);
  const runs: [number, number][] = [];
  for (let m = 1; m <= 12; m++) {
    if (!set.has(m) || set.has(m === 1 ? 12 : m - 1)) continue;
    let end = m;
    while (set.has((end % 12) + 1) && (end % 12) + 1 !== m) end = (end % 12) + 1;
    runs.push([m, end]);
  }
  const words = runs.map(([a, b]) => (a === b ? MONTH_NAMES[a - 1] : `${MONTH_NAMES[a - 1]} to ${MONTH_NAMES[b - 1]}`));
  return words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}

/** One sentence for screen readers, e.g. "Sow March to May. Grows March to October. Harvest June to November." */
export function calendarSentence(calendar: CropCalendar): string {
  const first = FIRST_ROW[calendar.mode];
  return `${first} ${monthRanges(calendar.sow)}. Grows ${monthRanges(calendar.grow)}. Harvest ${monthRanges(calendar.harvest)}.`;
}
