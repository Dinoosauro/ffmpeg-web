<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { ChipInterface } from "../../../interfaces/chip";
    /**
     * An array of the chips to show, with their:
     * @param `id` their ID
     * @param `display`: the string that'll be shown
     * @param `selected`: if they are selected or not
     */
    export let selectionItems: ChipInterface[];
    /**
     * If the chip items shouldn't be selected. This is called `isInputChip` since originally it was used only to save of custom input arguments
     */
    export let isInputChip = false;
    /**
     * Create a dispatcher, that'll be used to comunicate to the main tab that the user has clicked on a Chip.
     */
    const dispatch = createEventDispatcher();
    /**
     * Change the item that is marked as selected
     * @param e the Click event
     */
    function changeSelected(e: Event) {
        const target = e.target as HTMLElement;
        target.parentElement
            ?.querySelector(".selected")
            ?.classList?.remove("selected");
        target.classList.add("selected");
        return true;
    }
    export let useRowColor = false;
</script>

{#each selectionItems as { display, id, selected } (id)}
    <div
        role="button"
        class={`chip${selected || isInputChip ? " selected" : ""}${isInputChip ? " chipInput" : ""}`}
        style={useRowColor ? "background-color: var(--row)" : undefined}
        on:click={(e) =>
            (!isInputChip ? changeSelected(e) : true) &&
            dispatch("userSelection", id)}
    >
        {display}
    </div>
{/each}

<style>
    .chip {
        appearance: none;
        background-color: var(--card);
        border-radius: 12px;
        padding: 5px 15px;
        flex-wrap: nowrap;
        flex-shrink: 0;
        height: 30px;
        text-align: center;
        line-height: 30px;
        transition: background-color 0.2s ease-in-out;
    }
    .chip:hover {
        cursor: pointer;
    }
</style>
