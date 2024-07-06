<script lang="ts">
    import { onMount } from "svelte";
    import {
        conversionFileDone,
        conversionProgress,
        conversionText,
        currentConversionValue,
        fileUrls,
        showScreensaver,
    } from "../../ts/Writables";
    import Card from "../UIElements/Card/Card.svelte";
    import ScreenSaver from "../ScreenSaver.svelte";
    import { getLang } from "../../ts/LanguageAdapt";
    import { GetImage } from "../../ts/ImageHandler";
    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    /**
     * The progress bar
     */
    let progress: HTMLProgressElement;
    /**
     * The last string that has been printed in the Console.
     * This is saved so that the same string isn't added twice in the console card
     */
    let lastStringAdded = "";
    /**
     * The Select where the user can choose which conversion to follow
     */
    let optionSelect: HTMLSelectElement;
    /**
     * Add the operation _val_ option to the main Select
     * @param val the maximum number to add in the select
     */
    function addItemsToSelect(val: number) {
        if (!optionSelect) return;
        optionSelect.innerHTML = "";
        for (let i = 0; i < val; i++) {
            const option = document.createElement("option");
            option.value = i.toString();
            option.textContent = `Operation ${i}`;
            optionSelect.append(option);
        }
        selectChange();
    }
    currentConversionValue.subscribe(addItemsToSelect); // When a new conversion is created, update the Select possibilities.
    /**
     * Create a new paragraph with the console output
     * @param add the string to add
     */
    function newText(add: string) {
        let p = document.createElement("p");
        p.textContent = add;
        p.classList.add("smallHeight");
        document.getElementById("addContent")?.append(p);
        lastStringAdded = add;
        (document.getElementById("addContent") as HTMLElement).children.length >
            2000 && document.getElementById("addContent")?.firstChild?.remove(); // Avoid keeping too many paragraphs
    }
    onMount(() => {
        setInterval(() => {
            // I tried to debug Svelte's writable callbacks for two hours. All the attempts broke in some way. Therefore, the (not-so-)good old way is used in this way. And I hate how Svelte formats code, it makes it more horrible than it is.
            for (
                let i =
                    conversionText[+optionSelect.value].lastIndexOf(
                        lastStringAdded,
                    ) + 1;
                i < conversionText[+optionSelect.value].length;
                i++
            )
                newText(conversionText[+optionSelect.value][i]); // So, we look for the last text that has been added to the paragraph, and then we add all the new items. "+optionSelect.value" is the conversion the user is watching
            progress.value = conversionProgress[+optionSelect.value];
        }, 250);
        conversionFileDone.subscribe((update) => {
            document.title =
                update[+optionSelect.value][0] > 0
                    ? `[${update[+optionSelect.value][0]}/${update[+optionSelect.value][1]}] | ffmpeg-web | Converting file ${update[+optionSelect.value][2]}`
                    : `ffmpeg-web`;
        });
    });
    /**
     * Switch from a conversion to another, showing the last lines of text
     */
    function selectChange() {
        if (!document.getElementById("addContent")) return;
        (document.getElementById("addContent") as HTMLElement).innerHTML = "";
        for (let item of conversionText[+optionSelect.value]) newText(item);
        progress.value = conversionProgress[+optionSelect.value];
    }
</script>

<Card>
    <div class="flex hcenter wcenter" style="gap: 10px">
        <AdaptiveAsset asset="streamoutput"></AdaptiveAsset>
        <h2>{getLang("Conversion status:")}</h2>
    </div>
    <select
        style="background-color: var(--row);"
        on:change={selectChange}
        bind:this={optionSelect}
    >
    </select><br /><br />
    <Card type={1}>
        <progress max={1} bind:this={progress}></progress><br /><br />
        <Card>
            <div style="overflow: auto; max-height: 30vh" id="addContent">
                <p>{getLang("You'll see here all the logs made by ffmpeg.")}</p>
            </div>
        </Card>
    </Card>
</Card>

{#if $showScreensaver}
    <ScreenSaver currentConversion={+optionSelect.value}></ScreenSaver>
{/if}
