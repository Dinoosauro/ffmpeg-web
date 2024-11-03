<script lang="ts">
    import CustomizationHandler from "../../ts/Customization/Themes";
    import Settings from "../../ts/TabOptions/Settings";
    import {
        changedFileSave,
        currentStorageMethod,
        ffmpegVersionUsed,
        screensaverActivationTime,
        showBufSize,
        showInstallationCard,
        showScreensaver,
        updateDialogShown,
    } from "../../ts/Writables";
    import Card from "../UIElements/Card/Card.svelte";
    import Chip from "../UIElements/ChipElements/Chip.svelte";
    import ChipContainer from "../UIElements/ChipElements/ChipContainer.svelte";
    import SingleThemeOption from "./SingleThemeOption.svelte";
    import Switch from "../UIElements/Switch.svelte";
    import BackgroundContentUI from "./BackgroundContentUI.svelte";
    import BackgroundContentUi from "./BackgroundContentUI.svelte";
    import { createEventDispatcher } from "svelte";
    import { slide } from "svelte/transition";
    import OptionsPicker from "../OptionsPicker.svelte";
    import { getLang } from "../../ts/LanguageAdapt";
    import { GetImage, RerenderImageMap } from "../../ts/ImageHandler";
    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    import Themes from "../../ts/Customization/Themes";
    import ConversionOptions from "../../ts/TabOptions/ConversionOptions";
    /**
     * The CSS property that the user is editing
     */
    let opacitySelector: HTMLInputElement;
    let propertyChanged = "--text";
    /**
     * The object that contains all the CSS properties to save
     */
    let currentProperties: any = {};
    /**
     * An array that contains the CSS key of the values to edit and their description. Follows the same structure as a ChipInterface[] object.
     */
    const themeProps = [
        { id: "--text", display: "Text color", selected: true },
        { id: "--background", display: "Background color" },
        { id: "--card", display: "Card color" },
        { id: "--row", display: "Row / Second card color" },
        { id: "--select", display: "Accent color" },
    ];
    /**
     * Update the `currentProperties` object (the one that contains all the CSS values for custom theming)
     */
    function updateCurrentProperties() {
        for (const { id } of themeProps) {
            const prop = getComputedStyle(document.body).getPropertyValue(id);
            currentProperties[id] = {
                str: prop.substring(0, 7),
                opacity: prop.substring(7, 9) || "ff",
            };
        }
    }
    /**
     * The name the user wants to give to their new theme
     */
    let themeName = "";
    updateCurrentProperties();
    /**
     * From a input[type=color] event, update the custom color property
     * @param e the Event where the input value can be fetched
     */
    function setCustomColor() {
        document.body.style.setProperty(
            propertyChanged,
            `${currentProperties[propertyChanged].str}${currentProperties[propertyChanged].opacity}`,
        );
        propertyChanged === "--select" && RerenderImageMap();
        propertyChanged === "--text" && Themes.applyCustomSelect();
    }
    function convertOpacityInput(e: Event) {
        const hexOpacity = (+(e.target as HTMLInputElement).value).toString(16);
        currentProperties[propertyChanged].opacity =
            `${hexOpacity.length === 1 ? "0" : ""}${hexOpacity}`;
        setCustomColor();
    }
    /**
     * The object that contains all the custom themes made by the user
     */
    let availableThemes: any;
    /**
     * Refresh the available custom themes
     */
    function getNewTheme() {
        availableThemes = JSON.parse(
            localStorage.getItem("ffmpegWeb-CustomThemes") ?? "{}",
        );
    }
    getNewTheme();
    /**
     * An event dispatcher, currently called only when the dialog needs to be closed (e.g. for enabling the screensaver function)
     */
    const dispatch = createEventDispatcher();
    /**
     * The author of the displayed license
     */
    let showLicenseId = "2024 Dinoosauro";
    function saveLanguageChange(e: Event) {
        localStorage.setItem(
            "ffmpegWeb-SelectedLanguage",
            (e.target as HTMLInputElement).value,
        );
    }
</script>

<div class="flex hcenter wcenter" style="gap: 10px">
    <AdaptiveAsset asset="settings"></AdaptiveAsset>
    <h2>{getLang("Settings")}</h2>
