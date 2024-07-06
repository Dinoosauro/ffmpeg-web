<script lang="ts">
    import { onMount } from "svelte";

    import Settings from "../../ts/TabOptions/Settings";
    import Card from "../UIElements/Card/Card.svelte";
    import Switch from "../UIElements/Switch.svelte";
    import { fileUrls } from "../../ts/Writables";
    import { getLang } from "../../ts/LanguageAdapt";
    import { GetImage } from "../../ts/ImageHandler";
    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    /**
     * The link that'll be used for re-downloading the file
     */
    let showLink = "";
    /**
     * The Select that allows the user to choose which file to redownload
     */
    let redownloadSelect: HTMLSelectElement;
    onMount(() => {
        fileUrls.subscribe((val) => {
            // fileUrls is the property where all the file URLs and names are contained. In this case, it's created an option for every file available
            if (!redownloadSelect) return;
            redownloadSelect.innerHTML = "";
            for (const { path, name } of val) {
                const option = document.createElement("option");
                option.value = path;
                option.textContent = name;
                redownloadSelect.append(option);
            }
            changeSelect();
        });
    });
    function changeSelect() {
        showLink =
            $fileUrls.find((e) => e.path === redownloadSelect.value)?.path ??
            "";
    }
</script>

<Card>
    <div class="flex hcenter wcenter">
        <AdaptiveAsset asset="documentqueue"></AdaptiveAsset>
        <h2>{getLang("Re-download files")}</h2>
    </div>
    <Card type={1}>
        <p>
            {getLang("Choose from the select below the files to re-download.")}
        </p>
        <select on:change={() => changeSelect()} bind:this={redownloadSelect}>
        </select>
        {#if (showLink || "") !== ""}
            <br /><br />
            <Card>
                <a
                    href={$fileUrls.find((e) => e.path === showLink)?.path}
                    download={$fileUrls.find((e) => e.path === showLink)?.name}
                    >{getLang("Download file")}</a
                ><br /><br />
                <button
                    on:click={() => {
                        URL.revokeObjectURL(showLink);
                        fileUrls.update((val) => {
                            val.splice(
                                val.findIndex((e) => e.path === showLink),
                                1,
                            );
                            return [...val];
                        });
                    }}>{getLang("Delete Blob from memory")}</button
                >
            </Card>
        {/if}
    </Card>
</Card>
