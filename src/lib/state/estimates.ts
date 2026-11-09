import { DEFAULT_ESTIMATES, updateEstimate, type Phase } from '../derive/progress';

// Measured call durations, remembered per browser so "about N s left" improves over visits.
const KEY = 'hg-step-estimates';

export function loadEstimates(): Record<Phase, number> {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (stored && typeof stored.climate === 'number' && typeof stored.crops === 'number') return stored;
  } catch {
    // Storage blocked or corrupt: defaults are fine.
  }
  return { ...DEFAULT_ESTIMATES };
}

export function recordDuration(estimates: Record<Phase, number>, phase: Phase, ms: number): Record<Phase, number> {
  const next = { ...estimates, [phase]: updateEstimate(estimates[phase], ms) };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Not persisting is fine.
  }
  return next;
}
