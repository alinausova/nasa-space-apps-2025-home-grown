import type { MonthlyTemperature } from '../api/types';

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_INITIAL = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export interface GrowingSeason {
  /** Month indexes 0–11, in season order (may wrap past December). */
  months: number[];
  /** Contiguous runs as [startIndex, endIndex] within one calendar year, for drawing bands. */
  runs: [number, number][];
  label: string;
  days: number;
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
