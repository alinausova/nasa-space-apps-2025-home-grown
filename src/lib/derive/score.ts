import { i18n } from '../i18n/locale.svelte';
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

const factor = (key: FactorKey, weight: number, color: string): Factor => ({
  key,
  weight,
  color,
  // Labels follow the active language.
  get label() {
    return i18n.m.score.factor[key].label;
  },
  get short() {
    return i18n.m.score.factor[key].short;
  },
});

export const FACTORS: readonly Factor[] = [
  factor('gdd', 0.35, 'var(--hg-factor-heat)'),
  factor('sunlight', 0.25, 'var(--hg-factor-sun)'),
  factor('temperature', 0.25, 'var(--hg-factor-temp)'),
  factor('water', 0.15, 'var(--hg-factor-water)'),
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

/** "Excellent fit" etc. in the active language. */
export const FIT_LABEL: Readonly<Record<Category, string>> = {
  get Excellent() {
    return i18n.m.score.fit.Excellent;
  },
  get Good() {
    return i18n.m.score.fit.Good;
  },
  get Moderate() {
    return i18n.m.score.fit.Moderate;
  },
  get Poor() {
    return i18n.m.score.fit.Poor;
  },
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
