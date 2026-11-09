import { describe, expect, it } from 'vitest';
import type { MonthlyTemperature } from '../api/types';
import { describeClimate, growingSeason, rainiestMonth, seasonFromServer, warmestMonth } from './climate';

function months(avgs: number[]): MonthlyTemperature[] {
  return avgs.map((avg, i) => ({ month: i + 1, month_name: '', avg_temp: avg, avg_temp_max: avg + 5, avg_temp_min: avg - 5 }));
}

// Real fixture values (NASA POWER 2023).
const MUNICH = months([1.5, 2.1, 6.0, 6.7, 12.5, 17.7, 19.4, 19.6, 17.8, 13.2, 4.3, 2.2]);
const CAIRO = months([14.4, 12.6, 18.2, 21.5, 25.3, 29.5, 31.6, 31.3, 30.1, 25.7, 20.8, 17.0]);
const SVALBARD = months([-7.2, -9.0, -16.1, -8.0, -4.3, 1.4, 5.6, 4.7, -1.6, -6.9, -9.9, -9.5]);
// Southern hemisphere: warm Oct–Apr.
const SOUTH = months([12, 11, 9, 6, 3, 1, 0, 2, 4, 6, 9, 11]);

describe('growingSeason', () => {
  it('Munich: March to October, band starts on March', () => {
    const s = growingSeason(MUNICH)!;
    expect(s.label).toBe('Mar–Oct');
    expect(s.runs).toEqual([[2, 9]]);
    expect(s.days).toBe(31 + 30 + 31 + 30 + 31 + 31 + 30 + 31);
  });

  it('Cairo: all year', () => {
    expect(growingSeason(CAIRO)).toMatchObject({ label: 'All year', days: 365, runs: [[0, 11]] });
  });

  it('Svalbard: a single month', () => {
    expect(growingSeason(SVALBARD)).toMatchObject({ label: 'Jul', months: [6], days: 31 });
  });

  it('wraps past December in the southern hemisphere', () => {
    const s = growingSeason(SOUTH)!;
    expect(s.label).toBe('Oct–Apr');
    expect(s.runs).toEqual([
      [9, 11],
      [0, 3],
    ]);
  });

  it('is null when no month is warm enough', () => {
    expect(growingSeason(months(Array(12).fill(-10)))).toBeNull();
  });

  it('picks the longest run when there are two', () => {
    expect(growingSeason(months([6, 6, 0, 0, 6, 6, 6, 6, 0, 0, 0, 0]))!.label).toBe('May–Aug');
  });
});

describe('warmestMonth', () => {
  it('finds July in Svalbard', () => {
    expect(warmestMonth(SVALBARD)!.month).toBe(7);
  });
});

describe('describeClimate', () => {
  it('summarises highs, lows and season', () => {
    const text = describeClimate(MUNICH, growingSeason(MUNICH));
    expect(text).toContain('Daily highs from 7 degrees in Jan to 25 in Aug');
    expect(text).toContain('Growing season Mar to Oct.');
  });
});

describe('seasonFromServer', () => {
  it('matches the front-end derivation for the same months', () => {
    expect(seasonFromServer({ start_month: 3, end_month: 10, days: 245, all_year: false })).toEqual(growingSeason(MUNICH));
  });

  it('wraps past December', () => {
    expect(seasonFromServer({ start_month: 10, end_month: 4, days: 212, all_year: false })).toMatchObject({
      label: 'Oct–Apr',
      runs: [
        [9, 11],
        [0, 3],
      ],
    });
  });

  it('all year and none', () => {
    expect(seasonFromServer({ start_month: 1, end_month: 12, days: 365, all_year: true })!.label).toBe('All year');
    expect(seasonFromServer(null)).toBeNull();
  });
});

describe('rainiestMonth', () => {
  it('finds the wettest month', () => {
    expect(rainiestMonth([{ month: 6, precip_mm: 116 }, { month: 7, precip_mm: 206 }, { month: 8, precip_mm: 120 }])!.month).toBe(7);
  });
});
