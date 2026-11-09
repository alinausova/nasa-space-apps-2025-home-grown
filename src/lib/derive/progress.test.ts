import { describe, expect, it } from 'vitest';
import { ANALYSIS_STEPS, DEFAULT_ESTIMATES, failedStep, phaseTimeline, updateEstimate } from './progress';

describe('phaseTimeline', () => {
  it('climate call: measuring done, NASA in progress, no time promised yet', () => {
    const t = phaseTimeline('climate', 500);
    expect(t.states).toEqual(['done', 'now', 'todo', 'todo', 'todo']);
    expect(t.secondsLeft).toBeNull();
  });

  it('crops call: NASA done, Landsat in progress, time left from the estimate', () => {
    const t = phaseTimeline('crops', 2_000, { climate: 1_000, crops: 5_000 });
    expect(t.states).toEqual(['done', 'done', 'now', 'todo', 'todo']);
    expect(t.secondsLeft).toBe(3);
  });

  it('never claims zero seconds while still waiting', () => {
    expect(phaseTimeline('crops', 60_000).secondsLeft).toBe(1);
  });

  it('progress grows through the phases and stays below 1', () => {
    let last = -1;
    for (const [phase, ms] of [['climate', 0], ['climate', 1_000], ['climate', 5_000], ['crops', 0], ['crops', 3_000], ['crops', 60_000]] as const) {
      const { fraction } = phaseTimeline(phase, ms, DEFAULT_ESTIMATES);
      expect(fraction).toBeGreaterThanOrEqual(last);
      expect(fraction).toBeLessThan(1);
      last = fraction;
    }
  });

  it('has one state per step', () => {
    expect(phaseTimeline('crops', 0).states).toHaveLength(ANALYSIS_STEPS.length);
  });
});

describe('failedStep', () => {
  it('maps each call to the step it covers', () => {
    expect(failedStep('climate')).toBe(1);
    expect(failedStep('crops')).toBe(2);
  });
});

describe('updateEstimate', () => {
  it('moves towards measured durations', () => {
    expect(updateEstimate(5_000, 3_000)).toBe(4_400);
    expect(updateEstimate(5_000, 5_000)).toBe(5_000);
  });
});
