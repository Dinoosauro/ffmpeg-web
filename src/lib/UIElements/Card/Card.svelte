<script lang="ts">
    import { fade, blur, slide } from "svelte/transition";
    /**
     * The card type. If put to `1`, the `var(--row)` color will be used
     */
    export let type = 0;
    /**
     * Force the card to keep a specific color, even if the user has enabled card blur
     * This must be applied especially for card dialogs
     */
    export let forceColor = false;
    /**
     * The delay to apply before showing the card
     */
    export let inDelay = 0;
</script>

<div
    in:slide={{ duration: 600, delay: inDelay }}
    out:slide={{ duration: 600 }}
    class={`card ${forceColor ? `card${type}Force` : "backdropCard"} card${type}`}
>
    <slot></slot>
</div>
