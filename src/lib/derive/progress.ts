// v1: the back end answers in one request, so the five steps advance on elapsed time.
// The last step is never shown as done before the answer arrives, and no time-left is promised.
// TODO(redesign v2): drive the steps from the three-call API instead.

export type StepState = 'done' | 'now' | 'todo';

export interface AnalysisStep {
  title: string;
  detail: string;
  /** Short label for the map chip and the mobile progress line. */
  short: string;
}

export const ANALYSIS_STEPS: readonly AnalysisStep[] = [
  { title: 'Measured your plot', detail: '', short: 'Measuring your plot' },
  { title: 'Fetched NASA POWER climate', detail: 'A year of daily heat, sun and rain', short: 'Fetching NASA POWER climate' },
  // TODO(redesign v2): "Landsat 8/9 · 30 m detail" once the back end reads band lwir11 (it reads "lwir", which only Landsat 4-7 have).
  { title: 'Reading Landsat surface heat', detail: 'Satellite surface temperature, where scenes exist', short: 'Reading Landsat surface heat' },
  { title: 'Scoring every crop', detail: 'Heat, sun, temperature and water for each', short: 'Scoring every crop' },
  { title: 'Writing your summary', detail: 'Mistral AI, arrives with your results', short: 'Writing your summary' },
];

/** Elapsed time (ms) at which each step becomes the current one. Tuned to typical response times. */
export const STEP_STARTS_MS = [0, 300, 2_500, 6_000, 9_000] as const;

/** After this long, mention that a sleeping server can be slow to wake. */
export const SLOW_AFTER_MS = 12_000;

export interface Timeline {
  current: number;
  states: StepState[];
  /** 0–1, for the progress bar. Stays below 1 until the answer arrives. */
  fraction: number;
}

export function timeline(elapsedMs: number, finished = false): Timeline {
  const n = STEP_STARTS_MS.length;
  if (finished) return { current: n - 1, states: Array(n).fill('done'), fraction: 1 };

  let current = 0;
  for (let i = 0; i < n; i++) if (elapsedMs >= STEP_STARTS_MS[i]) current = i;

  const start = STEP_STARTS_MS[current];
  const end = current < n - 1 ? STEP_STARTS_MS[current + 1] : start + 15_000;
  const within = Math.min(1, Math.max(0, (elapsedMs - start) / (end - start)));

  return {
    current,
    states: STEP_STARTS_MS.map((_, i) => (i < current ? 'done' : i === current ? 'now' : 'todo')),
    fraction: Math.min(0.95, (current + within) / n),
  };
}

/** Step to mark as failed. Measuring happens in the browser, so the earliest failure is fetching climate data. */
export function failedStep(current: number): number {
  return Math.max(1, current);
}
