<script lang="ts">
    import { dotOpacity } from "../derive/score";

    let { score, size = 16 }: { score: number; size?: number } = $props();
</script>

<span
    aria-hidden="true"
    class="block shrink-0 rounded-full bg-bright"
    style:width="{size}px"
    style:height="{size}px"
    style:opacity={dotOpacity(score)}
></span>
