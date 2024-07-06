<script lang="ts">
    import { createEventDispatcher } from "svelte";
    /**
     * The text to show in the Switch
     */
    export let text: string;
    /**
     * If the Switch is checked or not
     */
    export let checked: boolean = false;
    /**
     * The dispatcher that will be used when the user changes the selection
     */
    const dispatch = createEventDispatcher();
    /**
     * Send the on:change event to the main tab
     * @param e the Event
     */
    function manageChange(e: Event) {
        dispatch("change", (e.target as HTMLInputElement).checked);
    }
</script>

<label class="flex hcenter">
    <input type="checkbox" {checked} on:change={manageChange} />
    {text}
</label>

<style>
    input {
        appearance: none;
        width: 70px;
        min-width: 70px;
        height: 20px;
        border-radius: 8px;
        background-color: var(--background);
        margin-right: 10px;
        position: relative;
        transition: background-color 0.2s ease-in-out;
    }
    input::before {
        position: absolute;
        top: 3px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: var(--text);
        left: 4px;
        content: "";
        transition: 0.2s ease-in-out;
        transition-property: left background-color;
    }
    input:checked::before {
        left: 53px;
        background-color: var(--background);
    }
    input:checked {
        background-color: var(--select);
    }
    label:hover {
        cursor: pointer;
    }
</style>
