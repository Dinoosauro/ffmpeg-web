<script>
    import { getLang } from "../../ts/LanguageAdapt";
    import Settings from "../../ts/TabOptions/Settings";
    import { showInstallationCard } from "../../ts/Writables";
    import AdaptiveAsset from "../UIElements/AdaptiveAsset.svelte";
    import Card from "../UIElements/Card/Card.svelte";
    let instructionType = "electron";
</script>

<Card>
    <div class="flex hcenter wcenter" style="gap: 10px">
        <AdaptiveAsset asset="apps"></AdaptiveAsset>
        <h2>{getLang("Installation")}:</h2>
    </div>
    <p>
        {getLang(
            "You can install ffmpeg-web as a Progressive Web App, or you can get way higher performances by installing the Electron application. You can find the instructions from the Select below",
        )}.
    </p>
    <select bind:value={instructionType} style="background-color: var(--row);">
        <option value="electron">Electron</option>
        <option value="pwa">Progressive Web App</option>
    </select><br /><br />
    <Card type={1}>
        {#if instructionType === "electron"}
            <ol>
                <li>
                    {getLang("Download the zip file of the repository:")}
                    <a
                        href="https://github.com/Dinoosauro/ffmpeg-web/archive/refs/heads/main.zip"
                        target="_blank">{getLang("click here")}</a
                    >
                </li>
                <li>
                    {getLang(
                        "Extract the files, and make sure to have Node.JS 20 and a native version of FFmpeg installed",
                    )}
                </li>
                <li>
                    {getLang("Run the following command to install the app:")}
                    <code>npm i && node BuildDist.cjs</code>
                </li>
                <li>
                    {getLang(
                        "And that's done! You can now run the app by writing",
                    )}
                    <code>npm run electron</code>
                    {getLang("from the command line in that folder")}
                </li>
            </ol>
        {:else}
            <ul>
                <li>
                    <strong>Chromium mobile:</strong>
                    {getLang(
                        `click on the three dots near the URL bar, and then on "Install as an app"`,
                    )}
                </li>
                <li>
                    <strong>Chromium desktop:</strong>
                    {getLang(
                        `click on the "Install app" icon at the right of the URL address`,
                    )}
                </li>
                <li>
                    <strong>Safari:</strong>
                    {getLang(
                        `share the webpage, and then click on "Add to the home"`,
                    )}
                </li>
            </ul>
        {/if}
    </Card><br />
    <button
        on:click={() => {
            Settings.showInstallationPrompt = false;
            showInstallationCard.set(false);
        }}>{getLang("Hide this card")}</button
    >
</Card>
