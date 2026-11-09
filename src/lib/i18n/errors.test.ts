import { describe, expect, it } from 'vitest';
import { errorSentence } from './errors';

describe('errorSentence', () => {
  it('words each kind of failure', () => {
    expect(errorSentence(null)).toBe('We could not reach the Home Grown server.');
    expect(errorSentence(429)).toMatch(/Too many analyses/);
    expect(errorSentence(404)).toMatch(/no longer in memory/);
    expect(errorSentence(502)).toMatch(/data sources had a problem/);
    expect(errorSentence(422)).toBe('The server could not use this plot.');
    expect(errorSentence(418)).toBe('The server answered with 418.');
  });
});
