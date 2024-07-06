<script lang="ts">
    import Card from "../UIElements/Card/Card.svelte";
    import { getLang } from "../..//ts/LanguageAdapt";
    import Chip from "../UIElements/ChipElements/Chip.svelte";
    import ChipContainer from "../UIElements/ChipElements/ChipContainer.svelte";
    import { createEventDispatcher } from "svelte";
    import Switch from "../UIElements/Switch.svelte";
    import EncoderInfo from "../../ts/TabOptions/EncoderInfo";
    import ConversionOptions from "../../ts/TabOptions/ConversionOptions";
    import { audioBitrateSettings, reEncodeVideo } from "../../ts/Writables";
    import CustomInput from "./MainCards/CustomInput.svelte";
    import FileMerge from "./MainCards/FileMerge.svelte";
    import ImageConvert from "./MainCards/ImageConvert.svelte";
    import ConversionStatus from "./ConversionStatus.svelte";
    import { get } from "svelte/store";
    import TrimContent from "./TrimContent.svelte";
    import { slide } from "svelte/transition";
    import MetadataAdd from "./MainCards/MetadataAdd.svelte";
    import MediaEncoding from "./MainCards/MediaEncoding.svelte";
    const dispatch = createEventDispatcher();
    /**
     * What operation the user wants to do
     */
    let applicationPart = "MediaEnc";
    $: {
        if (applicationPart === "Merge" || applicationPart === "Image")
            ConversionOptions.trimOptions.id = 0;
    }
</script>

<Card>
    <h2 class="center">{getLang("What do you want to do?")}</h2>
    <i class="center">{getLang("Scroll to see more options")}</i><br />
    <ChipContainer>
        <Chip
            selectionItems={[
                {
                    display: getLang("Media encoding"),
                    id: "MediaEnc",
                    selected: true,
                },
                { display: getLang("Custom command"), id: "Custom" },
                { display: getLang("Merge content"), id: "Merge" },
                { display: getLang("Convert to image"), id: "Image" },
                { display: getLang("Add metadata"), id: "Metadata" },
            ]}
            on:userSelection={({ detail }) => {
                applicationPart = detail;
                dispatch("changedMainTab", detail);
            }}
        ></Chip>
    </ChipContainer>
    {#if applicationPart === "MediaEnc"}
        <MediaEncoding
            on:enabledCard={({ detail }) => dispatch("enabledCard", detail)}
        ></MediaEncoding><br />
    {:else if applicationPart === "Custom"}
        <div
            in:slide={{ duration: 600, delay: 600 }}
            out:slide={{ duration: 600 }}
        >
            <CustomInput></CustomInput><br />
        </div>
    {:else if applicationPart === "Merge"}
        <div
            in:slide={{ duration: 600, delay: 600 }}
            out:slide={{ duration: 600 }}
        >
            <FileMerge></FileMerge>
        </div>
    {:else if applicationPart === "Image"}
        <div
            in:slide={{ duration: 600, delay: 600 }}
            out:slide={{ duration: 600 }}
        >
            <ImageConvert></ImageConvert>
        </div>
    {:else if applicationPart === "Metadata"}
        <div
            in:slide={{ duration: 600, delay: 600 }}
            out:slide={{ duration: 600 }}
        >
            <MetadataAdd></MetadataAdd>
        </div>
    {/if}<br />
    {#if applicationPart !== "Merge" && applicationPart !== "Image"}
        <TrimContent></TrimContent>
    {/if}
    <br />
    <span>
        {getLang(
            "If you are re-encoding the media file, you can choose its options. Otherwise, choose the files on the next card",
        )}</span
    >
</Card>

<style>
    .center {
        text-align: center;
    }
    i {
        display: block;
    }
</style>
