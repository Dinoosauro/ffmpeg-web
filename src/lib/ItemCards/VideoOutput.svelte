<script lang="ts">
    import ConversionOptions from "../../ts/TabOptions/ConversionOptions";
    import { getLang } from "../../ts/LanguageAdapt";
    import { applicationSection, reEncodeVideo } from "../../ts/Writables";
    import Card from "../UIElements/Card/Card.svelte";
    import Switch from "../UIElements/Switch.svelte";
    import BitrateSelection from "./BitrateSelection.svelte";
    import Dialog from "../UIElements/Dialog.svelte";
    import DialogAnimationStart from "../../ts/DialogAnimationStart";
    import ConversionStatus from "./ConversionStatus.svelte";
    import { GetImage } from "../../ts/ImageHandler";
    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    /**
     * If the dialog where the user can edit video filters should be shown
     */
    let showFilterDialog = false;
    /**
     * If the user has edited the pixel space settings.
     * This is recorded since, if the user wants to apply some video filters, the pixel space must be changed.
     */
    let userSuggestedPixelSpace = false;
    /**
     * Enable video filters (ex: sepia)
     * @param e the Event of the Select element
     */
    function enableVideoFilter(e: Event) {
        if (
            !userSuggestedPixelSpace &&
            (e.target as HTMLSelectElement).value !== "none"
        )
            // The user has selected a video filter, and the color space must be changed to avoid OOM
            ConversionOptions.videoOptions.pixelSpace = {
                change: true,
                with: "yuv420p",
            };
        else if (!userSuggestedPixelSpace)
            // The user has chosen not to apply a video filter, so, since they haven't edited the color filter, the video change edit will be discarded.
            ConversionOptions.videoOptions.pixelSpace = {
                change: false,
                with: "",
            };
    }
</script>

