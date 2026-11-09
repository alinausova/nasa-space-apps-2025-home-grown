import { i18n } from '../i18n/locale.svelte';
// Analysing progress, driven by the three-call API: the climate call covers step 2 (NASA POWER),
// the crops call covers steps 3 and 4 (Landsat, then scoring, which takes milliseconds on the server).
// Results appear when the crops call returns; the summary (step 5) arrives after them.

export type StepState = 'done' | 'now' | 'todo';
export type Phase = 'climate' | 'crops';

export interface AnalysisStep {
  title: string;
  detail: string;
  /** Short label for the map chip and the mobile progress line. */
  short: string;
}

/** The five steps, worded in the active language. */
export const ANALYSIS_STEPS: readonly AnalysisStep[] = [0, 1, 2, 3, 4].map((i) => ({
  get title() {
    return i18n.m.progress[i].title;
  },
  get detail() {
    return i18n.m.progress[i].detail;
  },
  get short() {
    return i18n.m.progress[i].short;
  },
}));

/** Typical duration of each call in ms, before any have been measured (Render free tier). */
export const DEFAULT_ESTIMATES: Record<Phase, number> = { climate: 2_000, crops: 5_000 };

/** After this long on one step, mention that a sleeping server can be slow to wake. */
export const SLOW_AFTER_MS = 12_000;

export interface Timeline {
  current: number;
  states: StepState[];
  /** 0–1, for the progress bar. Stays below 1 until the crops arrive. */
  fraction: number;
  /** Whole seconds left, or null before anything has been measured. */
  secondsLeft: number | null;
}

const PHASE_STEPS: Record<Phase, { current: number; first: number; span: number }> = {
  climate: { current: 1, first: 1, span: 1 },
  crops: { current: 2, first: 2, span: 2 },
};

export function phaseTimeline(phase: Phase, stepElapsedMs: number, estimates: Record<Phase, number> = DEFAULT_ESTIMATES): Timeline {
  const { current, first, span } = PHASE_STEPS[phase];
  const n = ANALYSIS_STEPS.length;
  const within = Math.min(1, Math.max(0, stepElapsedMs / Math.max(1, estimates[phase])));

  const remainingMs =
    phase === 'climate'
      ? Math.max(0, estimates.climate - stepElapsedMs) + estimates.crops
      : Math.max(0, estimates.crops - stepElapsedMs);

  return {
    current,
    states: ANALYSIS_STEPS.map((_, i) => (i < current ? 'done' : i === current ? 'now' : 'todo')),
    fraction: Math.min(0.95, (first + within * span) / n),
    // Only promise a time once the first call has come back.
    secondsLeft: phase === 'crops' ? Math.max(1, Math.ceil(remainingMs / 1000)) : null,
  };
}

/** Step to mark as failed: the climate call fails at step 2, the crops call at step 3. */
export function failedStep(phase: Phase): number {
  return PHASE_STEPS[phase].current;
}

/** Running average of measured durations, weighted towards recent calls. */
export function updateEstimate(previous: number, measuredMs: number): number {
  return Math.round(previous * 0.7 + measuredMs * 0.3);
}
