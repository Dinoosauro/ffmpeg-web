<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import Settings from "../../ts/TabOptions/Settings";
    import { getLang } from "../../ts/LanguageAdapt";
    import { GetImage } from "../../ts/ImageHandler";
    import AdaptiveAsset from "./AdaptiveAsset.svelte";
    /**
     * If the dialog should be shown at the bottom instead of at the top
     */
    export let isBottom = false;
    /**
     * The function to call to close this dialog
     */
    export let closeDialog: () => void;
    /**
     * The ID of this dialog, used so that it can be permanently hidden if the user wants to
     */
    export let dialogId: string;
    /**
     * The function that'll be change the dialog opacity before closing it.
     */
    function closeDialogReal() {
        mainDiv.style.opacity = "0";
        setTimeout(closeDialog, 300);
    }
    /**
     * If the dialog should be always visible
     */
    export let indefinite = false;
    /**
     * The text that should be shown in the TopDialog.
     * Note that this property has been added so that text can be specified progammatically also on normal TypeScript files. On Svelte files, is suggested to use a <p> inner tag.
     */
    export let alternativeText: string | undefined = undefined;
    /**
     * The div that'll contain the dialog items
     */
    let mainDiv: HTMLDivElement;
    /**
     * If the close options should be shown
     */
    let showDialogClose = false;
    !indefinite &&
        onMount(() => {
            if (!mainDiv) closeDialog();
            setTimeout(closeDialogReal, Settings.alerts.time);
            setTimeout(() => (mainDiv.style.opacity = "1"), 25);
        });
</script>

{#if Settings.alerts.show && Settings.alerts.ignored.indexOf(dialogId) === -1}
    <div
        class={`${isBottom ? "bottom" : "top"} smallDialog wcenter`}
        bind:this={mainDiv}
    >
        {#if showDialogClose}
            <div
                class="flex hcenter wcenter"
                style="gap: 10px"
                in:fade={{ delay: 250, duration: 200 }}
                out:fade={{ duration: 200 }}
            >
                <p
                    style="text-decoration: underline;"
                    on:click={closeDialogReal}
                >
                    {getLang("Close")}
                </p>
                <p
                    style="text-decoration: underline;"
                    on:click={() => {
                        Settings.alerts.ignored.push(dialogId);
                        closeDialogReal();
                    }}
                >
                    {getLang("Do not show this again")}
                </p>
            </div>
        {:else}
            <div
                class="flex hcenter"
                style="gap: 10px"
                in:fade={{ delay: 250, duration: 200 }}
                out:fade={{ duration: 200 }}
            >
                <AdaptiveAsset asset="alert"></AdaptiveAsset>
                <slot></slot>
                {#if alternativeText}
                    <p>{alternativeText}</p>
                {/if}
                <p
                    on:click={() => (showDialogClose = true)}
                    style="text-decoration: underline;"
                >
                    {getLang("Close")}
                </p>
            </div>
        {/if}
    </div>
{/if}

<style>
    .bottom {
        bottom: 5vh;
    }
    .top {
        top: 5vh;
    }
    .smallDialog {
        position: fixed;
        left: 15vw;
        width: 70vw;
        padding: 15px;
        backdrop-filter: blur(16px) brightness(30%);
        -webkit-backdrop-filter: blur(16px) brightness(30%);
        border-radius: 8px;
        border: 1px solid transparent;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        z-index: 4;
    }
</style>
