<script lang="ts">
    import type { ChipInterface } from "../interfaces/chip";
    import InputOptions from "../ts/TabOptions/InputOptions";
    import Settings from "../ts/TabOptions/Settings";
    import Chip from "./UIElements/ChipElements/Chip.svelte";
    import ChipContainer from "./UIElements/ChipElements/ChipContainer.svelte";
    /**
     * The supported fields for this component.
     */
    export let arr: "input" | "hw";
    /**
     * The text that has been written in the textbox
     */
    let writtenText = "";
    /**
     * Add the written item as an argument
     */
    function addItem() {
        if (arr === "input")
            InputOptions.val = [
                ...InputOptions.val,
                { id: crypto.randomUUID(), display: writtenText },
            ];
        else if (arr === "hw")
            InputOptions.val = [
                ...Settings.hardwareAcceleration.additionalProps,
                { id: crypto.randomUUID(), display: writtenText },
            ];
    }
</script>

<div class="flex" style="gap: 10px;">
    <input
        type="text"
        style="background-color: var(--row);"
        bind:value={writtenText}
        on:keydown={(e) => {
            if (e.key === "Tab") {
                // Setup "Tab" shortcut
                e.preventDefault();
                addItem();
            }
        }}
    />
    <button style="width: fit-content;" on:click={addItem}>Add</button>
</div>
<br />
<ChipContainer>
    <Chip
        selectionItems={arr === "input"
            ? InputOptions.val
            : Settings.hardwareAcceleration.additionalProps}
        isInputChip={true}
        on:userSelection={({ detail }) => {
            const index = (
                arr === "input"
                    ? InputOptions.val
                    : Settings.hardwareAcceleration.additionalProps
            ).findIndex((e) => e.id === detail);
            if (index !== -1) {
                (arr === "input"
                    ? InputOptions.val
                    : Settings.hardwareAcceleration.additionalProps
                ).splice(index, 1);
                if (arr === "input") InputOptions.val = InputOptions.val;
                else if (arr === "hw")
                    Settings.hardwareAcceleration.additionalProps =
                        Settings.hardwareAcceleration.additionalProps;
            }
        }}
    ></Chip>
</ChipContainer>
