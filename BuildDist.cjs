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
        [path.join(__dirname, "dist", "assets", "ffmpeg12", "ffmpeg-coremt.js"), "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.js"],
        [path.join(__dirname, "dist", "assets", "ffmpeg12", "ffmpeg-coremt.wasm"), "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.wasm"],
        [path.join(__dirname, "dist", "assets", "ffmpeg12", "ffmpeg-core.worker.js"), "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js"],
        [path.join(__dirname, "dist", "assets", "ffmpeg11", "ffmpeg-core.js"), "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js"],
        [path.join(__dirname, "dist", "assets", "ffmpeg11", "ffmpeg-core.worker.js"), "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js"],
        [path.join(__dirname, "dist", "assets", "ffmpeg11", "ffmpeg-core.wasm"), "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm"]
    ]);
    for (const [outputPath, url] of queryDownload) {
        console.log(url);
        createDirectory(outputPath.substring(0, outputPath.lastIndexOf(path.sep)));
        fs.writeFileSync(outputPath, Buffer.from(await (await fetch(url)).arrayBuffer()));
    }
    fs.writeFileSync(path.join(__dirname, "dist", "index.html"), fs.readFileSync(path.join(__dirname, "dist", "index.html"), "utf-8").replace("<head>", "<head>\n<script>window.isLocal = true</script>"));
    const getFonts = await fetch(`https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap`, {
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
        }
    });
    let text = await getFonts.text();
    let latin = text.split("/*");
    let usefulCss = ``;
    for (let i = 1; i < latin.length; i++) {
        let getUrl = latin[i].substring(latin[i].indexOf("src: url(") + "src: url(".length);
        getUrl = getUrl.substring(0, getUrl.indexOf(")"));
        const getFont = await fetch(getUrl, {
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
            }
        });
        createDirectory(path.join(__dirname, "dist", "fonts"));
        fs.writeFileSync(`dist${path.sep}fonts${path.sep}${i}.woff`, Buffer.from(await getFont.arrayBuffer()));
        let latinAppend = `${latin[i].substring(0, latin[i].indexOf(";\n}"))};\n}\n`;
        latinAppend = latinAppend.replace(getUrl, `./fonts/${i}.woff`);
        usefulCss += `/* ${latinAppend}`;
        console.log(getUrl);
    }
    fs.writeFileSync(`dist${path.sep}fontstyle.css`, usefulCss);
    fs.writeFileSync(`dist${path.sep}index.html`, fs.readFileSync(`dist${path.sep}index.html`, "utf-8").replace(`https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap`, "./fontstyle.css"));
    fs.writeFileSync(`dist${path.sep}service-worker.js`, fs.readFileSync(`dist${path.sep}service-worker.js`, "utf-8").replace(`https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap`, "./fontstyle.css"));
})()
