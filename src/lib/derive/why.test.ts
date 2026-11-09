import { describe, expect, it } from 'vitest';
import type { CropRecommendation } from '../api/types';
import { alsoGood, factorReasons, heldBack, neighbours } from './why';

function crop(metrics: Partial<CropRecommendation['suitability']['metrics']>, overall_score = 72): CropRecommendation {
  return {
    crop_id: 'kale',
    suitability: {
      overall_score,
      metrics: {
        total_gdd: 665,
        required_gdd: 700,
        adjusted_sun_hours: 5.3,
        irrigation_needed_mm: 0,
        required_water_mm: 380,
        annual_precipitation_mm: 600,
        optimal_temp_min: 15,
        optimal_temp_max: 23,
        ...metrics,
      },
    },
  } as CropRecommendation;
}

const MILD = { avg_temp_max: 24, avg_temp_min: 14, annual_precipitation_mm: 900, representative_sun_hours_daily: 6 };
const COOL = { ...MILD, avg_temp_max: 14, avg_temp_min: 6 };

describe('factorReasons', () => {
  it('matches the design wording where the data allows', () => {
    expect(factorReasons(crop({}), MILD)).toEqual({
      gdd: '665 of 700 heat units',
      sunlight: '5.3 h a day after shade',
      temperature: 'Year average inside the ideal 15–23°C',
      water: 'Rain covers its 380 mm need',
    });
  });

  it('says when heat is more than enough', () => {
    expect(factorReasons(crop({ total_gdd: 2724, required_gdd: 600 }), MILD).gdd).toBe('More than the 600 heat units it needs');
  });

  it('gives the year average when outside the ideal', () => {
    expect(factorReasons(crop({}), COOL).temperature).toBe('Year average 10°C, ideal 15–23°C');
  });

  it('falls back when the back end has no crop temperatures', () => {
    expect(factorReasons(crop({ optimal_temp_min: undefined, optimal_temp_max: undefined }), COOL).temperature).toBe('Year average 10°C');
  });

  it('explains a low water score caused by far too much rain', () => {
    expect(factorReasons(crop({ required_water_mm: 250, annual_precipitation_mm: 1325.8 }), MILD).water).toBe(
      '1,326 mm of rain, well over its 250 mm need',
    );
  });

  it('mentions watering when rain is not enough', () => {
    expect(factorReasons(crop({ irrigation_needed_mm: 113.2 }), MILD).water).toBe('Needs about 113 mm of watering');
  });
});

describe('factorReasons with v2 growing-season fields', () => {
  const v2 = (extra: object) => crop({ season_mean_temp: 18, season_precipitation_mm: 420, ...extra });

  it('talks about the growing season, not the year', () => {
    expect(factorReasons(v2({}), COOL).temperature).toBe('Growing-season average inside the ideal 15–23°C');
    expect(factorReasons(v2({ season_mean_temp: 11 }), MILD).temperature).toBe('Growing-season average 11°C, ideal 15–23°C');
  });

  it('counts rain while the crop grows', () => {
    expect(factorReasons(v2({ season_precipitation_mm: 900 }), MILD).water).toBe('900 mm of rain while it grows, more than its 380 mm need');
    expect(factorReasons(v2({}), MILD).water).toBe('Rain covers its 380 mm need');
  });

  it('explains a score capped by missing heat', () => {
    expect(factorReasons(v2({ total_gdd: 180, required_gdd: 650, heat_capped: true }), MILD).gdd).toBe(
      'Only 180 of the 650 heat units it needs to mature',
    );
  });

  it('handles a crop with no growing days', () => {
    expect(factorReasons(v2({ season_mean_temp: null }), MILD).temperature).toBe('Too cold to grow on any day');
  });
});

describe('ranking helpers', () => {
  const list = ['a', 'b', 'c', 'd', 'e'].map((crop_id) => ({ crop_id }));

  it('finds neighbours', () => {
    expect(neighbours(list, 'a')).toMatchObject({ index: 0, previous: null, next: { crop_id: 'b' } });
    expect(neighbours(list, 'e')).toMatchObject({ index: 4, previous: { crop_id: 'd' }, next: null });
    expect(neighbours(list, 'x')).toMatchObject({ index: -1, previous: null, next: null });
  });

  it('suggests the next crops, wrapping to the top', () => {
    expect(alsoGood(list, 'a').map((c) => c.crop_id)).toEqual(['b', 'c', 'd']);
    expect(alsoGood(list, 'd').map((c) => c.crop_id)).toEqual(['e', 'a', 'b']);
  });
});

describe('heldBack', () => {
  const held = (extra: object) => heldBack(crop({ season_mean_temp: 18, ...extra }));

  it('says nothing when no factor held the score back', () => {
    expect(held({ limited_by: null })).toBeNull();
    expect(held({})).toBeNull();
  });

  it('says nothing for an Excellent crop, even if the limit shaved a point off', () => {
    expect(heldBack(crop({ limited_by: 'temperature', temperature_mean: 14 }, 91))).toBeNull();
  });

  it('names temperature with the average it was judged on', () => {
    expect(held({ limited_by: 'temperature', temperature_mean: 16.2, optimal_temp_min: 20, optimal_temp_max: 30 })).toBe(
      'Held back by temperature: it averages 16°C while growing, it wants 20–30°C.',
    );
  });

  it('names heat and sun', () => {
    expect(held({ limited_by: 'heat', total_gdd: 1247, required_gdd: 1505 })).toBe(
      'Held back by heat: about 1,247 heat units here, it needs 1,505 with some to spare.',
    );
    expect(held({ limited_by: 'sun', adjusted_sun_hours: 4.26, optimal_sun_hours: 8 })).toBe('Held back by sun: 4.3 h a day after shade, it wants 8 h.');
  });
});

describe('temperature reason uses the growing-days average when present', () => {
  it('prefers temperature_mean over season_mean_temp', () => {
    expect(factorReasons(crop({ season_mean_temp: 18, temperature_mean: 11 }), MILD).temperature).toBe('Growing-season average 11°C, ideal 15–23°C');
  });
});
