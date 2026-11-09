import type { AnalysedCrop, MissReason } from '../api/analysis';
import { formatNumber } from '../i18n/format';
import { i18n } from '../i18n/locale.svelte';

const n = (value: number) => formatNumber(Math.round(value));

/** One plain line on why a crop does not make the list (from the back end's miss_reason). */
export function missSentence(reason: MissReason | undefined): string {
  const m = i18n.m.miss;
  if (!reason) return m.none;
  switch (reason.kind) {
    case 'heat':
      if (reason.approx_warm_days !== null && !reason.beyond_a_year) return m.warmDays(reason.approx_warm_days, n(reason.approx_warm_days));
      return m.beyondYear;
    case 'too_cold':
      return m.tooCold;
    case 'sun':
      return m.sun(reason.needed_hours, formatNumber(reason.available_hours, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
    case 'temperature':
      return reason.season_mean_temp === null
        ? m.rarelyWarm(reason.ideal_min)
        : m.temperature(Math.round(reason.season_mean_temp), reason.ideal_min, reason.ideal_max);
    case 'water':
      return m.water(n(reason.irrigation_mm));
    case 'no_window':
      return m.noWindow;
  }
}

/** The crops that came closest, best first. */
export function closestCalls(crops: AnalysedCrop[], count = 3): AnalysedCrop[] {
  return crops
    .filter((c) => !c.usable)
    .sort((a, b) => b.suitability.overall_score - a.suitability.overall_score)
    .slice(0, count);
}
