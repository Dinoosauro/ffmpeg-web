<script lang="ts">
    import { onDestroy } from "svelte";
    import { getLang } from "../../ts/LanguageAdapt";
    import { currentlyPressedKeys } from "../../ts/Writables";

    /**
     * The function that will be called for closing them
     */
    export let closeFunction = () => {};
    /**
     * The dialog container
     */
    let dialog: HTMLElement;
    const unsubscribe = currentlyPressedKeys.subscribe((val) => {
        val.indexOf("escape") !== -1 && closeAnimation();
    });
    async function closeAnimation() {
        dialog.classList.remove("simpleAnimate");
        await new Promise((resolve) => setTimeout(resolve, 15));
        dialog.classList.add("animateReverse");
        setTimeout(() => {
            // Another fix for WebKit: opacity is set to 0 since otherwise the dialog would be visible for a frame
            dialog.style.opacity = "0";
        }, 525);
        await new Promise((resolve) => setTimeout(resolve, 550));
        closeFunction();
    }
    onDestroy(unsubscribe);
</script>

<div class="dialog simpleAnimate" bind:this={dialog}>
    <div>
        <div>
            <slot></slot><br /><br />
            <button on:click={closeAnimation}>{getLang("Close dialog")}</button>
        </div>
    </div>
</div>