<Card>
    <div class="flex hcenter wcenter" style="gap: 10px">
        <AdaptiveAsset asset="video"></AdaptiveAsset>
        <h2>
            {getLang(
                `${$applicationSection === "Image" ? "Image" : "Video"} output:`,
            )}
        </h2>
    </div>
    <Card type={1}>
        <BitrateSelection
            type={$applicationSection === "Image" ? "image" : "video"}
        ></BitrateSelection>
    </Card><br />
    {#if $applicationSection !== "Image"}
        <Switch
            text={getLang("Keep the same FPS")}
            checked={ConversionOptions.videoOptions.fps.keepFps}
            on:change={({ detail }) =>
                (ConversionOptions.videoOptions.fps.keepFps = detail)}
        ></Switch>
        <br />
    {/if}
    {#if !ConversionOptions.videoOptions.fps.keepFps}
        <Card type={1}>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset asset="fps60" width={26}></AdaptiveAsset>
                <h3>{getLang("FPS Options:")}</h3>
            </div>
            <div class="flex hcenter divide">
                {#if $reEncodeVideo}
                    <label
                        >{getLang("Input FPS:")}
                        <input
                            type="number"
                            bind:value={ConversionOptions.videoOptions.fps
                                .inputFps}
                        />
                    </label>
                {/if}
                <label>
                    {getLang("Output FPS:")}
                    <input
                        type="number"
                        bind:value={ConversionOptions.videoOptions.fps
                            .outputFps}
                    />
                </label>
            </div>
        </Card> <br />
    {/if}
    <Switch
        text={getLang("Change aspect ratio and rotation settings")}
        on:change={({ detail }) =>
            (ConversionOptions.videoOptions.aspectRatio.isBeingEdited = detail)}
        checked={ConversionOptions.videoOptions.aspectRatio.isBeingEdited}
    ></Switch>
    {#if ConversionOptions.videoOptions.aspectRatio.isBeingEdited}
        <br />
        <Card type={1}>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset asset="slidesize" width={26}></AdaptiveAsset>
                <h3>{getLang("Aspect ratio")}:</h3>
            </div>
            <p>
                {getLang(
                    `Put "-1" as the value to skip it when elaborating arguments`,
                )}
            </p>
            <div class="flex hcenter divide">
                <label
                    >{getLang("Width:")}
                    <input
                        type="number"
                        bind:value={ConversionOptions.videoOptions.aspectRatio
                            .width}
                    />
                </label>
                <label
                    >{getLang("Height:")}
                    <input
                        type="number"
                        bind:value={ConversionOptions.videoOptions.aspectRatio
                            .height}
                    />
                </label>
            </div>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset asset="rotateleft" width={26}></AdaptiveAsset>
                <h3>{getLang("Rotation:")}</h3>
            </div>
            <select
                bind:value={ConversionOptions.videoOptions.aspectRatio.rotation}
            >
                <option value={-1}>{getLang("Don't rotate")}</option>
                {#each [{ val: 0, text: "0°" }, { val: 0.5, text: "90°" }, { val: 1, text: "180°" }, { val: 1.5, text: "270°" }] as opt}
                    <option value={opt.val}
                        >{getLang("Rotate")} {opt.text}</option
                    >
                {/each}
            </select>
        </Card>
    {/if}<br />
    <Switch
        text={getLang("Change pixel format:")}
        checked={ConversionOptions.videoOptions.pixelSpace.change}
        on:change={({ detail }) => {
            ConversionOptions.videoOptions.pixelSpace.change = detail;
            userSuggestedPixelSpace = detail;
        }}
    ></Switch>
    {#if ConversionOptions.videoOptions.pixelSpace.change}
        <br />
        <Card type={1}>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset asset="color" width={26}></AdaptiveAsset>
                <h3>{getLang("Pixel format:")}</h3>
            </div>
            <div class="flex hcenter divide">
                <p>
                    {getLang(
                        "Write the output pixel format. Leave this field blank to apply the default one",
                    )}
                </p>
                <input
                    type="text"
                    bind:value={ConversionOptions.videoOptions.pixelSpace.with}
                    style="width: 100%"
                />
            </div>
        </Card>
    {/if}
    <br /><br /><button
        on:click={(e) => {
            DialogAnimationStart(e);
            showFilterDialog = true;
        }}>{getLang("Add video filters")}</button
    >
</Card>

{#if showFilterDialog}
    <Dialog closeFunction={() => (showFilterDialog = false)}>
        <div class="flex hcenter wcenter" style="gap: 10px">
            <AdaptiveAsset asset="photofilter"></AdaptiveAsset>
            <h2>{getLang("Video filters:")}</h2>
        </div>
        <br />
        <Card type={1} forceColor={true}>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset asset="cut" width={26}></AdaptiveAsset>
                <h3>{getLang("Cut video:")}</h3>
            </div>
            <div class="flex hcenter" style="gap: 10px">
                <label class="flex hcenter" style="gap: 5px;">
                    {getLang("Width:")}
                    <input
                        type="number"
                        bind:value={ConversionOptions.videoOptions.extraFilters
                            .videoCut.width}
                    /> px;</label
                >
                <label class="flex hcenter" style="gap: 5px;"
                    >{getLang("Height:")}
                    <input
                        type="number"
                        bind:value={ConversionOptions.videoOptions.extraFilters
                            .videoCut.height}
                    /> px</label
                >
            </div>
            <div class="flex hcenter" style="gap: 10px">
                <label class="flex hcenter" style="gap: 5px"
                    >{getLang("Position")} (x):
                    <input
                        type="text"
                        bind:value={ConversionOptions.videoOptions.extraFilters
                            .videoCut.positionX}
                    /></label
                >
                <label class="flex hcenter" style="gap: 5px;"
                    >{getLang("Position")} (y):
                    <input
                        type="text"
                        bind:value={ConversionOptions.videoOptions.extraFilters
                            .videoCut.positionY}
                    /></label
                >
            </div>
        </Card><br />
        <Card type={1} forceColor={true}>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset asset="tv" width={26}></AdaptiveAsset>
                <h3>{getLang("Deinterlace video")}</h3>
            </div>
            <Switch
                text={getLang("Deinterlace video")}
                checked={ConversionOptions.videoOptions.extraFilters
                    .deinterlace}
                on:change={({ detail }) =>
                    (ConversionOptions.videoOptions.extraFilters.deinterlace =
                        detail)}
            ></Switch>
        </Card><br />
        <Card type={1} forceColor={true}>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset width={26} asset="videopersonsparkle"
                ></AdaptiveAsset>
                <h3>{getLang("Video filters:")}</h3>
            </div>
            <p>{getLang("Apply one of the following video filters:")}</p>
            <br />
            <select
                bind:value={ConversionOptions.videoOptions.extraFilters
                    .videoFilter}
                on:change={(e) => enableVideoFilter(e)}
            >
                <option value="none">None</option>
                <option value="color_negative">Negative Color</option>
                <option value="color_process">Color Process</option>
                <option value="darker">Darker</option>
                <option value="increase_contrast">Increase contrast</option>
                <option value="linear_contrast">Linear contrast</option>
                <option value="medium_contrast">Medium contrast</option>
                <option value="strong_contrast">Strong contrast</option>
                <option value="negative">Negative</option>
                <option value="vintage">Vintage</option>
            </select>
        </Card><br />
        <Card type={1} forceColor={true}>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset width={26} asset="windowconsole"></AdaptiveAsset>
                <h3>{getLang("Custom video filter:")}</h3>
            </div>
            <p>
                {getLang(
                    "Apply a custom video filter that follows the FFmpeg syntax:",
                )}
            </p>
            <br />
            <input
                type="text"
                bind:value={ConversionOptions.videoOptions.extraFilters.custom}
            />
        </Card>
    </Dialog>
{/if}

<style>
    input[type="number"] {
        width: 60px;
    }
    .divide {
        gap: 10px;
    }
    .divide > input {
        margin-left: 10px;
    }
</style>
