import { afterEach, describe, expect, it } from 'vitest';
import { detectLocale, i18n, LOCALES } from './locale.svelte';
import { formatNumber, joinList, lower, monthInitial, monthLong, monthShort } from './format';

const ALL = LOCALES;

describe('detectLocale', () => {
  it('prefers ?lang=, then the stored choice, then the browser, then English', () => {
    expect(detectLocale({ search: '?lang=de', stored: 'ru', languages: ['tr-TR'] }, ALL)).toBe('de');
    expect(detectLocale({ search: '', stored: 'ru', languages: ['tr-TR'] }, ALL)).toBe('ru');
    expect(detectLocale({ search: '', stored: null, languages: ['tr-TR', 'en'] }, ALL)).toBe('tr');
    expect(detectLocale({ search: '', stored: null, languages: ['ja-JP'] }, ALL)).toBe('en');
  });

  it('ignores languages without a finished catalog', () => {
    expect(detectLocale({ search: '?lang=de', stored: 'de', languages: ['de-DE'] }, ['en'])).toBe('en');
    expect(detectLocale({ search: '?lang=xx', stored: null, languages: [] }, ALL)).toBe('en');
  });
});

describe('formatting', () => {
  afterEach(() => (i18n.locale = 'en'));

  it('keeps English exactly as before', () => {
    i18n.locale = 'en';
    expect(formatNumber(6740)).toBe('6,740');
    expect(formatNumber(28.34, { maximumFractionDigits: 1 })).toBe('28.3');
    expect([...Array(12).keys()].map(monthShort).join(' ')).toBe('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec');
    expect([...Array(12).keys()].map(monthInitial).join('')).toBe('JFMAMJJASOND');
    expect(monthLong(8)).toBe('September');
    expect(joinList(['kale', 'cabbage', 'lettuce'])).toBe('kale, cabbage and lettuce');
    expect(joinList(['kale'])).toBe('kale');
    expect(lower('Kale')).toBe('kale');
  });

  it('follows the active language', () => {
    i18n.locale = 'de';
    expect(formatNumber(6740)).toBe('6.740');
    expect(joinList(['a', 'b', 'c'])).toBe('a, b und c');
    i18n.locale = 'ru';
    expect(monthLong(2)).toMatch(/^март/);
    expect(monthInitial(0)).toBe('Я');
  });

  it('lower-cases Turkish with Turkish rules', () => {
    i18n.locale = 'tr';
    expect(lower('ISPANAK')).toBe('ıspanak');
    expect(lower('İncir')).toBe('incir');
  });
});
