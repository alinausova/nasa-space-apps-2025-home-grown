import { describe, expect, it } from 'vitest';
import type { AnalysedCrop } from '../api/analysis';
import { closestCalls, missSentence } from './miss';

describe('missSentence', () => {
  it.each([
    [{ kind: 'heat', short_heat_units: 120, approx_warm_days: 25, beyond_a_year: false }, 'Needs about 25 more warm days'],
    [{ kind: 'heat', short_heat_units: 900, approx_warm_days: null, beyond_a_year: true }, 'Not enough warmth in a year here to mature'],
    [{ kind: 'too_cold' }, 'Never warm enough to start growing'],
    [{ kind: 'sun', needed_hours: 6, available_hours: 3.24 }, 'Needs 6 h of sun a day, gets 3.2 h'],
    [{ kind: 'temperature', season_mean_temp: 9.6, ideal_min: 18, ideal_max: 27 }, 'Growing season averages 10°C, it wants 18–27°C'],
    [{ kind: 'temperature', season_mean_temp: null, ideal_min: 8, ideal_max: 20 }, 'Days rarely reach 8°C'],
    [{ kind: 'water', irrigation_mm: 412.6 }, 'Would need about 413 mm of watering'],
  ] as const)('%o', (reason, text) => {
    expect(missSentence(reason as never)).toBe(text);
  });

  it('one warm day reads naturally', () => {
    expect(missSentence({ kind: 'heat', short_heat_units: 5, approx_warm_days: 1, beyond_a_year: false })).toBe('Needs about 1 more warm day');
  });
});

describe('closestCalls', () => {
  const crop = (id: string, score: number, usable: boolean) =>
    ({ crop_id: id, usable, suitability: { overall_score: score } }) as unknown as AnalysedCrop;

  it('takes the best non-usable crops', () => {
    const list = [crop('a', 80, true), crop('b', 30, false), crop('c', 45, false), crop('d', 10, false), crop('e', 40, false)];
    expect(closestCalls(list).map((c) => c.crop_id)).toEqual(['c', 'e', 'b']);
  });
});

describe('no sowing window', () => {
  it('explains it plainly', () => {
    expect(missSentence({ kind: 'no_window' })).toBe('No sowing date ripens before frost or heat here');
  });
});
