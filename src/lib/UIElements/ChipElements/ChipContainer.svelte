<script lang="ts">
    import Card from "../Card/Card.svelte";
    export let type = 1;
</script>

<!--The container for the Chip elements, that permits to have them all on a single row-->
<Card {type}>
    <div class="flex chipContainer">
        <slot></slot>
    </div>
</Card>

<style>
    .chipContainer {
        overflow: auto;
        gap: 5px;
        padding-bottom: 10px;
    }
</style>
