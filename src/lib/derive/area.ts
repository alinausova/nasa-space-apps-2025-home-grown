import { i18n } from '../i18n/locale.svelte';
import { formatNumber } from '../i18n/format';

export const LIMIT_M2 = 1_000_000;

const PARKING_SPACE_M2 = 12.5; // 5 m × 2.5 m
const TENNIS_COURT_M2 = 260.76; // doubles court, 23.77 m × 10.97 m
const FOOTBALL_PITCH_M2 = 7_140; // 105 m × 68 m


/** Plain comparison for a plot size, e.g. "About eight tennis courts". */
export function areaComparison(areaM2: number): string {
  if (areaM2 <= 0) return '';
  const m = i18n.m.area;
  const count = (unit: number) => Math.max(1, Math.round(areaM2 / unit));
  if (areaM2 < PARKING_SPACE_M2 * 0.75) return m.smallerThanParking;
  if (areaM2 < TENNIS_COURT_M2 * 0.75) {
    const n = count(PARKING_SPACE_M2);
    return m.parking(n, formatNumber(n));
  }
  if (areaM2 < FOOTBALL_PITCH_M2 * 0.75) {
    const n = count(TENNIS_COURT_M2);
    return m.tennis(n, formatNumber(n));
  }
  const n = count(FOOTBALL_PITCH_M2);
  return m.football(n, formatNumber(n));
}

/** "2,140 m²" below 0.1 km², "1.42 km²" above. */
export function formatArea(areaM2: number): string {
  if (areaM2 >= 100_000) return `${formatNumber(areaM2 / 1_000_000, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${i18n.m.units.km2}`;
  return `${formatNumber(Math.round(areaM2))} ${i18n.m.units.m2}`;
}

/** Share of the 1 km² limit used, 0–1. */
export function limitFraction(areaM2: number): number {
  return Math.min(1, Math.max(0, areaM2 / LIMIT_M2));
}

/** Whole percent over the limit (0 when within it). */
export function percentOverLimit(areaM2: number): number {
  return areaM2 <= LIMIT_M2 ? 0 : Math.max(1, Math.round((areaM2 / LIMIT_M2 - 1) * 100));
}
