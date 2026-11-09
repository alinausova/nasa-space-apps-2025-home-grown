<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

    type Variant = "primary" | "outline" | "ghost";
    type Size = "sm" | "md" | "lg";

    type Props = {
        variant?: Variant;
        size?: Size;
        href?: string;
        disabled?: boolean;
        block?: boolean;
        children: Snippet;
    } & Omit<HTMLButtonAttributes & HTMLAnchorAttributes, "children">;

    let {
        variant = "primary",
        size = "md",
        href,
        disabled = false,
        block = false,
        class: className = "",
        children,
        ...rest
    }: Props = $props();

    const sizes: Record<Size, string> = {
        sm: "h-10 px-4 text-sm tap-target",
        md: "h-[46px] px-5 text-[15px]",
        lg: "h-[50px] px-6 text-base font-semibold",
    };

    const variants: Record<Variant, string> = {
        primary: "bg-bright text-on-bright font-semibold hover:brightness-95",
        outline: "border border-ink bg-transparent text-ink hover:bg-ink/5",
        ghost: "bg-transparent text-ink hover:bg-ink/5",
    };

    let classes = $derived(
        [
            "inline-flex items-center justify-center gap-2 rounded-full no-underline transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
            sizes[size],
            disabled ? "bg-ink/10 text-ink-muted cursor-not-allowed" : variants[variant],
            disabled && variant !== "primary" ? "border-0" : "",
            block ? "w-full" : "",
            className,
        ].join(" "),
    );
</script>

{#if href && !disabled}
    <a {href} class={classes} {...rest}>{@render children()}</a>
{:else if href}
    <a role="link" aria-disabled="true" class={classes} {...rest}>{@render children()}</a>
{:else}
    <button type="button" {disabled} class={classes} {...rest}>{@render children()}</button>
{/if}
