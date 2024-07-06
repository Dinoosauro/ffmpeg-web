<script lang="ts">
    import { getLang } from "../../ts/LanguageAdapt";

    /**
     * The function that will be called for closing them
     */
    export let closeFunction = () => {};
    /**
     * The dialog container
     */
    let dialog: HTMLElement;
</script>

<div class="dialog simpleAnimate" bind:this={dialog}>
    <div>
        <div>
            <slot></slot><br /><br />
            <button
                on:click={async () => {
                    dialog.classList.remove("simpleAnimate");
                    await new Promise((resolve) => setTimeout(resolve, 15));
                    dialog.classList.add("animateReverse");
                    setTimeout(() => {
                        // Another fix for WebKit: opacity is set to 0 since otherwise the dialog would be visible for a frame
                        dialog.style.opacity = "0";
                    }, 525);
                    await new Promise((resolve) => setTimeout(resolve, 550));
                    closeFunction();
                }}>{getLang("Close dialog")}</button
            >
        </div>
    </div>
</div>
