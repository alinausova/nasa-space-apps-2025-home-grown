// Mirrors the back end's scoring (api/main.py calculate_crop_suitability).
// Keep thresholds and weights in sync with it.

export type Category = 'Excellent' | 'Good' | 'Moderate' | 'Poor';

export type FactorKey = 'gdd' | 'sunlight' | 'temperature' | 'water';

export type FactorScores = Record<FactorKey, number>;

export interface Factor {
  key: FactorKey;
  label: string;
  short: string;
  weight: number;
  color: string;
}

export const FACTORS: readonly Factor[] = [
  { key: 'gdd', label: 'Heat', short: 'Heat', weight: 0.35, color: 'var(--hg-factor-heat)' },
  { key: 'sunlight', label: 'Sunlight', short: 'Sun', weight: 0.25, color: 'var(--hg-factor-sun)' },
  { key: 'temperature', label: 'Temperature', short: 'Temp', weight: 0.25, color: 'var(--hg-factor-temp)' },
  { key: 'water', label: 'Water', short: 'Water', weight: 0.15, color: 'var(--hg-factor-water)' },
];

/** A crop is usable (shown as a recommendation) from this score up. */
export const USABLE_SCORE = 50;

export function categoryOf(score: number): Category {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= USABLE_SCORE) return 'Moderate';
  return 'Poor';
}

const DOT_OPACITY: Record<Category, number> = {
  Excellent: 1,
  Good: 0.7,
  Moderate: 0.45,
  Poor: 0.25,
};

export function dotOpacity(score: number): number {
  return DOT_OPACITY[categoryOf(score)];
}

export const FIT_LABEL: Record<Category, string> = {
  Excellent: 'Excellent fit',
  Good: 'Good fit',
  Moderate: 'Moderate fit',
  Poor: 'Poor fit',
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export interface FactorSegment extends Factor {
  score: number;
  /** Share of the full bar in percent: weight × factor score. All four add up to the overall score. */
  widthPct: number;
}

export function factorSegments(scores: FactorScores): FactorSegment[] {
  return FACTORS.map((factor) => {
    const score = clampScore(scores[factor.key]);
    return { ...factor, score, widthPct: factor.weight * score };
  });
}
