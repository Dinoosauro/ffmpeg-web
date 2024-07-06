<script>
    import ConversionOptions from "../../ts/TabOptions/ConversionOptions";
    import { getLang } from "../../ts/LanguageAdapt";
    import Card from "../UIElements/Card/Card.svelte";
    import Switch from "../UIElements/Switch.svelte";
    import BitrateSelection from "./BitrateSelection.svelte";
    import ConversionStatus from "./ConversionStatus.svelte";
    import { audioBitrateSettings } from "../../ts/Writables";
    import Dialog from "../UIElements/Dialog.svelte";
    import DialogAnimationStart from "../../ts/DialogAnimationStart";
    import { GetImage } from "../../ts/ImageHandler";
    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    /**
     * If the "Audio filters" dialog should be shown or not
     */
    let showFilterDialog = false;
</script>

<Card>
    <div class="flex hcenter wcenter" style="gap: 10px">
        <AdaptiveAsset asset="musicnote"></AdaptiveAsset>
        <h2>{getLang("Audio output:")}</h2>
    </div>
    {#if !$audioBitrateSettings[1]}
        <Card type={1}>
            <BitrateSelection type="audio"></BitrateSelection>
        </Card><br />
    {/if}
    <div class="flex hcenter">
        <p>{getLang("Audio channels:")}</p>
        <select
            style="background-color: var(--row);"
            bind:value={ConversionOptions.audioOptions.channels}
        >
            <option value={-1}>{getLang("Default")}</option>
            <option value={1}>{getLang("Mono")}</option>
            <option value={2}>{getLang("Stereo")}</option>
        </select>
    </div>
    <br />
    <Switch
        text={getLang("Keep album art")}
        on:change={({ detail }) =>
            (ConversionOptions.audioOptions.keepAlbumArt = detail)}
        checked={ConversionOptions.audioOptions.keepAlbumArt}
    ></Switch><br />
    <Switch
        checked={ConversionOptions.forceCopyMetadata}
        on:change={({ detail }) =>
            (ConversionOptions.forceCopyMetadata = detail)}
        text={getLang(
            "Copy all the metadata at the end. Enable this only if FFmpeg, by default, has discarded some metadata. This applies both for video and audio formats.",
        )}
    ></Switch><br /><br />
    <button
        on:click={(e) => {
            DialogAnimationStart(e);
            showFilterDialog = true;
        }}>{getLang("Add audio filters")}</button
    >
</Card>

{#if showFilterDialog}
    <Dialog closeFunction={() => (showFilterDialog = false)}>
        <div class="flex hcenter wcenter" style="gap: 10px">
            <AdaptiveAsset asset="musicnote2"></AdaptiveAsset>
            <h2>{getLang("Audio filters:")}</h2>
        </div>
        <br />
        <Card type={1} forceColor={true}>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset asset="volume2" width={26}></AdaptiveAsset>
                <h3>{getLang("Audio volume:")}</h3>
            </div>
            <label class="flex hcenter" style="gap: 5px;"
                >{getLang("Change loudness: add")}
                <input
                    type="number"
                    bind:value={ConversionOptions.audioOptions.extraFilters
                        .audioDB}
                />
                {getLang("decibels")}
            </label>
        </Card><br />
        <Card type={1} forceColor={true}>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset asset="speakermute" width={26}></AdaptiveAsset>
                <h3>{getLang("Noise removal:")}</h3>
            </div>
            <label class="flex hcenter" style="gap: 5px">
                {getLang("Remove noise:")}
                <input
                    type="number"
                    bind:value={ConversionOptions.audioOptions.extraFilters
                        .noiseRemoval.noise}
                />
                {getLang("decibels")}
            </label><br />
            <label class="flex hcenter" style="gap: 5px">
                Noise floor:
                <input
                    type="number"
                    bind:value={ConversionOptions.audioOptions.extraFilters
                        .noiseRemoval.floor}
                />
                hz
            </label>
        </Card><br />
        <Card type={1} forceColor={true}>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset asset="windowconsole" width={26}></AdaptiveAsset>
                <h3>{getLang("Custom audio filter:")}</h3>
            </div>
            <p>
                {getLang(
                    "Apply a custom audio filter that follows the FFmpeg syntax:",
                )}
            </p>
            <br />
            <input
                type="text"
                bind:value={ConversionOptions.audioOptions.extraFilters.custom}
            />
        </Card>
    </Dialog>
{/if}
