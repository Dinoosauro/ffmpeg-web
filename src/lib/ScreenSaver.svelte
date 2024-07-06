<script lang="ts">
    import { onMount } from "svelte";
    import BackgroundManager from "../ts/Customization/BackgroundType";
    import { fade } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";
    import {
        conversionFileDone,
        conversionProgress,
        conversionText,
        showScreensaver,
    } from "../ts/Writables";
    import Card from "./UIElements/Card/Card.svelte";
    import Settings from "../ts/TabOptions/Settings";
    import FullscreenManager from "../ts/FullscreenManager";
    import { getLang } from "../ts/LanguageAdapt";
    /**
     * The div where the Screensaver will be contained
     */
    let backgroundContainer: HTMLDivElement;
    onMount(() => {
        const theme = new BackgroundManager(backgroundContainer); // Get the background content for the screensaver
        theme.apply(true);
        if (Settings.screenSaver.options.showConversionStatus) {
            // The user wants to see the conversion status
            let interval = setInterval(() => {
                // Just like in the "ConversionStatus" tab, Svelte's callbacks always broke in some way. So, even here an interval will be used.
                if (!progress || !text) {
                    // The Screensaver has been destroyed. Delete the interval.
                    clearInterval(interval);
                    return;
                }
                progress.value = conversionProgress[currentConversion];
                text.textContent =
                    conversionText[currentConversion][
                        conversionText[currentConversion].length - 1
                    ] || getLang("Conversion text will appear here");
            }, 250);
        }
        const interval = setInterval(async () => {
            if (!optionContainer) {
                clearInterval(interval);
                return;
            }
            optionContainer.style.opacity = "0";
            await new Promise((resolve) => setTimeout(resolve, 390));
            for (const option of ["topMovement", "bottomMovement"])
                optionContainer.classList.toggle(option); // Switch from top to bottom and viceversa
            optionContainer.style.opacity = "1";
        }, Settings.screenSaver.options.moveContent);
        Settings.screenSaver.options.fullscreen &&
            FullscreenManager.apply(backgroundContainer);
    });
    export let currentConversion = 0;
    /**
     * The HTMLProgress element for the current conversion progress
     */
    let progress: HTMLProgressElement;
    /**
     * The paragraph in which the last console string will be copied.
     */
    let text: HTMLParagraphElement;
    let optionContainer: HTMLDivElement;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    bind:this={backgroundContainer}
    in:fade={{ duration: 400, easing: cubicInOut }}
    on:click={() => showScreensaver.set(false)}
    out:fade={{ duration: 400, easing: cubicInOut }}
    class="screenSaver"
>
    <div
        style="padding: 25px; margin-top: 10px; position: absolute; transition: opacity 0.4s ease-in-out"
        class="topMovement fullWidth"
        bind:this={optionContainer}
    >
        {#if Settings.screenSaver.options.showConversionName}
            <div class="screenContainer floatLeft">
                {#if $conversionFileDone[currentConversion][0] === 0}
                    <h1>{getLang("No conversion started")}</h1>
                {:else if $conversionFileDone[currentConversion][0] === -1}
                    <h1>
                        {getLang("The selected conversion (Conversion")}
                        {currentConversion})
                        {getLang("has ended!")}
                    </h1>
                {:else}
                    <h1>{getLang("Converting file:")}</h1>
                    <h2>«{$conversionFileDone[currentConversion][2]}»</h2>
                    <progress
                        value={$conversionFileDone[currentConversion][0] - 1}
                        max={$conversionFileDone[currentConversion][1]}
                    ></progress>
                {/if}
            </div>
        {/if}
        {#if Settings.screenSaver.options.showConversionStatus}
            <div
                class="screenContainer floatRight"
                style="float: right; width: 45%"
            >
                <Card>
                    <progress
                        style="background-color: var(--row);"
                        bind:this={progress}
                        max={1}
                    ></progress><br /><br />
                    <Card type={1}>
                        <p bind:this={text}>
                            {getLang("Conversion text will appear here")}
                        </p>
                    </Card>
                </Card>
            </div>
        {/if}
    </div>
</div>

<style>
    .screenSaver {
        position: fixed;
        z-index: 2;
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        background-color: var(--background);
        cursor: none;
    }
    h1 {
        font-size: clamp(28px, 7vw, 3em);
        margin: 0px;
    }
    h2 {
        font-size: clamp(18px, 5vw, 2.4em);
        word-break: break-all;
    }
    .screenContainer {
        max-width: calc(45% - 25px);
    }
    .floatLeft {
        float: left;
    }
    .floatRight {
        float: right;
        width: 45%;
    }
    @media (max-width: 800px) {
        .screenContainer {
            max-width: 100%;
        }
        .floatLeft {
            width: 100% !important;
        }
        .floatRight {
            float: left;
            width: 100% !important;
            margin-top: 20px;
        }
    }
</style>
