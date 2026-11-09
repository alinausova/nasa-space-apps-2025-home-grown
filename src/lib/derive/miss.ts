import type { AnalysedCrop, MissReason } from '../api/analysis';

const n = (value: number) => Math.round(value).toLocaleString('en-US');

/** One plain line on why a crop does not make the list (from the back end's miss_reason). */
export function missSentence(reason: MissReason | undefined): string {
  if (!reason) return 'Does not reach a good score here';
  switch (reason.kind) {
    case 'heat':
      if (reason.approx_warm_days !== null && !reason.beyond_a_year) {
        return `Needs about ${n(reason.approx_warm_days)} more warm ${reason.approx_warm_days === 1 ? 'day' : 'days'}`;
      }
      return 'Not enough warmth in a year here to mature';
    case 'too_cold':
      return 'Never warm enough to start growing';
    case 'sun':
      return `Needs ${reason.needed_hours} h of sun a day, gets ${reason.available_hours.toFixed(1)} h`;
    case 'temperature':
      return reason.season_mean_temp === null
        ? `Days rarely reach ${reason.ideal_min}°C`
        : `Growing season averages ${Math.round(reason.season_mean_temp)}°C, it wants ${reason.ideal_min}–${reason.ideal_max}°C`;
    case 'water':
      return `Would need about ${n(reason.irrigation_mm)} mm of watering`;
    case 'no_window':
      return 'No sowing date ripens before frost or heat here';
  }
}

/** The crops that came closest, best first. */
export function closestCalls(crops: AnalysedCrop[], count = 3): AnalysedCrop[] {
  return crops
    .filter((c) => !c.usable)
    .sort((a, b) => b.suitability.overall_score - a.suitability.overall_score)
    .slice(0, count);
}
