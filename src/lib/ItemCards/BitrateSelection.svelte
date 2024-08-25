<script lang="ts">
    import ConversionOptions from "../../ts/TabOptions/ConversionOptions";
    import { getLang } from "../../ts/LanguageAdapt";
    import Switch from "../UIElements/Switch.svelte";
    import {
        audioBitrateSettings,
        imageFormatSelected,
        showBufSize,
    } from "../../ts/Writables";
    import { slide } from "svelte/transition";
    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    import { onMount, onDestroy } from "svelte";
    import Settings from "../../ts/TabOptions/Settings";
    /**
     * The bitrate of this _type_ needs to be changed
     */
    export let type: "video" | "audio" | "image";
    /**
     * Update the bitrate value of the provided source
     * @param e the Event where the bitrate value can be obtained
     */
    function changeEvent(e: Event) {
        ConversionOptions[`${type}Options`].value = (
            e.target as HTMLInputElement
        ).value;
    }
    let showBufferSize = false;
    if (type === "video") {
        // Look if the buffer size input should be shown, and prefer using the slider in that case
        onMount(() => {
            const unsubscribe = showBufSize.subscribe((val) => {
                showBufferSize = val;
                if (Settings.hardwareAcceleration.type === "vaapi")
                    ConversionOptions.videoOptions.useSlider = true;
            });
            onDestroy(unsubscribe);
        });
    }
</script>

<div class="flex hcenter" style="gap: 8px">
    <AdaptiveAsset width={26} asset="sparkle"></AdaptiveAsset>
    <h3>{getLang("Choose bitrate:")}</h3>
</div>
{#if type !== "image" && (type !== "audio" || !$audioBitrateSettings[0]) && (type !== "video" || Settings.hardwareAcceleration.type !== "vaapi")}
    <span in:slide={{ duration: 600 }} out:slide={{ duration: 600 }}>
        <Switch
            text={getLang("Choose with a slider")}
            on:change={({ detail }) =>
                (ConversionOptions[`${type}Options`].useSlider = detail)}
            checked={ConversionOptions[`${type}Options`].useSlider}
        ></Switch><br />
    </span>
{/if}
<label>
    <input
        type={ConversionOptions[`${type}Options`].useSlider ? "range" : "text"}
        value={ConversionOptions[`${type}Options`].value}
        on:change={changeEvent}
        min={ConversionOptions[`${type}Options`].useSlider ? 1 : undefined}
        max={ConversionOptions[`${type}Options`].useSlider
            ? type === "video"
                ? 51
                : type === "image" && $imageFormatSelected === "!1"
                  ? 31
                  : type === "image"
                    ? 100
                    : 9
            : undefined}
    />
</label>
{#if ConversionOptions[`${type}Options`].useSlider}
    <br />
    <i
        >{getLang("Closer to the left:")}
        {type === "image" && $imageFormatSelected === "!1"
            ? getLang("higher quality")
            : type === "image"
              ? getLang("worse quality")
              : getLang("high bitrate")}</i
    >
    {#if showBufferSize && type === "video"}
        <br /><br />
        <label class="flex hcenter" style="gap: 10px"
            >Buffer size: <input
                type="text"
                bind:value={ConversionOptions.videoOptions.maxRate}
            /></label
        >
    {/if}
{/if}
