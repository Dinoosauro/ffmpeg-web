<script lang="ts">
    import { onDestroy } from "svelte";
    import { getLang } from "../../ts/LanguageAdapt";
    import { currentlyPressedKeys } from "../../ts/Writables";

    /**
     * Move the "Close dialog" button at the top of the UI
     */
    export let closeAtTop = false;

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
            {#if closeAtTop}
                <button on:click={closeAnimation}
                    >{getLang("Close dialog")}</button
                ><br /><br />
            {/if}
            <slot></slot>
            {#if !closeAtTop}
                <br /><br /><button on:click={closeAnimation}
                    >{getLang("Close dialog")}</button
                >
            {/if}
        </div>
    </div>
</div>
