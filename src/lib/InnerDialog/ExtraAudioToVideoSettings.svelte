<script lang="ts">
    import { getLang } from "../../ts/LanguageAdapt";
    import ConversionOptions from "../../ts/TabOptions/ConversionOptions";
    import { albumToVideoBackground } from "../../ts/Writables";
    import AudioToVideo from "../ItemCards/MainCards/AudioToVideo.svelte";

    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    import Card from "../UIElements/Card/Card.svelte";
    import Dialog from "../UIElements/Dialog.svelte";
    import Switch from "../UIElements/Switch.svelte";
    export let closeFunction: () => void;
</script>

<Dialog {closeFunction}>
    <div class="flex hcenter wcenter" style="gap: 10px">
        <AdaptiveAsset asset="videoclip"></AdaptiveAsset>
        <h2>{getLang("Customize the output of the video:")}</h2>
    </div>
    <Card type={1} forceColor={true}>
        <div class="flex hcenter" style="gap: 8px">
            <AdaptiveAsset asset="videoclipmultiple" width={26}></AdaptiveAsset>
            <h3>{getLang("Video customization:")}</h3>
        </div>

        <label class="flex hcenter" style="gap: 5px;"
            >{getLang("Font")}:
            <input
                type="text"
                bind:value={ConversionOptions.audioToVideo.font}
            /></label
        ><br />
        <label class="flex hcenter" style="gap: 5px;"
            >{getLang("FPS (-1 for variable)")}:
            <input
                type="number"
                min="-1"
                bind:value={ConversionOptions.audioToVideo.fps}
            /></label
        ><br />
        <Switch
            checked={albumToVideoBackground.img !== undefined}
            text={getLang("Use a custom background image")}
            on:change={({ detail }) => {
                if (detail) {
                    const input = Object.assign(
                        document.createElement("input"),
                        {
                            type: "file",
                            accept: "image/*",
                            onchange: () => {
                                if (input.files) {
                                    const image = new Image();
                                    image.onload = () => {
                                        albumToVideoBackground.img = image;
                                    };
                                    image.src = URL.createObjectURL(
                                        input.files[0],
                                    );
                                }
                            },
                        },
                    );
                    input.click();
                    return;
                }
                albumToVideoBackground.img = undefined;
            }}
        ></Switch><br />
        <label class="flex hcenter" style="gap: 10px">
            {getLang("Scale")}:
            <input
                type="number"
                bind:value={ConversionOptions.audioToVideo.scale}
            />
        </label>
    </Card><br />
    <Card type={1} forceColor={true}>
        <div class="flex hcenter" style="gap: 8px">
            <AdaptiveAsset asset="imagemultiple" width={26}></AdaptiveAsset>
            <h3>{getLang("Video content:")}</h3>
        </div>
        <Switch
            text={getLang("Show album art")}
            checked={ConversionOptions.audioToVideo.content.showAlbumArt}
            on:change={({ detail }) => {
                ConversionOptions.audioToVideo.content.showAlbumArt = detail;
            }}
        ></Switch><br />
        <Switch
            text={getLang("Show essential metadata information")}
            on:change={({ detail }) => {
                ConversionOptions.audioToVideo.content.showQuickInfo = detail;
            }}
            checked={ConversionOptions.audioToVideo.content.showQuickInfo}
        ></Switch><br />
        <Switch
            text={getLang("Show all metadata information")}
            on:change={({ detail }) => {
                ConversionOptions.audioToVideo.content.showMetadataRecap =
                    detail;
            }}
            checked={ConversionOptions.audioToVideo.content.showMetadataRecap}
        ></Switch><br />
        <Switch
            text={getLang("Show the selected custom background image")}
            on:change={({ detail }) => {
                ConversionOptions.audioToVideo.content.showImportedImage =
                    detail;
            }}
            checked={ConversionOptions.audioToVideo.content.showImportedImage}
        ></Switch><br />
    </Card><br />
    <Card type={1} forceColor={true}>
        <div class="flex hcenter" style="gap: 8px">
            <AdaptiveAsset asset="videoclipwand" width={26}></AdaptiveAsset>
            <h3>{getLang("Troubleshooting:")}</h3>
        </div>
        <Switch
            text={getLang("Save temporary images on device")}
            on:change={({ detail }) => {
                ConversionOptions.audioToVideo.saveTemp = detail;
            }}
            checked={ConversionOptions.audioToVideo.saveTemp}
        ></Switch><br />
        <Switch
            text={getLang(
                "Disable 0.11.x only for this section (it might be unstable)",
            )}
            on:change={({ detail }) => {
                ConversionOptions.audioToVideo.disable011 = detail;
            }}
            checked={ConversionOptions.audioToVideo.disable011}
        ></Switch><br />
        <Switch
            text={getLang(
                "Get loop from audio duration. Disable it if you're having issues with the length of the file.",
            )}
            on:change={({ detail }) => {
                ConversionOptions.audioToVideo.useDuration = detail;
            }}
            checked={ConversionOptions.audioToVideo.useDuration}
        ></Switch><br />
        <Switch
            text={getLang(
                "Set `max_interleave_delta` to 0. This *might* help fixing wrong timestamps in Matroska files.",
            )}
            on:change={({ detail }) => {
                ConversionOptions.audioToVideo.useInterleaveDelta = detail;
            }}
            checked={ConversionOptions.audioToVideo.useInterleaveDelta}
        ></Switch><br />
        <Switch
            text={getLang(
                "Restore presentation timestamps to START. This *might* help fixing wrong timestamps.",
            )}
            on:change={({ detail }) => {
                ConversionOptions.audioToVideo.restorePTS = detail;
            }}
            checked={ConversionOptions.audioToVideo.restorePTS}
        ></Switch><br />
    </Card>
</Dialog>
