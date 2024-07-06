<script lang="ts">
    import CardAdapt from "./lib/UIElements/Card/CardAdapt.svelte";
    import Header from "./lib/Header.svelte";
    import MainPicker from "./lib/ItemCards/MainPicker.svelte";
    import VideoOutput from "./lib/ItemCards/VideoOutput.svelte";
    import AudioOutput from "./lib/ItemCards/AudioOutput.svelte";
    import FileHandler from "./lib/ItemCards/FileHandler.svelte";
    import ConversionOptions from "./ts/TabOptions/ConversionOptions";
    import ConversionStatus from "./lib/ItemCards/ConversionStatus.svelte";
    import CustomInput from "./lib/ItemCards/MainCards/CustomInput.svelte";
    import {
        applicationSection,
        changedFileSave,
        currentStorageMethod,
        showOverwriteDialog,
        showScreensaver,
    } from "./ts/Writables";
    import { onMount } from "svelte";
    import { scale, slide } from "svelte/transition";
    import Metadata from "./lib/ItemCards/Metadata.svelte";
    import { GetImage } from "./ts/ImageHandler";
    import Dialog from "./lib/UIElements/Dialog.svelte";
    import Card from "./lib/UIElements/Card/Card.svelte";
    import DialogAnimationStart from "./ts/DialogAnimationStart";
    import TopDialog from "./lib/UIElements/TopDialog.svelte";
    import Settings from "./ts/TabOptions/Settings";
    import ChipContainer from "./lib/UIElements/ChipElements/ChipContainer.svelte";
    import Chip from "./lib/UIElements/ChipElements/Chip.svelte";
    import SettingsDialog from "./lib/InnerDialog/SettingsDialog.svelte";
    import CustomizationHandler from "./ts/Customization/Themes";
    import BackgroundManager from "./ts/Customization/BackgroundType";
    $: showVideo = ConversionOptions.isVideoSelected;
    $: showAudio = ConversionOptions.isAudioSelected;
    import "./ts/Customization/Screensaver";
    import "./ts/Migration";
    import ScreenSaver from "./lib/ScreenSaver.svelte";
    import FullscreenManager from "./ts/FullscreenManager";
    import RedownloadFiles from "./lib/ItemCards/RedownloadFiles.svelte";
    import AdaptiveAsset from "./lib/UIElements/AdaptiveAsset.svelte";
    import { get } from "svelte/store";
    import UpdateDialog from "./lib/UpdateDialog.svelte";
    import { getLang } from "./ts/LanguageAdapt";
    onMount(() => {
        // @ts-ignore | Fallback for randomUUID in non-secure contexts. This isn't ideal, since crypto.randomUUID is way better than Math.random(), but, since it's only used for keeping track of Chip IDs, it's fine.
        if (crypto.randomUUID === undefined)
            crypto.randomUUID = () => Math.random().toString() as any;
        const item = JSON.parse(
            localStorage.getItem("ffmpegWeb-CurrentTheme") ?? "{}",
        );
        item.name && CustomizationHandler.applyTheme(item.name, item.isDefault);
        if (Settings.backgroundContent.type !== "color")
            new BackgroundManager(document.body).apply();
    });
    let showSettings = false;
    let updateDialogShown = false;
    showScreensaver.subscribe((val) => {
        for (const item of document.querySelectorAll("video"))
            item[val ? "pause" : "play"](); // Pause the previous videos if the screensaver is enabled
        !val && FullscreenManager.remove();
    });
</script>

<Header></Header><br />
<div>
    <CardAdapt>
        <MainPicker
            on:changedMainTab={({ detail }) => ($applicationSection = detail)}
            on:enabledCard={({ detail }) =>
                detail.isVideo
                    ? (showVideo = detail.result)
                    : (showAudio = detail.result)}
        ></MainPicker>
        {#if (showVideo && $applicationSection === "MediaEnc") || $applicationSection === "Image"}
            <VideoOutput></VideoOutput>
        {/if}
        {#if showAudio && $applicationSection === "MediaEnc"}
            <AudioOutput></AudioOutput>
        {/if}
        {#if $applicationSection === "Metadata"}
            <Metadata></Metadata>
        {/if}
        <FileHandler></FileHandler>
        <ConversionStatus></ConversionStatus>
        {#if $changedFileSave}
            <RedownloadFiles></RedownloadFiles>
        {/if}
    </CardAdapt>
</div>
<div
    style="position: absolute; top: 15px; right: 15px"
    class="pointer"
    on:click={(e) => {
        DialogAnimationStart(e);
        showSettings = true;
    }}
>
    <AdaptiveAsset width={24} asset="settings"></AdaptiveAsset>
</div>

{#if showSettings}
    <Dialog closeFunction={() => (showSettings = false)}>
        <SettingsDialog on:close={() => (showSettings = false)}
        ></SettingsDialog>
    </Dialog>
{/if}

{#if $showOverwriteDialog && typeof window.nativeOperations !== "undefined"}
    <div>
        <TopDialog
            closeDialog={() => ($showOverwriteDialog = undefined)}
            indefinite={true}
            dialogId="OverwriteFile"
        >
            <p>{getLang("Found existent file")}: {$showOverwriteDialog}</p>
            <button
                style="text-decoration: underline; width: fit-content"
                on:click={() => {
                    window.nativeOperations.send("Overwrite");
                    $showOverwriteDialog = undefined;
                }}
            >
                {getLang("Overwrite")}
            </button>
        </TopDialog>
    </div>
{/if}

{#if (localStorage.getItem("ffmpegWeb-LastVersion") || window.ffmpegWebVersion) !== window.ffmpegWebVersion && !updateDialogShown}
    <UpdateDialog closeFunction={() => (updateDialogShown = true)}
    ></UpdateDialog>
{/if}
