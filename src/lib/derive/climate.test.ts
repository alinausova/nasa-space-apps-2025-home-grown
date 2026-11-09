import { describe, expect, it } from 'vitest';
import type { MonthlyTemperature } from '../api/types';
import { describeClimate, rainiestMonth, seasonFromServer, warmestMonth } from './climate';

function months(avgs: number[]): MonthlyTemperature[] {
  return avgs.map((avg, i) => ({ month: i + 1, month_name: '', avg_temp: avg, avg_temp_max: avg + 5, avg_temp_min: avg - 5 }));
}

// Real fixture values (NASA POWER 2023).
const MUNICH = months([1.5, 2.1, 6.0, 6.7, 12.5, 17.7, 19.4, 19.6, 17.8, 13.2, 4.3, 2.2]);
const SVALBARD = months([-7.2, -9.0, -16.1, -8.0, -4.3, 1.4, 5.6, 4.7, -1.6, -6.9, -9.9, -9.5]);

describe('warmestMonth', () => {
  it('finds July in Svalbard', () => {
    expect(warmestMonth(SVALBARD)!.month).toBe(7);
  });
});

describe('describeClimate', () => {
  it('summarises highs, lows and season', () => {
    const text = describeClimate(MUNICH, seasonFromServer({ start_month: 3, end_month: 10, days: 245, all_year: false }));
    expect(text).toContain('Daily highs from 7 degrees in Jan to 25 in Aug');
    expect(text).toContain('Growing season Mar to Oct.');
  });
});

describe('seasonFromServer', () => {
  it('Munich: March to October, band starts on March', () => {
    expect(seasonFromServer({ start_month: 3, end_month: 10, days: 245, all_year: false })).toEqual({
      months: [2, 3, 4, 5, 6, 7, 8, 9],
      runs: [[2, 9]],
      label: 'Mar–Oct',
      days: 245,
    });
  });

  it('a single month', () => {
    expect(seasonFromServer({ start_month: 7, end_month: 7, days: 31, all_year: false })).toMatchObject({ label: 'Jul', months: [6] });
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
