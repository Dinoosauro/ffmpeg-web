<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getLang } from "../../../ts/LanguageAdapt";
    import ConversionOptions from "../../../ts/TabOptions/ConversionOptions";

    import AdaptiveAsset from "../../UIElements/AdaptiveAsset.svelte";
    import Card from "../../UIElements/Card/Card.svelte";
    import MediaEncoding from "./MediaEncoding.svelte";
    import { slide } from "svelte/transition";
    export let showExtraDialog: () => void;
</script>

<div class="flex hcenter wcenter" style="gap: 10px">
    <AdaptiveAsset asset="windowconsole"></AdaptiveAsset>
    <h2>{getLang("Music to video:")}</h2>
</div>
<p>
    {getLang(
        "Select the audio files. We'll use ffmpeg to fetch the album art and the metadata, and we'll create some images with them.",
    )}
</p>
<br />
<label class="flex hcenter" style="gap: 10px">
    {getLang("Output container (extension):")}
    <input type="text" bind:value={ConversionOptions.audioToVideo.extension} />
</label><br />
<Card type={1}>
    <h3>{getLang("Output codecs:")}</h3>
    <p>
        {getLang(
            "It might be a good idea keeping the original audio and video file, but you can still choose the output codec, and its bitrate",
        )}
    </p>
    <div in:slide={{ duration: 600, delay: 600 }} out:slide={{ duration: 600 }}>
        <Card>
            <MediaEncoding isMinimal={true}></MediaEncoding><br />
            <label class="flex hcenter" style="gap: 10px">
                {getLang("Video bitrate:")}"
                <input
                    type="text"
                    bind:value={ConversionOptions.audioToVideo.videoBitrate}
                />
            </label><br />
            <label class="flex hcenter" style="gap: 10px">
                {getLang("Audio bitrate:")}
                <input
                    type="text"
                    bind:value={ConversionOptions.audioToVideo.audioBitrate}
                />
            </label><br />
        </Card>
    </div>
    <br />
    <button on:click={showExtraDialog}
        >{getLang("Show advanced settings")}</button
    >
</Card>