</div>
<Card forceColor={true} type={1}>
    <div class="flex hcenter" style="gap: 8px">
        <AdaptiveAsset asset="windowsettings" width={26}></AdaptiveAsset>
        <h3>{getLang("FFmpeg settings:")}</h3>
    </div>
    <p>{getLang("Use the following FFmpeg version:")}</p>
    <select
        bind:value={Settings.version}
        on:change={() => ffmpegVersionUsed.set(Settings.version)}
    >
        <option value="0.11.x"
            >FFmpeg WebAssembly (0.11.x) {typeof window.nativeOperations !==
            "undefined"
                ? ""
                : `[${getLang("Suggested")}]`}</option
        >
        <option value="0.12.x"
            >FFmpeg WebAssembly (0.12.x) [{getLang(
                "Might not work on all codecs",
            )}]</option
        >
        {#if typeof window.nativeOperations !== "undefined"}
            <option value="native">Native [{getLang("Suggested")}]</option>
        {/if}
    </select>
    {#if Settings.version === "0.12.x"}
        <span in:slide={{ duration: 600 }} out:slide={{ duration: 600 }}>
            <br /><br />
            <Switch
                text={getLang(
                    "Enable multithreaded version of FFmpeg WebAssembly",
                )}
                on:change={({ detail }) => (Settings.useMultiThreaded = detail)}
                checked={Settings.useMultiThreaded}
            ></Switch>
        </span>
    {/if}<br />
    <Switch
        text={getLang("Exit after each timestamp conversion")}
        on:change={({ detail }) => (Settings.exit.afterTimestamp = detail)}
        checked={Settings.exit.afterTimestamp}
    ></Switch><br />
    <Switch
        text={getLang("Exit after each file conversion")}
        on:change={({ detail }) => (Settings.exit.afterFile = detail)}
        checked={Settings.exit.afterFile}
    ></Switch><br />
</Card>
{#if Settings.version !== "native"}
    <br />
    <Card forceColor={true} type={1}>
        <div class="flex hcenter" style="gap: 8px">
            <AdaptiveAsset asset="save" width={26}></AdaptiveAsset>

            <h3>{getLang("File output:")}</h3>
        </div>
        <select
            bind:value={Settings.storageMethod}
            on:change={() => currentStorageMethod.set(Settings.storageMethod)}
        >
            {#if typeof window.showDirectoryPicker !== "undefined"}
                <optgroup
                    label={getLang(
                        "Will replace duplicates (direct access to File System)",
                    )}
                >
                    <option value="handle"
                        >{getLang("Use the File System API")}</option
                    >
                </optgroup>
            {/if}
            <optgroup
                label={getLang(
                    "Won't replace duplicate (no access to your device's file system)",
                )}
            >
                <option value="link">{getLang("Save using a link")}</option>
                <option value="zip">{getLang("Save as a zip file")}</option>
            </optgroup>
        </select>
    </Card>
{/if}<br />
{#if $ffmpegVersionUsed === "native"}
    <Card forceColor={true} type={1}>
        <div class="flex hcenter" style="gap: 8px">
            <AdaptiveAsset asset="games" width={26}></AdaptiveAsset>

            <h3>{getLang("Hardware acceleration")}</h3>
        </div>
        <p>
            {getLang(
                "Add arguments before the FFmpeg script to allow hardware acceleration. You can find presets for most hardware acceleration providers in the select below.",
            )}
        </p>
        <select
            bind:value={Settings.hardwareAcceleration.type}
            on:change={() => {
                $showBufSize =
                    Settings.hardwareAcceleration.type === "vaapi" ||
                    Settings.hardwareAcceleration.type === "nvidia" ||
                    Settings.hardwareAcceleration.type === "amd";
                switch (Settings.hardwareAcceleration.type) {
                    case "no":
                    case "amd":
                    case "apple":
                        Settings.hardwareAcceleration.additionalProps = [];
                        break;
                    case "vaapi":
                        Settings.hardwareAcceleration.additionalProps = [
                            "-vaapi_device",
                            "/dev/dri/renderD128",
                        ].map((e) => {
                            return { id: crypto.randomUUID(), display: e };
                        });
                        ConversionOptions.videoOptions.useSlider = true;
                        break;
                    case "nvidia":
                        Settings.hardwareAcceleration.additionalProps = [
                            "-vsync",
                            "0",
                            "-hwaccel",
                            "cuda",
                            "-hwaccel_output_format",
                            "cuda",
                        ].map((e) => {
                            return { id: crypto.randomUUID(), display: e };
                        });
                        break;
                    case "intel":
                        Settings.hardwareAcceleration.additionalProps = [
                            "-init_hw_device",
                            "qsv=hw",
                        ].map((e) => {
                            return { id: crypto.randomUUID(), display: e };
                        });
                        break;
                }
            }}
        >
            <option value="no">{getLang("No hardware acceleration")}</option>
            <option value="nvidia">Nvidia (NVENC)</option>
            <option value="intel">Intel (QSV)</option>
            <option value="amd">AMD (AMF)</option>
            <option value="apple">Apple (videotoolbox)</option>
            <option value="vaapi"
                >Video Acceleration API (VAAPI, Linux only)</option
            >
            <option value="custom">{getLang("Custom syntax")}</option>
        </select>
        {#if Settings.hardwareAcceleration.type === "custom"}
            <br /><br />
            <Card forceColor={true}>
                <h4>{getLang("Custom arguments:")}</h4>
                <p>
                    {getLang(
                        "You can write custom arguments, that will be put at the start of the ffmpeg script, here.",
                    )}
                </p>
                <OptionsPicker arr="hw"></OptionsPicker>
            </Card>
        {/if}
    </Card><br />
{/if}
<Card forceColor={true} type={1}>
    <div class="flex hcenter" style="gap: 8px">
        <AdaptiveAsset asset="paintbucket" width={26}></AdaptiveAsset>

        <h3>{getLang("UI Customization:")}</h3>
    </div>
    <Card forceColor={true}>
        <h4>{getLang("Create a new theme:")}</h4>
        <p>
            {getLang(
                "You can find all the values you need to edit here. Make sure to save the theme before unloading the page!",
            )}
        </p>
        <br />
        <ChipContainer>
            <Chip
                on:userSelection={({ detail }) => (propertyChanged = detail)}
                selectionItems={themeProps}
            ></Chip>
        </ChipContainer><br />
        <div class="flex hcenter" style="gap: 10px">
            <input
                type="color"
                style="padding: 10px; background-color: var(--row)"
                bind:value={currentProperties[propertyChanged].str}
                on:input={setCustomColor}
            />
            <label>
                Opacity:
                <input
                    type="range"
                    min="0"
                    max="255"
                    value={parseInt(
                        currentProperties[propertyChanged].opacity,
                        16,
                    )}
                    bind:this={opacitySelector}
                    on:change={convertOpacityInput}
                />
            </label>
        </div>
        <br />
        <Card type={1} forceColor={true}>
            <label class="flex hcenter" style="gap: 10px">
                Theme name:
                <input type="text" bind:value={themeName} />
                <button
                    style="width: fit-content"
                    on:click={() => {
                        let obj = { ...currentProperties };
                        for (const property in obj)
                            obj[property] =
                                `${obj[property].str}${obj[property].opacity}`;
                        CustomizationHandler.saveTheme(
                            themeName || crypto.randomUUID(),
                            obj,
                        );
                        getNewTheme();
                    }}>{getLang("Save theme")}</button
                >
            </label>
        </Card>
    </Card><br />
    <Card forceColor={true}>
        <h4>{getLang("Manage current themes")}:</h4>
        <Card forceColor={true} type={1}>
            <div class="flex" style="flex-direction: column; gap: 5px">
                {#each Object.keys(CustomizationHandler.standardThemes) as key (key)}
                    <SingleThemeOption
                        {key}
                        on:themeChanged={updateCurrentProperties}
                        on:themeDeleted={getNewTheme}
                        isDefault={true}
                    ></SingleThemeOption>
                {/each}
                {#each Object.keys(availableThemes) as key (key)}
                    <SingleThemeOption
                        on:themeChanged={updateCurrentProperties}
                        on:themeDeleted={getNewTheme}
                        {key}
                    ></SingleThemeOption>
                {/each}
            </div>
        </Card>
    </Card><br />
    <Card forceColor={true}>
        <h4>{getLang("Background content:")}</h4>
        <p>{getLang("Use as background:")}</p>
        <BackgroundContentUI></BackgroundContentUI>
    </Card>
</Card><br />
<Card forceColor={true} type={1}>
    <div class="flex hcenter" style="gap: 8px">
        <AdaptiveAsset asset="screenshot" width={26}></AdaptiveAsset>

        <h3>{getLang("Screensaver:")}</h3>
    </div>
    <Switch
        text={getLang("Enable screensaver")}
        on:change={({ detail }) => (Settings.screenSaver.enabled = detail)}
        checked={Settings.screenSaver.enabled}
    ></Switch>
    {#if Settings.screenSaver.enabled}
        <br />
        <label
            class="flex hcenter"
            style="gap: 5px"
            in:slide={{ duration: 600 }}
            out:slide={{ duration: 600 }}
        >
            {getLang("Enable screensaver after")}
            <input type="number" bind:value={Settings.screenSaver.timeout} />
            ms
        </label>
        <br />
        <Card forceColor={true}>
            <h4>{getLang("Screensaver background:")}</h4>
            <BackgroundContentUi type="screenSaver"></BackgroundContentUi>
        </Card><br />
        <Card forceColor={true}>
            <h4>{getLang("Available content in the screensaver:")}</h4>
            <Switch
                text={getLang("Show file name")}
                on:change={({ detail }) =>
                    (Settings.screenSaver.options.showConversionName = detail)}
                checked={Settings.screenSaver.options.showConversionName}
            ></Switch><br />
            <Switch
                text={getLang("Show conversion progress and console output")}
                on:change={({ detail }) =>
                    (Settings.screenSaver.options.showConversionStatus =
                        detail)}
                checked={Settings.screenSaver.options.showConversionStatus}
            ></Switch><br />
            <Switch
                text={getLang("Enable screensaver in fullscreen mode")}
                checked={Settings.screenSaver.options.fullscreen}
                on:change={({ detail }) =>
                    (Settings.screenSaver.options.fullscreen = detail)}
            ></Switch>
        </Card><br />
        <label class="flex hcenter" style="gap: tpx">
            {getLang("Move content from top to bottom (and viceversa) every")}
            <input
                type="number"
                bind:value={Settings.screenSaver.options.moveContent}
            /> ms
        </label><br />
        <button
            in:slide={{ duration: 600 }}
            out:slide={{ duration: 600 }}
            on:click={() => {
                screensaverActivationTime.set(Date.now());
                showScreensaver.set(true);
                dispatch("close");
            }}>{getLang("Enable screensaver now")}</button
        >
    {/if}
</Card><br />
<Card type={1} forceColor={true}>
    <div class="flex hcenter" style="gap: 8px">
        <AdaptiveAsset width={26} asset="locallanguage"></AdaptiveAsset>
        <h3>Language:</h3>
    </div>
    <p>
        Language settings will be gradually applied. If you want to apply them
        now, refresh the page.
    </p>
    <select
        on:change={saveLanguageChange}
        value={localStorage.getItem("ffmpegWeb-SelectedLanguage") ??
            navigator.language?.substring(0, 2)}
    >
        <option value="en">English (EN)</option>
        <option value="it">Italiano (IT)</option>
    </select>
</Card><br />
<Card type={1} forceColor={true}>
    <div class="flex hcenter" style="gap: 8px">
        <AdaptiveAsset asset="alert" width={26}></AdaptiveAsset>

        <h3>{getLang("Alerts")}:</h3>
    </div>
    <Switch
        text={getLang("Enable alerts")}
        checked={Settings.alerts.show}
        on:change={({ detail }) => (Settings.alerts.show = detail)}
    ></Switch><br />
    {#if Settings.alerts.show}
        <Card forceColor={true}>
            <label class="flex hcenter" style="gap: 5px">
                {getLang("Close alert after")}
                <input type="number" bind:value={Settings.alerts.time} />
                ms
            </label><br />
            <button on:click={() => (Settings.alerts.ignored = [])}
                >{getLang("Reset ignored alerts")}</button
            >
        </Card>
    {/if}
</Card><br />
<Card type={1} forceColor={true}>
    <div class="flex hcenter" style="gap: 8px">
        <AdaptiveAsset asset="documentsave" width={26}></AdaptiveAsset>
        <h3>{getLang("Advanced file save preferences:")}</h3>
    </div>
    <Switch
        checked={Settings.fileSaver.keepInMemory}
        on:change={({ detail }) => {
            Settings.fileSaver.keepInMemory = detail;
            $changedFileSave = detail;
        }}
        text={getLang("Keep Blobs saved")}
    ></Switch><br />
    {#if !Settings.fileSaver.keepInMemory}
        <Card forceColor={true}>
            <Switch
                text={getLang(
                    "Immediately delete Blobs after download. Disable this if you aren't able to download files",
                )}
                on:change={({ detail }) =>
                    (Settings.fileSaver.revokeObjectUrl = detail)}
                checked={Settings.fileSaver.revokeObjectUrl}
            ></Switch>
        </Card><br />
    {/if}
    <Switch
        text={getLang("Save conversion preferences")}
        checked={localStorage.getItem("ffmpegWeb-SavePreferences") !== "a"}
        on:change={({ detail }) =>
            localStorage.setItem(
                "ffmpegWeb-SavePreferences",
                detail ? "b" : "a",
            )}
    ></Switch>
</Card><br />
<Card type={1} forceColor={true}>
    <div class="flex hcenter" style="gap: 8px">
        <AdaptiveAsset asset="handshake" width={26}></AdaptiveAsset>
        <h3>{getLang("Licenses")}:</h3>
    </div>
    <p>
        {getLang(
            "You can find here both the license of ffmpeg-web and the licenses of the open source libraries used for this project. Click on the switch to see them.",
        )}
    </p>
    <ChipContainer type={0}>
        <Chip
            useRowColor={true}
            on:userSelection={({ detail }) => (showLicenseId = detail)}
            selectionItems={[
                {
                    display: "ffmpeg-web",
                    id: "2024 Dinoosauro",
                    selected: true,
                },
                { display: "ffmpeg.wasm", id: "2019 Jerome Wu" },
                {
                    display: "JSZip",
                    id: "2009-2016 Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso",
                },
                {
                    display: "Electron",
                    id: "Electron contributors & 2013-2020 GitHub Inc.",
                },
                { display: "Svelte", id: "2016-24 these people" },
                { display: "context-filter-polyfill", id: "2019 David Enke" },
            ]}
        ></Chip>
    </ChipContainer><br />
    <Card forceColor={true}>
        <p>
            MIT License<br /><br />
            Copyright (c) {showLicenseId}<br /><br />
            Permission is hereby granted, free of charge, to any person obtaining
            a copy of this software and associated documentation files (the "Software"),
            to deal in the Software without restriction, including without limitation
            the rights to use, copy, modify, merge, publish, distribute, sublicense,
            and/or sell copies of the Software, and to permit persons to whom the
            Software is furnished to do so, subject to the following conditions:<br
            /><br />
            The above copyright notice and this permission notice shall be included
            in all copies or substantial portions of the Software.<br /><br />
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
            OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
            THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
            OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
            ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
            OTHER DEALINGS IN THE SOFTWARE.
        </p>
    </Card><br />
    <Card forceColor={true}>
        <h4>{getLang("About this website")}:</h4>
        <div class="flex hcenter" style="gap: 5px">
            <AdaptiveAsset asset="icon" width={24}></AdaptiveAsset>
            <strong>ffmpeg-web {window.ffmpegWebVersion}</strong>
        </div>
        <br />
        <a target="_blank" href="https://github.com/Dinoosauro/ffmpeg-web"
            >{getLang("View on GitHub")}</a
        ><br /><br />
        <Switch
            text={getLang("Show installation instructions")}
            on:change={({ detail }) => {
                Settings.showInstallationPrompt = detail;
                showInstallationCard.set(detail);
            }}
            checked={Settings.showInstallationPrompt}
        ></Switch><br />
        <button on:click={() => updateDialogShown.set(true)}
            >{getLang("Show update changelog")}</button
        >
    </Card>
</Card>
