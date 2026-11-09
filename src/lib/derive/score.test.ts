import { describe, expect, it } from 'vitest';
import { FACTORS, categoryOf, dotOpacity, factorSegments } from './score';

describe('categoryOf', () => {
  it.each([
    [100, 'Excellent'],
    [80, 'Excellent'],
    [79.9, 'Good'],
    [65, 'Good'],
    [64.9, 'Moderate'],
    [50, 'Moderate'],
    [49.9, 'Poor'],
    [0, 'Poor'],
  ])('%d is %s', (score, category) => {
    expect(categoryOf(score)).toBe(category);
  });
});

describe('dotOpacity', () => {
  it.each([
    [92, 1],
    [72, 0.7],
    [55, 0.45],
    [30, 0.25],
  ])('%d → %d', (score, opacity) => {
    expect(dotOpacity(score)).toBe(opacity);
  });
});

describe('factorSegments', () => {
  it('weights add up to 1', () => {
    expect(FACTORS.reduce((sum, f) => sum + f.weight, 0)).toBeCloseTo(1);
  });

  it('segments add up to the overall score', () => {
    const scores = { gdd: 95, sunlight: 88, temperature: 94, water: 90 };
    const segments = factorSegments(scores);
    const overall = 95 * 0.35 + 88 * 0.25 + 94 * 0.25 + 90 * 0.15;

    expect(segments.map((s) => s.key)).toEqual(['gdd', 'sunlight', 'temperature', 'water']);
    expect(segments.reduce((sum, s) => sum + s.widthPct, 0)).toBeCloseTo(overall);
  });

  it('clamps out-of-range and missing values', () => {
    const segments = factorSegments({ gdd: 120, sunlight: -5, temperature: Number.NaN, water: 50 });

    expect(segments.map((s) => s.score)).toEqual([100, 0, 0, 50]);
  });
});
