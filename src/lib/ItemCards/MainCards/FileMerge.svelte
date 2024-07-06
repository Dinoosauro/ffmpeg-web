<script>
    import { GetImage } from "../../../ts/ImageHandler";
    import { getLang } from "../../../ts/LanguageAdapt";
    import MergeOptions from "../../../ts/TabOptions/MergeOptions";
    import AdaptiveAsset from "../../UIElements/AdaptiveAsset.svelte";
    import Switch from "../../UIElements/Switch.svelte";
</script>

<div class="flex hcenter wcenter" style="gap: 10px">
    <AdaptiveAsset asset="merge"></AdaptiveAsset>
    <h2>{getLang("Merge files:")}</h2>
</div>
<p>
    {getLang(
        "Files will be merged without re-encoding. Write the output file name, with its extension, below.",
    )}
</p>
<input
    type="text"
    bind:value={MergeOptions.fileName}
    style="background-color: var(--row)"
/><br /><br />
<Switch
    checked={MergeOptions.keepAlbumArt}
    on:change={({ detail }) => (MergeOptions.keepAlbumArt = detail)}
    text={getLang(
        "Keep the album art (or the thumbnail) of the first file. Disable it if there are issues with the conversion.",
    )}
></Switch>
