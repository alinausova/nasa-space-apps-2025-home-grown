import { describe, expect, it } from 'vitest';
import { ANALYSIS_STEPS, STEP_STARTS_MS, failedStep, timeline } from './progress';

describe('timeline', () => {
  it('has one start per step', () => {
    expect(STEP_STARTS_MS).toHaveLength(ANALYSIS_STEPS.length);
  });

  it('starts on the first step', () => {
    const t = timeline(0);
    expect(t.current).toBe(0);
    expect(t.states).toEqual(['now', 'todo', 'todo', 'todo', 'todo']);
  });

  it('advances with time', () => {
    expect(timeline(3_000).states).toEqual(['done', 'done', 'now', 'todo', 'todo']);
  });

  it('never finishes the last step on its own', () => {
    const t = timeline(120_000);
    expect(t.current).toBe(4);
    expect(t.states.at(-1)).toBe('now');
    expect(t.fraction).toBeLessThan(1);
    expect(t.fraction).toBeCloseTo(0.95);
  });

  it('progress only grows', () => {
    let last = -1;
    for (let ms = 0; ms <= 30_000; ms += 250) {
      const { fraction } = timeline(ms);
      expect(fraction).toBeGreaterThanOrEqual(last);
      last = fraction;
    }
  });

  it('is complete when finished', () => {
    const t = timeline(1_000, true);
    expect(t.states.every((s) => s === 'done')).toBe(true);
    expect(t.fraction).toBe(1);
  });
});

describe('failedStep', () => {
  it('never blames the measuring step', () => {
    expect(failedStep(0)).toBe(1);
    expect(failedStep(3)).toBe(3);
  });
});
