<script lang="ts">
    import type { AnalysisStep, StepState } from "../../derive/progress";

    let {
        steps,
        states,
        failedAt = null,
    }: { steps: readonly AnalysisStep[]; states: StepState[]; failedAt?: number | null } = $props();

    const label: Record<StepState | "failed", string> = { done: "done", now: "in progress", todo: "to do", failed: "failed" };
</script>

<ol class="m-0 flex list-none flex-col p-0">
    {#each steps as step, i (step.title)}
        {@const state = failedAt === i ? "failed" : states[i]}
        <li class="grid grid-cols-[28px_minmax(0,1fr)] gap-3.5 border-t border-ink/15 py-[9px]">
            <span
                class="flex size-[26px] items-center justify-center rounded-full text-[13px] font-semibold
                    {state === 'done' ? 'bg-bright text-on-bright' : ''}
                    {state === 'now' ? 'border-2 border-bright text-ink shadow-[0_0_0_4px_rgba(34,197,94,0.2)]' : ''}
                    {state === 'todo' ? 'border border-ink/35 text-ink-muted' : ''}
                    {state === 'failed' ? 'border-[1.5px] border-warn-border bg-warn text-warn-ink' : ''}"
                aria-hidden="true"
            >
                {state === "done" ? "✓" : state === "now" ? "•" : state === "failed" ? "!" : ""}
            </span>
            <span class="flex flex-col gap-0.5">
                <span class="text-[15px] {state === 'todo' ? 'text-ink-muted' : 'font-semibold'}">
                    {step.title}<span class="sr-only">, {label[state]}</span>
                </span>
                {#if step.detail}<span class="text-[13px] text-ink-muted">{step.detail}</span>{/if}
            </span>
        </li>
    {/each}
</ol>
