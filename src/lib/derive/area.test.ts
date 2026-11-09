import { describe, expect, it } from 'vitest';
import { areaComparison, formatArea, limitFraction, percentOverLimit } from './area';

describe('areaComparison', () => {
  it.each([
    [0, ''],
    [5, 'Smaller than a parking space'],
    [12, 'About one parking space'],
    [40, 'About three parking spaces'],
    [260, 'About one tennis court'],
    [2_140, 'About eight tennis courts'],
    [3_400, 'About 13 tennis courts'],
    [7_140, 'About one football pitch'],
    [21_000, 'About three football pitches'],
    [990_000, 'About 139 football pitches'],
  ])('%d m² → %s', (area, text) => {
    expect(areaComparison(area)).toBe(text);
  });
});

describe('formatArea', () => {
  it.each([
    [2_140.4, '2,140 m²'],
    [99_999, '99,999 m²'],
    [1_420_000, '1.42 km²'],
  ])('%d → %s', (area, text) => {
    expect(formatArea(area)).toBe(text);
  });
});

describe('limits', () => {
  it('fraction is clamped', () => {
    expect(limitFraction(250_000)).toBe(0.25);
    expect(limitFraction(2_000_000)).toBe(1);
  });

  it('percent over matches the design example', () => {
    expect(percentOverLimit(1_420_000)).toBe(42);
    expect(percentOverLimit(1_000_000)).toBe(0);
    expect(percentOverLimit(1_000_100)).toBe(1);
  });
});
