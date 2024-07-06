<script lang="ts">
    import { onMount } from "svelte";
    import {
        GetImage,
        UpdateImageMap,
        type AvailableAssets,
    } from "../../ts/ImageHandler";

    export let asset: AvailableAssets;
    export let width = 32;
    let image: HTMLImageElement;
    onMount(() => UpdateImageMap(image, asset));
</script>

<img {width} height={width} src={GetImage(asset)} bind:this={image} />
