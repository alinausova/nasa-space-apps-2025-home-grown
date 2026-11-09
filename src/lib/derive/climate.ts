import type { MonthlyTemperature } from '../api/types';

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_INITIAL = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Months whose average temperature reaches this count as growing season. */
export const SEASON_BASE_C = 5;

export interface GrowingSeason {
  /** Month indexes 0–11, in season order (may wrap past December). */
  months: number[];
  /** Contiguous runs as [startIndex, endIndex] within one calendar year, for drawing bands. */
  runs: [number, number][];
  label: string;
  days: number;
}

/**
 * Growing season from monthly averages: the longest run of months at or above the base temperature,
 * wrapping around the year end (southern hemisphere). Null when no month qualifies.
 * TODO(redesign v2): the back end returns the season directly.
 */
export function growingSeason(monthly: MonthlyTemperature[], base = SEASON_BASE_C): GrowingSeason | null {
  const warm = Array.from({ length: 12 }, (_, i) => {
    const m = monthly.find((x) => x.month === i + 1);
    return m ? m.avg_temp >= base : false;
  });
  if (!warm.some(Boolean)) return null;

  if (warm.every(Boolean)) {
    return { months: [...Array(12).keys()], runs: [[0, 11]], label: 'All year', days: 365 };
  }

  // Longest circular run of warm months, starting right after a cold month.
  let best: number[] = [];
  for (let start = 0; start < 12; start++) {
    if (!warm[start] || warm[(start + 11) % 12]) continue;
    const run: number[] = [];
    for (let k = 0; k < 12 && warm[(start + k) % 12]; k++) run.push((start + k) % 12);
    if (run.length > best.length) best = run;
  }

  const first = best[0];
  const last = best.at(-1)!;
  const runs: [number, number][] = first <= last ? [[first, last]] : [[first, 11], [0, last]];
  const label = first === last ? MONTH_SHORT[first] : `${MONTH_SHORT[first]}–${MONTH_SHORT[last]}`;
  const days = best.reduce((sum, m) => sum + DAYS_IN_MONTH[m], 0);

  return { months: best, runs, label, days };
}

export function warmestMonth(monthly: MonthlyTemperature[]): MonthlyTemperature | null {
  return monthly.reduce<MonthlyTemperature | null>((best, m) => (!best || m.avg_temp > best.avg_temp ? m : best), null);
}

/** Text alternative for the climate chart. */
export function describeClimate(monthly: MonthlyTemperature[], season: GrowingSeason | null): string {
  if (monthly.length === 0) return 'Monthly climate: no data.';
  const highs = monthly.map((m) => m.avg_temp_max);
  const lows = monthly.map((m) => m.avg_temp_min);
  const hiMax = monthly[highs.indexOf(Math.max(...highs))];
  const hiMin = monthly[highs.indexOf(Math.min(...highs))];
  const r = (n: number) => Math.round(n);
  const parts = [
    `Monthly climate. Daily highs from ${r(hiMin.avg_temp_max)} degrees in ${MONTH_SHORT[hiMin.month - 1]} to ${r(hiMax.avg_temp_max)} in ${MONTH_SHORT[hiMax.month - 1]}`,
    `lows from ${r(Math.min(...lows))} to ${r(Math.max(...lows))}.`,
  ];
  const seasonText = season ? `Growing season ${season.label === 'All year' ? 'all year' : season.label.replace('–', ' to ')}.` : 'No month is warm enough to grow outdoors.';
  return `${parts.join(', ')} ${seasonText}`;
}

type ServerSeason = { start_month: number; end_month: number; days: number; all_year: boolean } | null;

/** The back end's growing season (v2 /analysis/climate) in the shape the chart and cards use. */
export function seasonFromServer(season: ServerSeason): GrowingSeason | null {
  if (!season) return null;
  if (season.all_year) return { months: [...Array(12).keys()], runs: [[0, 11]], label: 'All year', days: season.days };
  const first = season.start_month - 1;
  const last = season.end_month - 1;
  const months: number[] = [];
  for (let m = first; ; m = (m + 1) % 12) {
    months.push(m);
    if (m === last) break;
  }
  const runs: [number, number][] = first <= last ? [[first, last]] : [[first, 11], [0, last]];
  const label = first === last ? MONTH_SHORT[first] : `${MONTH_SHORT[first]}–${MONTH_SHORT[last]}`;
  return { months, runs, label, days: season.days };
}

/** Rainiest month, for the chart's text alternative. */
export function rainiestMonth(monthly: { month: number; precip_mm: number }[]): { month: number; precip_mm: number } | null {
  return monthly.reduce<{ month: number; precip_mm: number } | null>((best, m) => (!best || m.precip_mm > best.precip_mm ? m : best), null);
}
