(async () => {
    const fs = require("fs");
    const childProcess = require("child_process")
    const path = require("path");
    childProcess.execSync("npx vite build");
    function createDirectory(path) {
        if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
    }
    console.log(process.argv);
    console.log(path.join(__dirname, "dist", "assets", "ffmpeg12", "ffmpeg-core.worker.js"));
    const queryDownload = new Map([
        [path.join(__dirname, "dist", "assets", "ffmpeg12", "ffmpeg-core.js"), "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js"],
        [path.join(__dirname, "dist", "assets", "ffmpeg12", "ffmpeg-core.wasm"), "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm"],
        [path.join(__dirname, "dist", "assets", "ffmpeg12", "ffmpeg-core.worker.js"), "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js"],
        [path.join(__dirname, "dist", "assets", "ffmpeg11", "ffmpeg-core.js"), "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js"],
        [path.join(__dirname, "dist", "assets", "ffmpeg11", "ffmpeg-core.worker.js"), "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js"],
        [path.join(__dirname, "dist", "assets", "ffmpeg11", "ffmpeg-core.wasm"), "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm"]
    ]);
    for (const [outputPath, url] of queryDownload) {
        createDirectory(outputPath.substring(0, outputPath.lastIndexOf(path.sep)));
        fs.writeFileSync(outputPath, Buffer.from(await (await fetch(url)).arrayBuffer()));
    }
    fs.writeFileSync(path.join(__dirname, "dist", "index.html"), fs.readFileSync(path.join(__dirname, "dist", "index.html"), "utf-8").replace("<head>", "<head>\n<script>window.isLocal = true</script>"))
})()
