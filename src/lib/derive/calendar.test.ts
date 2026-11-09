import { describe, expect, it } from 'vitest';
import { calendarRows, calendarSentence, monthRanges } from './calendar';

describe('monthRanges', () => {
  it('joins consecutive months', () => {
    expect(monthRanges([3, 4, 5])).toBe('March to May');
    expect(monthRanges([7])).toBe('July');
  });

  it('wraps past December', () => {
    expect(monthRanges([1, 2, 11, 12])).toBe('November to February');
  });

  it('lists separate runs', () => {
    expect(monthRanges([3, 4, 7])).toBe('March to April and July');
    expect(monthRanges([1, 4, 8])).toBe('January, April and August');
  });

  it('handles none and all', () => {
    expect(monthRanges([])).toBe('never');
    expect(monthRanges([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toBe('all year');
  });
});

describe('calendarRows', () => {
  it('marks months per row and names the first row by mode', () => {
    const rows = calendarRows({ mode: 'plant_out', sow: [5], grow: [5, 6], harvest: [6] });
    expect(rows.map((r) => r.label)).toEqual(['Plant out', 'Grows', 'Harvest']);
    expect(rows[0].months.filter(Boolean)).toHaveLength(1);
    expect(rows[0].months[4]).toBe(true);
    expect(rows[1].months.slice(4, 6)).toEqual([true, true]);
  });
});

describe('cuttings', () => {
  it('names the first row Plant', () => {
    expect(calendarRows({ mode: 'plant', sow: [4], grow: [4], harvest: [12] })[0].label).toBe('Plant');
  });
});

describe('calendarSentence', () => {
  it('reads the three rows', () => {
    expect(calendarSentence({ mode: 'sow', sow: [3, 4], grow: [3, 4, 5, 6], harvest: [6] })).toBe(
      'Sow March to April. Grows March to June. Harvest June.',
    );
  });
});
