<script>
    import { GetImage } from "../../ts/ImageHandler";
    import { getLang } from "../../ts/LanguageAdapt";
    import MetadataOptions from "../../ts/TabOptions/MetadataOptions";
    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    import Card from "../UIElements/Card/Card.svelte";
    import Chip from "../UIElements/ChipElements/Chip.svelte";
    import ChipContainer from "../UIElements/ChipElements/ChipContainer.svelte";
    import Switch from "../UIElements/Switch.svelte";
    import MetadataAdd from "./MainCards/MetadataAdd.svelte";
    /**
     * The metadata key the user wants to edit
     */
    let userSelected = "custom";
    /**
     * The custom key the user wants to edit
     */
    let userCustomKey = "";
    /**
     * The value of the key the user wants to edit
     */
    let userEditedValue = "";
</script>

<Card>
    <div class="flex hcenter wcenter" style="gap: 10px">
        <AdaptiveAsset asset="tagsearch"></AdaptiveAsset>
        <h2>{getLang("Add metadata:")}</h2>
    </div>
    <p>
        {getLang("Choose a metadata from the list below, and add its value.")}
    </p>
    <br />
    <ChipContainer>
        <Chip
            on:userSelection={({ detail }) => (userSelected = detail)}
            selectionItems={[
                { display: "Custom", id: "custom", selected: true },
                { display: "Album", id: "album" },
                { display: "Composers", id: "composer" },
                { display: "Genre", id: "genre" },
                { display: "Copyright", id: "copyright" },
                { display: "Title", id: "title" },
                { display: "Language", id: "language" },
                { display: "Song artists", id: "artist" },
                { display: "Album artists", id: "album_artist" },
                { display: "Performers", id: "performers" },
                { display: "Disc number", id: "disc" },
                { display: "Publisher", id: "publisher" },
                { display: "Track number", id: "track" },
                { display: "Lyrics", id: "lyrics" },
                { display: "Compilation", id: "compilation" },
                { display: "Published date", id: "date" },
                { display: "Creation time", id: "time" },
                { display: "Album sort name", id: "album-sort" },
                { display: "Artists sort name", id: "artist-sort" },
                { display: "Title sort name", id: "title-sort" },
            ]}
        ></Chip>
    </ChipContainer><br />
    <Card type={1}>
        {#if userSelected === "custom"}
            <label class="flex hcenter" style="gap: 5px"
                >{getLang("Custom key")}:
                <input type="text" bind:value={userCustomKey} /></label
            ><br />
        {/if}
        <label class="flex hcenter" style="gap: 5px"
            >{getLang("Value")}:
            <textarea bind:value={userEditedValue}></textarea></label
        ><br />
        <button
            on:click={() =>
                (MetadataOptions.metadataAdded = [
                    ...MetadataOptions.metadataAdded,
                    {
                        id: crypto.randomUUID(),
                        key:
                            userSelected === "custom"
                                ? userCustomKey
                                : userSelected,
                        value: userEditedValue,
                    },
                ])}>{getLang("Add metadata")}</button
        >
    </Card><br /><br />
    <Card type={1}>
        <div class="flex hcenter" style="gap: 8px">
            <AdaptiveAsset asset="addcircle"></AdaptiveAsset>
            <h3>{getLang("Added metadata:")}</h3>
        </div>
        <div style="max-height: 25vh">
            {#each MetadataOptions.metadataAdded as metadata, i (metadata.id)}
                <Card>
                    <div class="flex hcenter" style="gap: 10px">
                        <textarea
                            style="background-color: transparent;"
                            bind:value={MetadataOptions.metadataAdded[i].value}
                        ></textarea>
                        <p>({metadata.key})</p>
                        <button
                            style="width: fit-content"
                            on:click={() => {
                                const index =
                                    MetadataOptions.metadataAdded.findIndex(
                                        (item) => item.id === metadata.id,
                                    );
                                if (index !== -1) {
                                    MetadataOptions.metadataAdded.splice(
                                        index,
                                        1,
                                    );
                                    MetadataOptions.metadataAdded =
                                        MetadataOptions.metadataAdded;
                                }
                            }}>{getLang("Delete")}</button
                        >
                    </div>
                </Card><br />
            {/each}
        </div>
    </Card><br />
    <Switch
        text={getLang("Add custom album art")}
        checked={!!MetadataOptions.customAlbumArt}
        on:change={({ detail }) => {
            if (!detail) {
                MetadataOptions.customAlbumArt = false;
                return;
            }
            const input = document.createElement("input");
            input.type = "file";
            input.onchange = () => {
                if (input.files)
                    MetadataOptions.customAlbumArt = input.files[0];
            };
            input.click();
        }}
    ></Switch><br />
    <Switch
        text={getLang("Delete every video track (also the source album art)")}
        checked={MetadataOptions.deleteVideo}
        on:change={({ detail }) => (MetadataOptions.deleteVideo = detail)}
    ></Switch>
</Card>

<style>
    textarea {
        height: 35px;
        line-height: 35px;
    }
</style>
