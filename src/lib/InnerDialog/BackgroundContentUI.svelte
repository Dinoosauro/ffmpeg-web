<script lang="ts">
    import BackgroundManager from "../../ts/Customization/BackgroundType";
    import { getLang } from "../../ts/LanguageAdapt";
    import IndexedDatabase from "../../ts/Storage/IndexedDatabase";
    import Settings from "../../ts/TabOptions/Settings";
    import Card from "../UIElements/Card/Card.svelte";
    import Switch from "../UIElements/Switch.svelte";
    export let type: "background" | "screenSaver" = "background";
    export let destinationContainer = document.body;
    /**
     * The Class that'll manage changing the background item for that part
     */
    const backgroundChange = new BackgroundManager(destinationContainer);
    /**
     * The YouTube Video URL
     */
    let YTUrl = "";
</script>

<select
    bind:value={Settings[
        type === "background" ? "backgroundContent" : "screenSaver"
    ].type}
    style="background-color: var(--row);"
    on:change={() => backgroundChange.apply(type === "screenSaver")}
>
    <option value="color">{getLang("The background color")}</option>
    <option value="image">{getLang("A background image")}</option>
    <option value="video">{getLang("A local video")}</option>
    {#if typeof window.nativeOperations !== "undefined" || "credentialless" in HTMLIFrameElement.prototype}
        <option value="yt">{getLang("A YouTube embed")}</option>
    {/if}
</select><br />
{#if Settings[type === "background" ? "backgroundContent" : "screenSaver"].type === "image" || Settings[type === "background" ? "backgroundContent" : "screenSaver"].type === "video"}
    <br />
    <Card forceColor={true} type={1}>
        <div class="flex" style="gap: 10px">
            <button
                on:click={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.multiple = true;
                    input.accept = `${Settings[type === "background" ? "backgroundContent" : "screenSaver"].type}/*`;
                    input.onchange = () => {
                        input.files &&
                            backgroundChange.set(
                                Array.from(input.files),
                                type === "screenSaver",
                            );
                    };
                    input.click();
                }}>{getLang("Add content")}</button
            >
            <button
                on:click={async () => {
                    await IndexedDatabase.remove({
                        db: await IndexedDatabase.db(),
                        query: `${type === "screenSaver" ? "Screensaver" : "Background"}${Settings[`${type === "screenSaver" ? "screenSaver" : "backgroundContent"}`].type === "image" ? "Image" : "Video"}`,
                    });
                    await backgroundChange.apply(type === "screenSaver");
                }}>{getLang("Delete content")}</button
            >
        </div>
        <br />
        <label class="flex hcenter" style="gap: 10px">
            {getLang("Change image after:")}
            <input
                type="number"
                bind:value={Settings[
                    type === "screenSaver" ? "screenSaver" : "backgroundContent"
                ].refreshImage}
            /> ms
        </label>
    </Card>
{/if}
{#if Settings[type === "background" ? "backgroundContent" : "screenSaver"].type === "yt"}
    <br />
    <Card forceColor={true} type={1}>
        <p>{getLang("Write a YouTube Playlist or Video URL:")}</p>
        <input type="text" bind:value={YTUrl} /><br /><br />
        <button
            on:click={() => {
                if (YTUrl === "") return;
                if (YTUrl.indexOf("&") !== -1)
                    YTUrl = YTUrl.substring(0, YTUrl.indexOf("&"));
                if (YTUrl.indexOf("watch?v=") !== -1)
                    YTUrl = YTUrl.substring(
                        YTUrl.indexOf("watch?v=") + "watch?v=".length,
                    );
                else if (YTUrl.indexOf("playlist?list=") !== -1)
                    YTUrl = `videoseries?list=${YTUrl.substring(YTUrl.indexOf("playlist?list=") + "playlist?list=".length)}`;
                else if (YTUrl.indexOf("youtu.be") !== -1)
                    YTUrl = YTUrl.substring(YTUrl.lastIndexOf("/") + 1);
                backgroundChange.set(
                    [new Blob([YTUrl], { type: "text/plain" })],
                    type === "screenSaver",
                );
            }}>{getLang("Apply URL")}</button
        >
    </Card>
{/if}
{#if Settings[type === "background" ? "backgroundContent" : "screenSaver"].type === "image" || Settings[type === "background" ? "backgroundContent" : "screenSaver"].type === "video"}
    <br />
    <Card forceColor={true} type={1}>
        <label class="flex hcenter" style="gap: 5px;"
            >{getLang("Blur")}:
            <input
                type="range"
                bind:value={Settings[
                    type === "background" ? "backgroundContent" : "screenSaver"
                ].effects.blur}
                min="0"
                max="100"
                on:change={() =>
                    type === "background" && backgroundChange.filter()}
            /></label
        ><br />
        <label class="flex hcenter" style="gap: 5px;"
            >{getLang("Brightness")}:
            <input
                type="range"
                min="0"
                max="400"
                on:change={() =>
                    type === "background" && backgroundChange.filter()}
                bind:value={Settings[
                    type === "background" ? "backgroundContent" : "screenSaver"
                ].effects.brightness}
            /></label
        ><br />
    </Card>
    {#if type === "background"}
        <br />
        <Card forceColor={true} type={1}>
            <Switch
                checked={Settings.backgroundContent.allowCardBlur}
                on:change={({ detail }) => {
                    Settings.backgroundContent.allowCardBlur = detail;
                    backgroundChange.changeCardEffect(!detail);
                }}
                text={getLang(
                    "Add blur effect also to cards (experimental; can greatly slow down ffmpeg-web)",
                )}
            ></Switch>
        </Card>
    {/if}
{/if}
