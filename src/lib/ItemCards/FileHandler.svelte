<script lang="ts">
    import ConversionOptions from "../../ts/TabOptions/ConversionOptions";
    import FileLogic from "../../ts/CommandBuilderLogic/FileLogic";
    import InputLogic from "../../ts/CommandBuilderLogic/InputLogic";
    import { getLang } from "../../ts/LanguageAdapt";
    import {
        applicationSection,
        currentConversionValue,
        currentStorageMethod,
    } from "../../ts/Writables";
    import Card from "../UIElements/Card/Card.svelte";
    import Switch from "../UIElements/Switch.svelte";
    import MergeLogic from "../../ts/CommandBuilderLogic/MergeLogic";
    import ImageLogic from "../../ts/CommandBuilderLogic/ImageLogic";
    import MetadataLogic from "../../ts/CommandBuilderLogic/MetadataLogic";
    import Settings from "../../ts/TabOptions/Settings";
    import { GetImage } from "../../ts/ImageHandler";
    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    /**
     * The function that picks the files, and start the conversion
     */
    function filePicker() {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.webkitdirectory = ConversionOptions.folderSelect;
        input.onchange = async () => {
            if (!input.files) return;
            $applicationSection === "Custom"
                ? InputLogic(Array.from(input.files), directoryHandle)
                : $applicationSection === "Merge"
                  ? MergeLogic(Array.from(input.files), directoryHandle)
                  : $applicationSection === "Image"
                    ? ImageLogic(Array.from(input.files), directoryHandle)
                    : $applicationSection === "Metadata"
                      ? MetadataLogic(Array.from(input.files), directoryHandle)
                      : FileLogic(Array.from(input.files), directoryHandle);
            directoryHandle = undefined;
        };
        input.click();
    }
    let directoryHandle: FileSystemDirectoryHandle | undefined;
    /**
     * Get a Directory Handle using the File System API, that'll be used for saving files.
     */
    async function askHandle() {
        try {
            directoryHandle = await window.showDirectoryPicker({
                id: "ffmpegWeb-FolderPicker",
                mode: "readwrite",
            });
        } catch (ex) {
            console.warn("Failed Directory Picker", ex);
            localStorage.setItem("ffmpegWeb-DefaultStorageMethod", "link");
        }
    }
</script>

<Card>
    <div class="flex hcenter wcenter" style="gap: 10px">
        <AdaptiveAsset asset="documentadd"></AdaptiveAsset>
        <h2>{getLang("File selection:")}</h2>
    </div>
    <Card type={1}>
        <div class="flex hcenter" style="gap: 8px">
            <AdaptiveAsset asset="documentmultiple"></AdaptiveAsset>
            <h3>{getLang("Choose files:")}</h3>
        </div>
        <p>{getLang("Choose how multiple files should be managed:")}</p>
        <select
            bind:value={ConversionOptions.conversionOption}
            disabled={$applicationSection === "Custom"}
        >
            <option value={0}>{getLang("Use only the first file")}</option>
            <option value={1}
                >{getLang("Add all the files in the output argument")}</option
            >
            <option value={2}
                >{getLang(
                    "Add the video/audio if it has the same name as the first file",
                )}</option
            >
            <option value={3}
                >{getLang(
                    "Add the video/audio if it has the same name (for each content)",
                )}</option
            >
            <option value={4}
                >{getLang("Execute the same command for each file")}</option
            >
        </select><br /><br />
        {#if $applicationSection === "Metadata" && (localStorage.getItem("ffmpegWeb-DefaultStorageMethod") === "handle" || typeof window.nativeOperations !== "undefined")}
            <p style="margin-top: 0px;">
                {getLang(
                    "Note: the selected files will be overwritten. Please make a copy of them before continuing.",
                )}
            </p>
            <br />
        {/if}
        <Switch
            text={getLang("Select a folder")}
            checked={ConversionOptions.folderSelect}
            on:change={({ detail }) =>
                (ConversionOptions.folderSelect = detail)}
        ></Switch><br />
        {#if $currentStorageMethod === "handle" && !directoryHandle}
            <button on:click={askHandle}
                >{getLang("Choose output directory")}</button
            >
        {:else}
            <button on:click={filePicker}
                >{getLang(
                    `Choose a ${ConversionOptions.folderSelect ? "folder" : "file"}`,
                )}</button
            >
        {/if}
    </Card><br />
    <Card type={1}>
        <h3>{getLang("Privacy:")}</h3>
        <Card>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset width={26} asset="shield"></AdaptiveAsset>
                <p>
                    {getLang(
                        "Your media files are locally elaborated, therefore they'll always stay on your device.",
                    )}
                </p>
            </div>
        </Card>
        <div style="height: 10px"></div>
        <Card>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset width={26} asset="code"></AdaptiveAsset>
                <p>
                    {getLang(
                        "This website connects to unpkg & Google Fonts only to fetch essential resources to work, and doesn't share any data with them.",
                    )}
                </p>
            </div>
        </Card>
        <div style="height: 10px"></div>
        <Card>
            <div class="flex hcenter" style="gap: 8px">
                <AdaptiveAsset width={26} asset="codets"></AdaptiveAsset>
                <p>
                    {getLang("This website is published under the")}
                    <a
                        href="https://github.com/dinoosauro/ffmpeg-web/blob/main/LICENSE"
                        target="_blank">{getLang("MIT license")}</a
                    >, {getLang(
                        "and you can find (and, if you want, analyze) the",
                    )}
                    <a
                        href="https://github.com/dinoosauro/ffmpeg-web"
                        target="_blank">{getLang("source code on GitHub")}</a
                    >.
                </p>
            </div>
        </Card>
    </Card>
</Card>
