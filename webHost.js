const fs = require("fs");
const path = require("path");
const uglify = require("uglify-js");
const cleancss = require("clean-css");
const htmlminify = require('html-minifier');
if (fs.existsSync("dist")) fs.rmSync("dist", { recursive: true });
function checkDist(e) {
    if (!fs.existsSync(`dist/${e.substring(0, e.lastIndexOf("/"))}`)) fs.mkdirSync(`dist/${e.substring(0, e.lastIndexOf("/"))}`, { recursive: true });
}
let JSPath = [...(process.argv[3] === "electron" ? ["main.js", "preload.js"] : []), "script.js"];
let assets = [...(process.argv[3] === "electron" ? ["package.json"] : []), "service-worker.js", "updatecode.txt", "netlify.toml", "vercel.json", "manifest.json", "assets/logo.png", "assets/mergedAssets.json", "translations/it.json"];
let HTMLPath = ["index.html"];
let CSSPath = ["style.css"];
HTMLPath.forEach(e => {
    checkDist(e);
    fs.writeFileSync(`dist/${e}`, htmlminify.minify(fs.readFileSync(e, "utf-8"), { minifyJS: true, minifyCSS: true, collapseWhitespace: true, conservativeCollapse: true }))
})
CSSPath.forEach(e => {
    checkDist(e);
    fs.writeFileSync(`dist/${e}`, new cleancss().minify(fs.readFileSync(e, "utf-8")).styles)
})
assets.forEach(e => {
    checkDist(e);
    fs.copyFileSync(e, `dist/${e}`);
})
JSPath.forEach(e => {
    checkDist(e);
    fs.writeFileSync(`dist/${e}`, uglify.minify(fs.readFileSync(e, "utf-8"), { mangle: { toplevel: false } }).code);
});
// Download fonts from Google Fonts
let usefulCss = ``;
if (process.argv[2] === "local") {
    fs.writeFileSync(`dist${path.sep}script.js`, fs.readFileSync(`dist${path.sep}script.js`, "utf-8").replace("isLocal:!1", "isLocal:!0"));
    (async () => {
        let getFonts = await fetch(`https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@700&family=Work+Sans&display=woff`, {
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
            }
        });
        let text = await getFonts.text();
        let latin = text.split("/* latin */");
        for (let i = 1; i < latin.length; i++) {
            let getUrl = latin[i].substring(latin[i].indexOf("src: url(")).replace("src: url(", "");
            getUrl = getUrl.substring(0, getUrl.indexOf(")"));
            let getFont = await fetch(getUrl, {
                headers: {
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
                }
            });
            let getBuffer = await getFont.arrayBuffer();
            if (!fs.existsSync(`dist${path.sep}fonts`)) fs.mkdirSync(`dist${path.sep}fonts`);
            fs.writeFileSync(`dist${path.sep}fonts${path.sep}${i}.woff`, Buffer.from(getBuffer));
            let latinAppend = `${latin[i].substring(0, latin[i].indexOf(";\n}"))};\n}\n`;
            latinAppend = latinAppend.replace(getUrl, `./fonts/${i}.woff`);
            usefulCss += latinAppend;
            console.log(getUrl);
        }
        fs.writeFileSync(`dist${path.sep}fontstyle.css`, usefulCss);
        fs.writeFileSync(`dist${path.sep}index.html`, fs.readFileSync(`dist${path.sep}index.html`, "utf-8").replace(`https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@700&family=Work+Sans&display=swap`, "./fontstyle.css"));
        fs.writeFileSync(`dist${path.sep}service-worker.js`, fs.readFileSync(`dist${path.sep}service-worker.js`, "utf-8").replace(`https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@700&family=Work+Sans&display=swap`, "./fontstyle.css"));
        // Fetch content from JSDelivr
        let fetchRes = {
            "ffmpeg-core.js": {
                src: "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
                out: `dist${path.sep}script.js`
            },
            "ffmpeg-html.js": {
                src: "https://unpkg.com/@ffmpeg/ffmpeg@0.11.0/dist/ffmpeg.min.js",
                out: `dist${path.sep}index.html`
            },
            "jszip.js": {
                src: "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
                out: `dist${path.sep}index.html`
            },
            "animate.css": {
                src: "https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css",
                out: `dist${path.sep}index.html`
            },
            "ffmpeg-core.worker.js": {
                src: "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js",
                out: `dist${path.sep}script.js`
            },
            "ffmpeg-core.wasm": {
                src: "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm",
                out: `dist${path.sep}script.js`
            }
        }
        for (let item in fetchRes) {
            console.log(fetchRes[item].src);
            let getItem = await fetch(fetchRes[item].src);
            let buffer = await getItem.arrayBuffer();
            if (!fs.existsSync(`dist${path.sep}jsres`)) fs.mkdirSync(`dist${path.sep}jsres`);
            fs.writeFileSync(`dist${path.sep}jsres${path.sep}${item}`, Buffer.from(buffer));
            fs.writeFileSync(fetchRes[item].out, fs.readFileSync(fetchRes[item].out, "utf-8").replace(fetchRes[item].src, `./jsres/${item}`));
            fs.writeFileSync(`dist${path.sep}service-worker.js`, fs.readFileSync(`dist${path.sep}service-worker.js`, "utf-8").replace(fetchRes[item].src, `./jsres/${item}`));
        }
    })();
}