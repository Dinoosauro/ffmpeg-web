<script>
    import AdaptiveAsset from "./UIElements/AdaptiveAsset.svelte";
    import Card from "./UIElements/Card/Card.svelte";
    import Dialog from "./UIElements/Dialog.svelte";
    localStorage.setItem("ffmpegWeb-LastVersion", window.ffmpegWebVersion);
    export let closeFunction = () => {};
</script>

<Dialog {closeFunction}>
    <h2>What's new in ffmpeg-web</h2>
    <div class="flex hcenter wcenter">
        <AdaptiveAsset asset="icon" width={128}></AdaptiveAsset>
    </div>
    <h3 style="text-align: center;">Version 3.0.0:</h3>
    <Card type={1} forceColor={true}>
        <Card forceColor={true}>
            <h4>Introduction:</h4>
            <p>
                Welcome in the biggest update of ffmpeg-web! The source code has
                been completely rewritten to provide a faster and more modular
                experience. Most of your settings have been automatically
                migrated to the new version, but it might be a great idea to
                check them.<br />
                <strong
                    >If you don't care, you can find the "Close dialog" button
                    by scrolling below</strong
                >
            </p>
        </Card><br />
        <Card forceColor={true}>
            <h4>What's new:</h4>
            <ul>
                <li>
                    <strong>Support for ffmpeg.wasm 0.12:</strong> finally, you can
                    use the next version of FFmpeg WebAssembly, and this can be really
                    useful if you plan to use ffmpeg-web singlethreaded. It's still
                    suggested using the 0.11.x version of ffmpeg.wasm, since it supports
                    more codecs.
                </li>
                <li>
                    <strong>Multiple conversions:</strong> you can now run multiple
                    FFmpeg processes at the same time, and you can choose from a
                    Select the conversion you want to follow.
                </li>
                <li>
                    <strong>Screensaver:</strong> if you plan to use ffmpeg-web for
                    long conversions, you can now set a screensaver. You can choose
                    its background and the information to display there.
                </li>
                <li>
                    <strong>More customization options:</strong>
                    <ul>
                        <li>Add opacity to custom themes</li>
                        <li>
                            Use a background image, video or YouTube embed
                            instead of the background color
                        </li>
                        <li>Add blur effects</li>
                    </ul>
                </li>
                <li>
                    <strong>Improved animations:</strong> while there's still room
                    for improvement, I think the new animations are better than the
                    previous ones (thanks to Svelte)
                </li>
                <li>
                    <strong>File System API support:</strong> on Chromium-based browsers,
                    you can now save files directly on your device using the File
                    System API.
                </li>
            </ul>
        </Card><br />
        <Card forceColor={true}>
            <h4>Removed features:</h4>
            <ul>
                <li>
                    <strong>Add multiple conversions to the same zip:</strong> you
                    can still save the output files in a .zip file, but it'll be
                    downloaded at the end of each operation.
                </li>
                <li>
                    <strong>Maximum characters displayed in the console:</strong
                    > the script will automatically manage the number of lines that
                    will be displayed.
                </li>
            </ul>
        </Card><br />
        <Card forceColor={true}>
            <h4>Feedback:</h4>
            <p>
                Let me know what you think! If you need help, feel free to open
                an issue on <a
                    href="https://github.com/Dinoosauro/ffmpeg-web"
                    target="_blank">ffmpeg-web's GitHub page.</a
                >
            </p>
        </Card>
    </Card>
</Dialog>

<style>
    li {
        margin-bottom: 8px;
    }
</style>
