<script>
    import { slide } from "svelte/transition";
    import ConversionOptions from "../../../ts/TabOptions/ConversionOptions";
    import Switch from "../../UIElements/Switch.svelte";
    import ChipContainer from "../../UIElements/ChipElements/ChipContainer.svelte";
    import Chip from "../../UIElements/ChipElements/Chip.svelte";
    import EncoderInfo from "../../../ts/TabOptions/EncoderInfo";
    import { getLang } from "../../../ts/LanguageAdapt";
    import { audioBitrateSettings } from "../../../ts/Writables";
    import { createEventDispatcher } from "svelte";
    import { GetImage } from "../../../ts/ImageHandler";
    import AdaptiveAsset from "../../UIElements/AdaptiveAsset.svelte";
    const dispatch = createEventDispatcher();
    /**
     * If only the selection should be displayed, without the title
     */
    export let isMinimal = false;
</script>

<div in:slide={{ duration: 600, delay: 600 }} out:slide={{ duration: 600 }}>
    {#if !isMinimal}
        <div class="flex hcenter wcenter" style="gap: 10px">
            <AdaptiveAsset asset="convertrange"></AdaptiveAsset>
            <h2>{getLang("Conversion options:")}</h2>
        </div>
        <p>
            {getLang(
                "You can choose between lots of formats. Click on the switch to select what media type(s) you want in your final file:",
            )}
        </p>
        <Switch
            on:change={({ detail }) => {
                ConversionOptions.isVideoSelected = detail;
                dispatch("enabledCard", { isVideo: true, result: detail });
            }}
            checked={ConversionOptions.isVideoSelected}
            text={getLang("Enable video source")}
        ></Switch><br />
    {:else}
        <h4 style="margin-top: 10px">{getLang("Video codec")}:</h4>
    {/if}
</div>
{#if ConversionOptions.isVideoSelected || isMinimal}
    <span in:slide={{ duration: 600 }} out:slide={{ duration: 600 }}>
        <ChipContainer>
            <Chip
                on:userSelection={({ detail }) => {
                    ConversionOptions.videoTypeSelected = detail;
                }}
                selectionItems={Array.from(EncoderInfo.video).map((item) => {
                    return {
                        id: item[0],
                        display: `${item[1].displayName}${item[1].extension !== "!" ? ` (.${item[1].extension})` : ""}`,
                        selected:
                            item[0] === ConversionOptions.videoTypeSelected,
                    };
                })}
            ></Chip>
        </ChipContainer>
        <br />
    </span>
{/if}
{#if !isMinimal}
    <Switch
        on:change={({ detail }) => {
            ConversionOptions.isAudioSelected = detail;
            dispatch("enabledCard", { isVideo: false, result: detail });
        }}
        checked={ConversionOptions.isAudioSelected}
        text={getLang("Enable audio source")}
    ></Switch>
{:else}
    <h4 style="margin-top: 0px">{getLang("Audio codec")}:</h4>
{/if}
{#if ConversionOptions.isAudioSelected || isMinimal}
    <span in:slide={{ duration: 600 }} out:slide={{ duration: 600 }}>
        <ChipContainer>
            <Chip
                on:userSelection={({ detail }) => {
                    ConversionOptions.audioTypeSelected = detail;
                    if (detail === "libopus") {
                        ConversionOptions.audioOptions.useSlider = false;
                        audioBitrateSettings.set([true, false]);
                    } else if (EncoderInfo.audio.get(detail)?.isLossless)
                        audioBitrateSettings.set([false, true]);
                    else audioBitrateSettings.set([false, false]);
                }}
                selectionItems={Array.from(EncoderInfo.audio).map((item) => {
                    return {
                        id: item[0],
                        display: `${item[1].displayName}${item[1].extension !== "!" ? ` (.${item[1].extension})` : ""}`,
                        selected:
                            item[0] === ConversionOptions.audioTypeSelected,
                    };
                })}
            ></Chip>
        </ChipContainer>
    </span>
{/if}
