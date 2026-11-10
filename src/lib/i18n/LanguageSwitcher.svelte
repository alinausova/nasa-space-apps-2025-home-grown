<script lang="ts">
    import { AVAILABLE, ENDONYMS, i18n, type Locale } from "./locale.svelte";

    /** compact: show the language code ("DE") below the lg breakpoint, the full name from lg up. */
    let { class: className = "", compact = false }: { class?: string; compact?: boolean } = $props();
</script>

{#if AVAILABLE.length > 1}
    <label class="relative inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm text-ink {className}" data-testid="language-switcher">
        <span class="sr-only">{i18n.m.shell.language}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
        <!-- Visible text; the native select sits on top, transparent, so the OS picker opens on tap. -->
        <span aria-hidden="true">
            {#if compact}<span class="uppercase lg:hidden">{i18n.locale === "pseudo" ? "XX" : i18n.locale}</span>{/if}
            <span class={compact ? "hidden lg:inline" : ""}>{ENDONYMS[i18n.locale]}</span>
        </span>
        <select
            class="absolute inset-0 cursor-pointer appearance-none opacity-0"
            value={i18n.locale}
            onchange={(event) => i18n.set(event.currentTarget.value as Locale)}
        >
            {#each AVAILABLE as locale (locale)}
                <option value={locale} lang={locale === "pseudo" ? "en" : locale}>{ENDONYMS[locale]}</option>
            {/each}
        </select>
    </label>
{/if}
