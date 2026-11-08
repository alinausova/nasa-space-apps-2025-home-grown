<script lang="ts">
    import { router } from "../router/router.svelte";

    let { size = "md" }: { size?: "sm" | "md" } = $props();
</script>

<a href={router.href({ name: "landing" })} class="flex items-center gap-2.5 text-ink no-underline">
    <svg width={size === "sm" ? 16 : 22} height={size === "sm" ? 16 : 22} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 21v-9" />
        <path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z" />
        <path d="M12 14c0-3.5-2.5-6-7-6 0 3.5 2.5 6 7 6z" />
    </svg>
    <span class="font-semibold {size === 'sm' ? 'text-sm' : 'text-lg'}">Home Grown</span>
</a>
