if ('serviceWorker' in navigator) {
    let registration;
    const registerServiceWorker = async () => {
        registration = await navigator.serviceWorker.register('./service-worker.js',);
    };
    registerServiceWorker();
} else console.error(":/")
let jsonImg = {
    toload: true
};
let appVersion = "1.1.0";
fetch("./updatecode.txt", { cache: "no-store" }).then((res) => res.text().then((text) => { if (text.replace("\n", "") !== appVersion) if (confirm(`There's a new version of ffmpeg-web. Do you want to update? [${appVersion} --> ${text.replace("\n", "")}]`)) { caches.delete("ffmpegweb-cache"); location.reload(true); } }).catch((e) => { console.error(e) })).catch((e) => console.error(e));
document.getElementById("version").textContent = appVersion;
let conversionOptions = {
    videoOptions: {
        codec: null,
        bitrateType: "0",
        bitrateLength: "22",
        fps: -1
    },
    audioOptions: {
        codec: null,
        bitrateType: "0",
        bitrateLength: "4",
        channels: -1
    },
    output: {
        name: "output",
        vidExtension: null,
        audExtension: "mp4",
        orientation: -1,
        custom: false,
        merged: false
    },
    metadata: {
        items: [],
        img: undefined,
    }
}
document.getElementById("btnSelect").addEventListener("click", () => {
    if (document.getElementById("btnSelect").classList.contains("disabled")) { createAlert("Wait until ffmpeg is loaded.", "ffmpegLoadRemind"); return; };
    document.getElementById("reset").reset();
    tempOptions = optionGet();
    document.getElementById("fileInput").click();
});
let isMultiCheck = [false, 0];
async function extractAlbumArt() {
    for (let item of document.getElementById("fileInput").files) {
        ffmpeg.FS("writeFile", item.name, await fetchFile(item));
        let prepareScript = ["-i", item.name];
        if (document.querySelector(".imgSelect").getAttribute("data-imgval") !== "no") prepareScript.push("-vcodec", document.querySelector(".imgSelect").getAttribute("data-imgval"));
        let outName = `${item.name.substring(0, item.name.lastIndexOf("."))}.${document.querySelector(".imgSelect").getAttribute("data-extension")}`;
        await ffmpeg.run(...prepareScript, outName);
        downloadItem(await ffmpeg.FS("readFile", outName), outName);
    }
    createAlert("All the album arts are exported", "albumArtExported");
}
document.getElementById("fileInput").addEventListener("input", () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    let files = document.getElementById("fileInput").files;
    if (document.getElementById("mergeName").value.endsWith(".alac")) document.getElementById("mergeName").value = `${document.getElementById("mergeName").value.substring(0, document.getElementById("mergeName").value.length - 5)}.m4a`;
    let tempPush = [];
    if (document.querySelector(".sectionSelect").getAttribute("section") === "extractalbum") {
        extractAlbumArt();
        return;
    }
    if (document.getElementById("cutVideoSelect").value === "2") tempOptions.isSecondCut = true;
    if (document.querySelector(".sectionSelect").getAttribute("section") === "cmd") conversionOptions.output.custom = true; else conversionOptions.output.custom = false; // Make this so that if the user changes tab for more conversion the custom script isn't kept
    if (document.querySelector(".sectionSelect").getAttribute("section") === "merge") conversionOptions.output.merged = true; else conversionOptions.output.merged = false; // Same as before
    if (document.getElementById("redownload").style.display !== "inline") scrollItem();
    if (conversionOptions.output.merged) {
        mergeContent(files);
        return;
    }
    switch (parseInt(document.getElementById("multiVideoHandle").value)) {
        case 1: case -1:
            tempPush = files;
            break;
        case 2:
            for (let i = 1; i < files.length; i++) if (files[0].name.substring(0, files[0].name.lastIndexOf(".")) === files[i].name.substring(0, files[i].name.lastIndexOf("."))) tempPush.push(files[i], files[0]);
            break;
        case 3: case 4:
            isMultiCheck[0] = true;
            ffmpegMultiCheck();
            return;
        default:
            tempPush.push(files[0]);
            break;
    }
    for (let item of tempPush) loadFile(item);
    ffmpegStart();
});
function ffmpegMultiCheck() {
    let files = document.getElementById("fileInput").files;
    if (document.getElementById("cutVideoSelect").value === "2") tempOptions.isSecondCut = true;
    if (isMultiCheck[1] >= files.length) { document.getElementById("reset").reset(); createAlert("Executed conversion of all selected files :D", "convertAll"); isMultiCheck = [false, 0]; return }
    if (parseInt(document.getElementById("multiVideoHandle").value) === 3) {
        let stopLooking = false;
        for (let i = isMultiCheck[1]; i < files.length; i++) {
            for (let x = isMultiCheck[1]; x < files.length; x++) { // Not efficient at all, I should really improve this
                if (files[i].name === files[x].name) continue;
                if (files[i].name.substring(0, files[i].name.lastIndexOf(".")) === files[x].name.substring(0, files[x].name.lastIndexOf("."))) {
                    stopLooking = true;
                    conversionOptions.output.name = files[i].name.substring(0, files[i].name.lastIndexOf("."));
                    isMultiCheck[1] = i + 1;
                    loadFile(files[i]);
                    loadFile(files[x]);
                    ffmpegStart();
                    break;
                }
            }
            if (stopLooking) break;
        }
    } else {
        loadFile(files[isMultiCheck[1]]);
        conversionOptions.output.name = files[isMultiCheck[1]].name.substring(0, files[isMultiCheck[1]].name.lastIndexOf("."));
        isMultiCheck[1] += 1;
        ffmpegStart();
    }
}
async function mergeContent(file) {
    let conversionFile = "";
    let deleteFiles = [];
    for (let fileItem of file) {
        conversionFile += `\nfile '${fileItem.name}'`;
        ffmpeg.FS("writeFile", fileItem.name, await fetchFile(fileItem));
        deleteFiles.push(fileItem.name)
    }
    conversionFile = conversionFile.substring(1);
    await ffmpeg.FS("writeFile", "array.txt", new TextEncoder().encode(conversionFile));
    if (document.getElementById("mergeName").value === "") document.getElementById("mergeName").value = `merged-${file[0].name}`;
    if (document.getElementById("mergeName").value.endsWith(".m4a")) await ffmpeg.run("-f", "concat", "-safe", "0", "-i", "array.txt", "-c", "copy", "-map_metadata", "0", "-vn", `a${document.getElementById("mergeName").value}`); else await ffmpeg.run("-f", "concat", "-safe", "0", "-i", "array.txt", "-c", "copy", "-map_metadata", "0", `a${document.getElementById("mergeName").value}`);
    let data = await ffmpeg.FS("readFile", `a${document.getElementById("mergeName").value}`);
    deleteFiles.push(`a${document.getElementById("mergeName").value}`);
    let start = "a";
    if (document.getElementById("keepAlbumArt").checked) {
        try {
            await ffmpeg.run("-i", file[0].name, "temp.jpg");
            await ffmpeg.run("-i", `a${document.getElementById("mergeName").value}`, "-i", "temp.jpg", "-map", "0", "-map", "1", "-c", "copy", "-disposition:v:0", "attached_pic", `aa${document.getElementById("mergeName").value}`);
            data = await ffmpeg.FS("readFile", `aa${document.getElementById("mergeName").value}`);
            deleteFiles.push(`aa${document.getElementById("mergeName").value}`, "temp.jpg");
            start = "aa";
        } catch (ex) {
            console.error(ex);
        }
    }
    try {
        await ffmpeg.run("-i", `${start}${document.getElementById("mergeName").value}`, "-i", file[0].name, "-map", "0", "-map_metadata", "1", "-c", "copy", `aaa${document.getElementById("mergeName").value}`);
        data = await ffmpeg.FS("readFile", `aaa${document.getElementById("mergeName").value}`);
        deleteFiles.push(`aaa${document.getElementById("mergeName").value}`);
    } catch (ex) {
        console.error(ex);
    }
    document.getElementById("console").innerHTML = consoleText;
    document.getElementById("console").parentElement.scrollTo({ top: document.getElementById("console").parentElement.scrollHeight, behavior: 'smooth' });
    downloadItem(data, document.getElementById("mergeName").value);
    for (let fileItem of deleteFiles) await ffmpeg.FS("unlink", fileItem);
    tempOptions = optionGet();
}
async function ffmpegReadyMetadata() {
    tempOptions.ffmpegArray.push("-codec", "copy");
    if (!document.getElementById("metadataKeep").checked) tempOptions.ffmpegArray.push("-map_metadata", "-1");
    for (let item of conversionOptions.metadata.items) tempOptions.ffmpegArray.push("-metadata", `${item.key}=${item.value}`);
    if (conversionOptions.metadata.img !== undefined && document.getElementById("customAlbumArt").checked) {
        ffmpeg.FS("writeFile", "temp.jpg", await fetchFile(conversionOptions.metadata.img));
        tempOptions.deleteFile.push("temp.jpg");
    }
    if (document.getElementById("removeOlderArt").checked) tempOptions.ffmpegArray.push("-vn");
    tempOptions.fileExtension = tempOptions.ffmpegName[0].substring(tempOptions.ffmpegName[0].lastIndexOf(".") + 1);
    if (!document.getElementById("mp4Keep").checked && customCount > 0 && tempOptions.fileExtension === "mp4" || tempOptions.fileExtension === "m4v" || tempOptions.fileExtension === "m4a" || tempOptions.fileExtension === "alac") tempOptions.ffmpegArray.push("-movflags", "use_metadata_tags");
    addSimpleCut();
    tempOptions.ffmpegArray.push(`a${tempOptions.ffmpegName[0]}`);
}
function getFfmpegItem() {
    let item = document.getElementById("timestampArea").value.split("\n");
    let getOptions = item[tempOptions.secondCutProgress];
    getOptions = getOptions.split(document.getElementById("dividerInput").value);
    let cutTimestamp = ["", ""];
    function getCutAlignment() {
        if (document.getElementById("timestampPosition").value === "0") return [getOptions[1], getOptions[0].replaceAll(" ", "")];
        return [getOptions[0], getOptions[1].replaceAll(" ", "")]
    }
    let alignmentResult = getCutAlignment();
    conversionOptions.output.name = alignmentResult[0];
    cutTimestamp[0] = alignmentResult[1];
    tempOptions.secondCutProgress++;
    if (item.length > tempOptions.secondCutProgress && item[tempOptions.secondCutProgress].replaceAll(" ", "").length > 1) {
        getOptions = item[tempOptions.secondCutProgress];
    getOptions = getOptions.split(document.getElementById("dividerInput").value);
        cutTimestamp[1] = getCutAlignment()[1];
    }
    if (conversionOptions.output.custom) {
        tempOptions.fileExtension = tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].substring(tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].lastIndexOf("."));
    }
    return cutTimestamp;
}
async function ffmpegStart() {
    if (conversionOptions.output.custom) readFfmpegScript(); else if (document.querySelector(".sectionSelect").getAttribute("section") === "metadata") await ffmpegReadyMetadata(); else buildFfmpegScript();
    let finalScript = [];
    if (tempOptions.itsscale !== []) finalScript.push(...tempOptions.itsscale);
    for (let i = 0; i < tempOptions.ffmpegBuffer.length; i++) {
        ffmpeg.FS('writeFile', tempOptions.ffmpegName[i], await fetchFile(tempOptions.ffmpegBuffer[i]));
        if (conversionOptions.output.custom && tempOptions.ffmpegArray.indexOf(`$input[${i}]`) !== -1) tempOptions.ffmpegArray[tempOptions.ffmpegArray.indexOf(`$input[${i}]`)] = tempOptions.ffmpegName[i]; else finalScript.push("-i", tempOptions.ffmpegName[i]);
        tempOptions.deleteFile.push(tempOptions.ffmpegName[i]);
    }
    if (tempOptions.isSecondCut) {
        let fetchTimestamp = getFfmpegItem();
        tempOptions.ffmpegArray.pop();
        tempOptions.ffmpegArray.push("-ss", fetchTimestamp[0]);
        if (fetchTimestamp[1] !== "") tempOptions.ffmpegArray.push("-to", fetchTimestamp[1]); else tempOptions.isSecondCut = false;
        tempOptions.ffmpegArray.push(`a${conversionOptions.output.name}.${tempOptions.fileExtension}`);
    }
    finalScript.push(...tempOptions.ffmpegArray);
    await ffmpeg.run(...finalScript);
    let startDifferentText = "a";
    if (conversionOptions.output.custom) {
        conversionOptions.output.name = tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].substring(0, tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].lastIndexOf("."));
        tempOptions.fileExtension = tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].substring(tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].lastIndexOf(".") + 1);
        startDifferentText = "";
    }
    let data = ffmpeg.FS('readFile', `${startDifferentText}${conversionOptions.output.name}.${tempOptions.fileExtension}`);
    tempOptions.deleteFile.push(`${startDifferentText}${conversionOptions.output.name}.${tempOptions.fileExtension}`);
    if (document.getElementById("albumArtCheck").checked && conversionOptions.output.audExtension !== "ogg" || document.querySelector(".sectionSelect").getAttribute("section") === "metadata" && document.getElementById("customAlbumArt").checked && conversionOptions.metadata.img !== undefined) {
        try {
            if (document.getElementById("albumArtCheck").checked && conversionOptions.output.audExtension !== "ogg" && !document.getElementById("customAlbumArt").checked) await ffmpeg.run("-i", tempOptions.ffmpegName[0], "temp.jpg");
            await ffmpeg.run("-i", `${startDifferentText}${conversionOptions.output.name}.${tempOptions.fileExtension}`, "-i", "temp.jpg", "-map", "0", "-map", "1", "-c", "copy", "-disposition:v:0", "attached_pic", `aa${conversionOptions.output.name}.${tempOptions.fileExtension}`);
            data = ffmpeg.FS("readFile", `aa${conversionOptions.output.name}.${tempOptions.fileExtension}`)
            tempOptions.deleteFile.push(`temp.jpg`, `aa${conversionOptions.output.name}.${tempOptions.fileExtension}`);
        } catch (ex) {
            console.error(ex);
        }
    }
    downloadItem(data);
    document.getElementById("console").innerHTML = consoleText;
    document.getElementById("console").parentElement.scrollTo({ top: document.getElementById("console").parentElement.scrollHeight, behavior: 'smooth' });
    let textCutSplit = document.getElementById("timestampArea").value.split("\n");
    for (let file of tempOptions.deleteFile) try {await ffmpeg.FS('unlink', file)} catch(ex) {console.warn(ex)};
    if (tempOptions.isSecondCut && textCutSplit.length > tempOptions.secondCutProgress && textCutSplit[tempOptions.secondCutProgress].replaceAll(" ", "").length > 1) {
        tempOptions.ffmpegArray.splice(tempOptions.ffmpegArray.lastIndexOf("-ss"), tempOptions.ffmpegArray.length);
        try {
            await ffmpegStart();
        } catch (ex) {
            console.warn(ex);
        }
    }
    tempOptions = optionGet();
    if (isMultiCheck[0]) setTimeout(() => { finalScript = []; ffmpegMultiCheck() }, 350); else document.getElementById("reset").reset();
}
function downloadItem(data, name) {
    let downloadName = `${conversionOptions.output.name}.${tempOptions.fileExtension}`;
    if (name !== undefined) downloadName = name;
    if (document.getElementById("zipSave").checked) {
        zip.file(downloadName, new File([data.buffer], downloadName));
        createAlert(`Added ${downloadName} to zip file`, "zipFileAdd");
        return;
    }
    var link = document.createElement("a");
    link.href = URL.createObjectURL(new File([data.buffer], downloadName));
    link.download = downloadName;
    link.textContent = "Download here";
    link.setAttribute("ref", linkStore.length);
    link.click();
    if (document.getElementById("saveFiles").checked) {
        let option = document.createElement("option");
        option.textContent = link.download;
        option.value = linkStore.length;
        option.style = "display: block; text-align: center;";
        option.setAttribute("ref", option.value);
        document.getElementById("redownloadVideos").append(option);
        linkStore.push(link);
    } else URL.revokeObjectURL(link.href);
}
let linkStore = [];
document.getElementById("redownloadVideos").addEventListener("input", () => {
    document.getElementById("linkContainer").innerHTML = "";
    document.getElementById("linkContainer").append(linkStore[parseInt(document.getElementById("redownloadVideos").value)]);
    document.getElementById("memDelete").style.display = "block";
});
document.getElementById("memDelete").addEventListener("click", () => {
    URL.revokeObjectURL(linkStore[parseInt(document.getElementById("redownloadVideos").value)].href);
    linkStore[parseInt(document.getElementById("redownloadVideos").value)] = undefined;
    document.querySelector(`[ref='${parseInt(document.getElementById("redownloadVideos").value)}']`).remove();
    document.getElementById("redownloadVideos").value = -1;
    document.getElementById("memDelete").style.display = "none;"
})
function loadFile(file) {
    tempOptions.ffmpegBuffer.push(file);
    tempOptions.ffmpegName.push(file.name);
}
let isAudBitrateShown = true;
for (let item of document.querySelectorAll("[data-audioval]")) item.addEventListener("click", () => {
    switch (item.getAttribute("data-audioval")) {
        case "libopus":
            if (document.querySelector("[data-child=aud]").value !== 1) {
                generalByeAnimation(document.getElementById("audQuantization"));
                document.getElementById("audManual").style.display = "flex";
                generalHelloAnimation(document.getElementById("audManual"));
                document.querySelector("[data-child=aud]").value = 1;
            }
            conversionOptions.audioOptions.bitrateType = 1;
            document.getElementById("sliderAudio").disabled = true;
            if (!isAudBitrateShown) { generalHelloAnimation(document.getElementById("audioBitrateSettings"), true); isAudBitrateShown = true };
            break;
        case "no":
            isAudBitrateShown = false;
            generalByeAnimation(document.getElementById("audioBitrateSettings"));
            break;
        default:
            document.getElementById("sliderAudio").disabled = false;
            if (!isAudBitrateShown) { generalHelloAnimation(document.getElementById("audioBitrateSettings"), true); isAudBitrateShown = true };
            break;
    }
    if (item.getAttribute("data-extension") === "ogg") generalByeAnimation(document.getElementById("albumArtContainer")); else generalHelloAnimation(document.getElementById("albumArtContainer"), true);
    conversionOptions.audioOptions.codec = item.getAttribute("data-audioval");
    conversionOptions.output.audExtension = item.getAttribute("data-extension");
    if (document.querySelector(".audSelect") !== null) document.querySelector(".audSelect").classList.remove("audSelect");
    item.classList.add("audSelect");
})
for (let item of document.querySelectorAll("[data-imgval]")) item.addEventListener("click", () => {
    if (document.querySelector(".imgSelect") !== null) document.querySelector(".imgSelect").classList.remove("imgSelect");
    item.classList.add("imgSelect");
    conversionOptions.output.vidExtension = item.getAttribute("data-extension");
})
for (let item of document.querySelectorAll("[data-videoval]")) item.addEventListener("click", () => {
    conversionOptions.videoOptions.codec = item.getAttribute("data-videoval");
    conversionOptions.output.vidExtension = item.getAttribute("data-extension");
    if (document.querySelector(".vidSelect") !== null) document.querySelector(".vidSelect").classList.remove("vidSelect");
    item.classList.add("vidSelect");
    if (item.getAttribute("data-videoval") === "copy") document.getElementById("fpsContainerDiv").style.display = "none"; else document.getElementById("fpsContainerDiv").style.display = "inline";
});
for (let item of document.querySelectorAll("[data-select=bitrate]")) item.addEventListener("change", () => {
    if (item.value == "0") {
        document.getElementById(`${item.getAttribute("data-child")}Quantization`).style.display = "flex";
        document.getElementById(`${item.getAttribute("data-child")}Manual`).style.display = "none";
    } else {
        document.getElementById(`${item.getAttribute("data-child")}Quantization`).style.display = "none";
        document.getElementById(`${item.getAttribute("data-child")}Manual`).style.display = "flex";
    }
    if (item.getAttribute("data-child") === "aud") conversionOptions.audioOptions.bitrateType = item.value; else conversionOptions.videoOptions.bitrateType = item.value;
})
for (let item of document.querySelectorAll("[data-update=audBitLength]")) item.addEventListener("input", () => { conversionOptions.audioOptions.bitrateLength = item.value });
for (let item of document.querySelectorAll("[data-update=vidBitLength]")) item.addEventListener("input", () => { conversionOptions.videoOptions.bitrateLength = item.value });
document.getElementById("fpsInput").addEventListener("input", () => {
    conversionOptions.videoOptions.fps = document.getElementById("fpsInput").value;
    document.getElementById("fpsTarget").min = conversionOptions.videoOptions.fps / 2;
})
function optionGet() {
    return {
        ffmpegArray: [],
        ffmpegBuffer: [],
        ffmpegName: [],
        fileExtension: "mp4",
        itsscale: [],
        deleteFile: [],
        secondCutProgress: 0,
        isSecondCut: false
    }
}
let tempOptions = optionGet();
function getFilter(filtersMap) {
    let contentFilter = "";
    for (let option of Object.keys(filtersMap)) { // Horrible array loop, to fix
        let consider = true;
        for (let i = 0; i < filtersMap[option].ref.length; i++) {
            for (let valueSplit of filtersMap[option].nochange[i].split(",")) {
                if (valueSplit === filtersMap[option].ref[i]) consider = false;
            }
        }
        if (!consider) continue;
        contentFilter += `,${filtersMap[option].format}`;
    }
    return contentFilter;
}
function buildFfmpegScript() {
    if (document.getElementById("vidOutput").checked || document.querySelector(".sectionSelect").getAttribute("section") === "imgenc") {
        if (document.querySelector(".sectionSelect").getAttribute("section") !== "imgenc") {
            tempOptions.ffmpegArray.push("-vcodec", conversionOptions.videoOptions.codec);
            switch (parseInt(conversionOptions.videoOptions.bitrateType)) {
                case 0:
                    tempOptions.ffmpegArray.push("-qscale:v", conversionOptions.videoOptions.bitrateLength);
                    break;
                default:
                    tempOptions.ffmpegArray.push("-b:v", conversionOptions.videoOptions.bitrateLength);
                    break;
            }
            if (conversionOptions.videoOptions.fps !== -1) {
                if (conversionOptions.videoOptions.codec !== "copy") tempOptions.ffmpegArray.push("-vf", `fps=${conversionOptions.videoOptions.fps}`); else tempOptions.itsscale.push("-itsscale", (parseInt(document.getElementById("fpsInput").value) / parseInt(document.getElementById("fpsTarget").value)));
            }
        } else {
            if (document.querySelector(".imgSelect").getAttribute("data-imgval") !== "no") tempOptions.ffmpegArray.push("-vcodec", document.querySelector(".imgSelect").getAttribute("data-imgval"));
        }
        function lookValue(id) { if (id.value === "" || parseInt(id.value) === 0) return false; return true; }
        if (document.getElementById("checkOrientation").checked && lookValue(document.getElementById("inputWidth")) && lookValue(document.getElementById("inputHeight"))) tempOptions.ffmpegArray.push("-aspect", `${document.getElementById("inputWidth").value}/${document.getElementById("inputHeight").value}`);
        let videoFilters = getFilter({
            crop: {
                ref: [document.getElementById("cropWidth").value, document.getElementById("cropHeight").value, document.getElementById("positionItemX").value, document.getElementById("positionItemY").value],
                nochange: ["", "", "", ""],
                format: `crop=${document.getElementById("cropWidth").value}:${document.getElementById("cropHeight").value}:${document.getElementById("positionItemX").value.replaceAll("center-w", `(iw-${document.getElementById("cropWidth").value})/2`).replaceAll("center-h", `(ih-${document.getElementById("cropHeight").value})/2`)}:${document.getElementById("positionItemY").value.replaceAll("center-w", `(iw-${document.getElementById("cropWidth").value})/2`).replaceAll("center-h", `(ih-${document.getElementById("cropHeight").value})/2`)}`
            },
            yaidf: {
                ref: [document.getElementById("deinterlaceCheck").checked.toString()],
                nochange: ["false"],
                format: "yadif=0:0:0"
            },
            curves: {
                ref: [document.getElementById("curveSelect").value],
                nochange: ["none,"],
                format: `curves=${document.getElementById("curveSelect").value}`
            },
            custom: {
                ref: [document.getElementById("customVideo").value],
                nochange: [""],
                format: document.getElementById("customVideo").value
            }
        });
        if (conversionOptions.output.orientation !== -1) videoFilters += `,rotate=PI*${conversionOptions.output.orientation}:oh=iw:ow=ih`;
        if (videoFilters.length > 0) {
            videoFilters = videoFilters.substring(1);
            tempOptions.ffmpegArray.push("-filter:v", videoFilters);
        }
        if (document.getElementById("checkPixelSpace").checked && document.getElementById("pixelSpace").value !== "") tempOptions.ffmpegArray.push("-pix_fmt", document.getElementById("pixelSpace").value)
    } else if (document.querySelector(".sectionSelect").getAttribute("section") !== "imgenc" && !document.getElementById("albumArtCheck").checked || conversionOptions.audioOptions.codec === "libfdk_aac" || conversionOptions.audioOptions.codec === "alac" || conversionOptions.audioOptions.codec === "aac" || conversionOptions.output.audExtension === "ogg") tempOptions.ffmpegArray.push("-vn");
    if (document.getElementById("audOutput").checked && document.querySelector(".sectionSelect").getAttribute("section") !== "imgenc") {
        if (conversionOptions.audioOptions.codec !== "no") tempOptions.ffmpegArray.push("-acodec", conversionOptions.audioOptions.codec);
        switch (parseInt(conversionOptions.audioOptions.bitrateType)) {
            case 0:
                tempOptions.ffmpegArray.push("-qscale:a", conversionOptions.audioOptions.bitrateLength);
                break;
            default:
                tempOptions.ffmpegArray.push("-b:a", conversionOptions.audioOptions.bitrateLength);
                break;
        }
        if (conversionOptions.audioOptions.channels !== -1) tempOptions.ffmpegArray.push("-ac", conversionOptions.audioOptions.channels);
        let audioFilters = getFilter({
            volume: {
                ref: [document.getElementById("volumeRange").value],
                nochange: ["0"],
                format: `volume=${document.getElementById("volumeRange").value}dB`
            },
            denoise: {
                ref: [document.getElementById("noiseLevelReduction").value, document.getElementById("noiseFloorReduction").value],
                nochange: ["0,", "0,"],
                format: `afftdn=nr=${document.getElementById("noiseLevelReduction").value}:nf=${document.getElementById("noiseFloorReduction").value}`
            },
            custom: {
                ref: [document.getElementById("customAudio").value],
                nochange: [""],
                format: document.getElementById("customAudio").value,
            }
        });
        if (audioFilters.length > 0) {
            audioFilters = audioFilters.substring(1);
            tempOptions.ffmpegArray.push("-filter:a", audioFilters);

        }
    }
    addSimpleCut();
    if (conversionOptions.output.name === "output") conversionOptions.output.name = tempOptions.ffmpegName[0].substring(0, tempOptions.ffmpegArray[0].lastIndexOf("."));
    if (conversionOptions.videoOptions.codec === "copy" && document.getElementById("vidOutput").checked) tempOptions.fileExtension = tempOptions.ffmpegName[0].substring(tempOptions.ffmpegName[0].lastIndexOf(".") + 1); else if (conversionOptions.output.vidExtension !== null) tempOptions.fileExtension = conversionOptions.output.vidExtension; else if (conversionOptions.audioOptions.codec === "copy") tempOptions.fileExtension = tempOptions.ffmpegName[0].substring(tempOptions.ffmpegName[0].lastIndexOf(".") + 1); else tempOptions.fileExtension = conversionOptions.output.audExtension;
    tempOptions.ffmpegArray.push(`a${conversionOptions.output.name}.${tempOptions.fileExtension}`);
}
function addSimpleCut() {
    if (document.getElementById("cutVideoSelect").value === "1") {
        if (document.getElementById("startCut").value !== "") tempOptions.ffmpegArray.push("-ss", document.getElementById("startCut").value);
        if (document.getElementById("endCut").value !== "") tempOptions.ffmpegArray.push("-to", document.getElementById("endCut").value);
    }
}
const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg = createFFmpeg({ log: false, corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js' });
let progressMove = true;
let consoleText = "";
ffmpeg.setLogger(({ type, message }) => {
    consoleText += `<br>[${type}] ${message}`;
    if (progressMove) {
        document.getElementById("console").innerHTML = consoleText;
        progressMove = false;
        document.getElementById("console").parentElement.scrollTo({ top: document.getElementById("console").parentElement.scrollHeight, behavior: 'smooth' });
        setTimeout(() => { progressMove = true; document.getElementById("console").innerHTML = consoleText; document.getElementById("console").parentElement.scrollTo({ top: document.getElementById("console").parentElement.scrollHeight, behavior: 'smooth' }); }, 600);
    }
});
ffmpeg.setProgress(({ ratio }) => {
    document.getElementById("progress").value = Math.floor(ratio * 100);
});
function checkShow(a, b, c) {
    document.getElementById(a).addEventListener("input", () => {
        let check = null;
        if (c) check = !document.getElementById(a).checked; else check = document.getElementById(a).checked;
        for (let item of b.split(",")) {
            if (check) {
                document.getElementById(item).style.display = "";
                if (document.getElementById(item).getAttribute("block") === "a") document.getElementById(item).style.display = "block";
                generalHelloAnimation(document.getElementById(item));
                setTimeout(() => { document.getElementById(item).style.maxHeight = "9999px" }, 50);
            } else {
                document.getElementById(item).style.maxHeight = "0px";
                document.getElementById(item).classList.remove("animate__backInUp");
                document.getElementById(item).classList.add("animate__animated", "animate__backOutDown");
                setTimeout(() => { if (!c && document.getElementById(a).checked || c && !document.getElementById(a).checked) document.getElementById(item).classList.remove("animate__animated", "animate__backOutDown"); document.getElementById(item).style.display = "none" }, 1050);
            }
        }
    })
};
document.querySelector("[section=reenc]").addEventListener("click", () => { setTimeout(() => { document.getElementById("onlyVidSettings").style.display = "block"; }, 1100) })
document.getElementById("vidOutput").addEventListener("input", () => {
    if (document.getElementById("vidOutput").checked) {
        document.getElementById("audioOpt").classList.remove("leftCard");
        document.getElementById("audioOpt").classList.add("rightCard");
    } else {
        document.getElementById("audioOpt").classList.remove("rightCard");
        document.getElementById("audioOpt").classList.add("leftCard");

    }
});
let showItem = [["vidOutput", "audOutput", "checkFps", "checkOrientation", "checkPixelSpace"], ["videoElementsDisplay,videoOpt", "audioElementsDisplay,audioOpt", "fpsDiv", "orientationDiv", "pixelSpaceDiv"], [false, false, true, false, false]]
for (let i = 0; i < showItem[0].length; i++) checkShow(showItem[0][i], showItem[1][i], showItem[2][i])
let fetchImg = null;
for (let item of document.querySelectorAll("[data-fetch]")) fetchData(item, item.getAttribute("data-fetch"));
fetch("./assets/mergedAssets.json").then((res) => { res.json().then((json) => { fetchImg = json }).catch((ex) => { console.warn(ex) }) }).catch((ex) => { console.warn(ex) });
function fetchData(element, link, customImg) {
    if (customImg === undefined) customImg = getComputedStyle(document.body).getPropertyValue("--select");
    if (fetchImg === null) {
        setTimeout(() => { fetchData(element, link, customImg) }, 150);
        return;
    }
    element.src = URL.createObjectURL(new Blob([fetchImg[link].replaceAll("#212121", customImg)], { type: "image/svg+xml" }));
}
let dialogShow = [[document.getElementById("showFilter"), document.getElementById("hideFilter"), document.getElementById("hideFilter2"), document.getElementById("showFilter2"), document.getElementById("showSettings"), document.getElementById("hideSettings")], [document.getElementById("audioFilterDialog"), document.getElementById("audioFilterDialog"), document.getElementById("videoFilterDialog"), document.getElementById("videoFilterDialog"), document.getElementById("settings"), document.getElementById("settings")], ["block", "none", "none", "block", "block", "none"]]
for (let i = 0; i < dialogShow[0].length; i++) dialogShow[0][i].addEventListener("click", () => {
    if (dialogShow[2][i] !== "none") {
        dialogShow[1][i].classList.remove("animate__backOutDown");
        dialogShow[1][i].classList.add("animate__animated", "animate__backInDown");
        dialogShow[1][i].style.display = dialogShow[2][i];
    } else {
        dialogShow[1][i].classList.remove("animate__backInDown");
        dialogShow[1][i].classList.add("animate__animated", "animate__backOutDown");
        setTimeout(() => { if (!dialogShow[1][i].classList.contains("animate__backInDown")) dialogShow[1][i].style.display = dialogShow[2][i] }, 1050);
    }
});
function updateSelectInformation(id, changeOption) {
    let optionFetch = changeOption.split(".");
    document.getElementById(id).addEventListener("input", () => { conversionOptions[optionFetch[0]][optionFetch[1]] = parseFloat(document.getElementById(id).value) })
}
let selectInfo = [["audioChannelSelect", "orientationChoose"], ["audioOptions.channels", "output.orientation"]];
for (let i = 0; i < selectInfo[0].length; i++) updateSelectInformation(selectInfo[0][i], selectInfo[1][i]);
let pixelFormatChosen = false;
document.getElementById("curveSelect").addEventListener("input", () => {
    if (document.getElementById("curveSelect").value === "none" && !pixelFormatChosen) {
        document.getElementById("pixelSpaceDiv").style.display = "none";
        document.getElementById("pixelSpace").value = "";
        document.getElementById("checkPixelSpace").checked = false;
    } else if (!pixelFormatChosen) {
        document.getElementById("pixelSpaceDiv").style.display = "flex";
        document.getElementById("pixelSpace").value = "yuv420p";
        document.getElementById("checkPixelSpace").checked = true;
    }
});
document.getElementById("checkPixelSpace").addEventListener("input", () => { pixelFormatChosen = true })
window.scrollTo({ top: 0, behavior: "smooth" });
function readFfmpegScript() {
    for (let part of document.getElementById("ffmpegScript").value.split(" ")) tempOptions.ffmpegArray.push(part.replaceAll("$space", " "));
    let outputName = tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1];
    tempOptions.ffmpegArray.pop();
    addSimpleCut();
    tempOptions.ffmpegArray.push(outputName);
}
function sectionRefer() {
    return {
        reenc: {
            id: [document.getElementById("reencOpt"), document.getElementById("videoOpt"), document.getElementById("audioOpt"), document.getElementById("onlyVidSettings")],
            visible: [true, document.getElementById("vidOutput").checked, document.getElementById("audOutput").checked, true],
            value: 4
        },
        cmd: {
            id: [document.getElementById("customSection")],
            visible: [true],
            value: -1
        },
        merge: {
            id: [document.getElementById("mergeSection")],
            visible: [true],
            value: -1
        },
        imgenc: {
            id: [document.getElementById("imgSection"), document.getElementById("onlyVidSettings")],
            visible: [true, false],
            value: 4
        },
        metadata: {
            id: [document.getElementById("metadataSection"), document.getElementById("metadaOpt")],
            visible: [true, true],
            value: 4
        },
        extractalbum: {
            id: [document.getElementById("albumArtSection")],
            visible: [true],
            value: -1
        }
    }
}
function generalByeAnimation(item) {
    item.classList.remove("animate__backInUp");
    item.classList.add("animate__animated", "animate__backOutDown");
    setTimeout(() => { item.style.display = "none"; item.classList.remove("animate__animated", "animate__backOutDown") }, 1050);
}
function generalHelloAnimation(item, setDisplay) {
    if (setDisplay) item.style.display = "block";
    item.classList.remove("animate__backOutDown");
    item.classList.add("animate__animated", "animate__backInUp");
    setTimeout(() => { item.classList.remove("animate__animated", "animate__backInUp") }, 1050);
}
for (let items of document.querySelectorAll(["[section]"])) items.addEventListener("click", () => {
    document.querySelector(".sectionSelect").classList.remove("sectionSelect");
    items.classList.add("sectionSelect");
    let refer = sectionRefer();
    for (let item in refer) {
        if (item === items.getAttribute("section")) setTimeout(() => { for (let i = 0; i < refer[item].id.length; i++) if (refer[item].visible[i]) generalHelloAnimation(refer[item].id[i], true); else generalByeAnimation(refer[item].id[i]); }, 1045); else for (let i = 0; i < refer[item].id.length; i++) generalByeAnimation(refer[item].id[i]);
    }
    document.getElementById("multiVideoHandle").value = refer[Object.keys(refer)[Object.keys(refer).indexOf(items.getAttribute("section"))]].value;
    if (parseInt(document.getElementById("multiVideoHandle").value) === -1) document.getElementById("multiVideoHandle").disabled = true; else document.getElementById("multiVideoHandle").disabled = false;
    if (items.getAttribute("section") === "imgenc") setTimeout(() => { generalHelloAnimation(document.getElementById("videoOpt"), true); }, 1100);
    if (items.getAttribute("section") === "imgenc" || items.getAttribute("section") === "merge") generalByeAnimation(document.getElementById("smartCut")); else setTimeout(() => {generalHelloAnimation(document.getElementById("smartCut"), true)}, 1100);
    if (items.getAttribute("section") === "imgenc") document.getElementById("imgChooser1").append(document.getElementById("imgElementsDisplay")); else if (items.getAttribute("section") === "extractalbum") document.getElementById("imgChooser2").append(document.getElementById("imgElementsDisplay"));
});
document.querySelector("[data-fetch=arrowright]").addEventListener("click", () => { scrollItem() })
document.querySelector("[data-fetch=arrowleft]").addEventListener("click", () => { scrollItem(true) })
let zip = new JSZip();
document.getElementById("zipSave").addEventListener("input", () => {
    if (document.getElementById("zipSave").checked) {
        generalByeAnimation(document.getElementById("redownloadPart"));
        setTimeout(() => { generalHelloAnimation(document.getElementById("zipPart"), true) }, 1040);
    } else {
        generalByeAnimation(document.getElementById("zipPart"));
        setTimeout(() => { generalHelloAnimation(document.getElementById("redownloadPart"), true) }, 1040);
    }
});
let previousLink = undefined;
document.getElementById("downloadZip").addEventListener("click", () => {
    zip.generateAsync({ type: "blob" }).then(function (content) {
        if (previousLink !== undefined) URL.revokeObjectURL(previousLink);
        // It's similar to the downlaodFiles part, but it doesn't save it in the selection and it has a different text
        let specialLink = document.createElement("a");
        specialLink.textContent = "Having trouble downloading? Click here";
        specialLink.href = URL.createObjectURL(new Blob([content]));
        specialLink.style = "text-align: center; display: block;";
        specialLink.download = "ffmpeg-web.zip";
        specialLink.click();
        document.getElementById("troubleContainer").innerHTML = "";
        document.getElementById("troubleContainer").appendChild(specialLink);
    });
});
document.getElementById("cleanZip").addEventListener("click", () => {
    zip = new JSZip();
})
function addHoverEvents(item) {
    item.addEventListener("mouseenter", () => { item.classList.add("isHovered") });
    item.addEventListener("mouseleave", () => { item.classList.add("byeHover"); setTimeout(() => { item.classList.remove("byeHover") }, 310) })
}
for (let item of document.querySelectorAll("input,.button,select,.optionBtn,.isHovered,.slider,img,.circular")) addHoverEvents(item);
if (localStorage.getItem("ffmpegWeb-advanced") === "a") document.getElementById("advancedFormat").checked = true;
if (!document.getElementById("advancedFormat").checked) for (let item of document.querySelectorAll("[advanced]")) item.style.display = "none";
document.getElementById("advancedFormat").addEventListener("input", () => {
    if (!document.getElementById("advancedFormat").checked) {
        for (let item of document.querySelectorAll("[advanced]")) item.style.display = "none";
        localStorage.setItem("ffmpegWeb-advanced", "b");
    } else {
        for (let item of document.querySelectorAll("[advanced]")) item.style.display = "flex";
        localStorage.setItem("ffmpegWeb-advanced", "a");
    }
});
function checkPosition(force) {
    if (force || document.getElementById("vidOutput").checked && document.getElementById("audOutput").checked || !document.getElementById("vidOutput").checked && !document.getElementById("audOutput").checked) {
        document.getElementById("scrollableItem").classList.add("leftCard", "rightCard", "width100");
    } else {
        document.getElementById("scrollableItem").classList.add("rightCard");
        document.getElementById("scrollableItem").classList.remove("width100", "leftCard");
    }
    if (window.innerWidth < 800) document.getElementById("scrollableItem").classList.remove("limitWidth");
    if (!document.getElementById("vidOutput").checked && document.getElementById("audOutput").checked) {
        document.getElementById("audioOpt").classList.remove("rightCard");
        document.getElementById("audioOpt").classList.add("leftCard");
    } else {
        document.getElementById("audioOpt").classList.add("rightCard");
        document.getElementById("audioOpt").classList.remove("leftCard");
    }
    generalHelloAnimation(document.getElementById("scrollableItem"));
}
for (let item of ["[section=metadata]", "[section=imgenc]"]) document.querySelector(item).addEventListener("click", () => {
    setTimeout(() => {
        document.getElementById("scrollableItem").classList.add("rightCard");
        document.getElementById("scrollableItem").classList.remove("width100", "leftCard");
        if (window.innerWidth < 800) document.getElementById("scrollableItem").classList.remove("limitWidth");
        generalHelloAnimation(document.getElementById("scrollableItem"));
    }, 1100)
});
for (let item of ["[section=merge]", "[section=cmd]", "[section=extractalbum]"]) document.querySelector(item).addEventListener("click", () => {
    setTimeout(() => {
        document.getElementById("scrollableItem").classList.add("leftCard", "rightCard", "width100");
        if (window.innerWidth < 800) document.getElementById("scrollableItem").classList.remove("limitWidth");
        generalHelloAnimation(document.getElementById("scrollableItem"));
    }, 1100)
});
document.querySelector("[section=reenc]").addEventListener("click", () => { checkPosition() });
document.querySelector("[section=imgenc]").addEventListener("click", () => {
    setTimeout(() => { document.getElementById("videoOpt").style.maxHeight = "" }, 150);
})
for (let switchItems of ["vidOutput", "audOutput"]) document.getElementById(switchItems).addEventListener("input", () => { checkPosition() });
let defaultThemes = {
    themes: [{
        name: "Dracula Dark",
        color: {
            text: "#fcf7f2",
            background: "#282a36",
            card: "#44475A",
            row: "#787b90",
            input: "#a1a4ba",
            select: "#30abb6"
        },
        custom: "a0",
    },
    {
        name: "Simple Dark",
        color: {
            text: "#fcf7f2",
            background: "#191919",
            card: "#393939",
            row: "#6b6b6b",
            input: "#eadb5a",
            select: "#e2b54c"
        },
        custom: "a1"
    },
    {
        name: "Simple Light",
        color: {
            text: "#171717",
            background: "#f5f5f5",
            card: "#d3d3d3",
            row: "#b9b9b9",
            input: "#e24b4d",
            select: "#c03b43"
        },
        custom: "a2"
    }
    ]
};
let customTheme = { themes: [] };
let storageItem = localStorage.getItem("ffmpegWeb-customThemes");
if (storageItem !== null && storageItem.indexOf("themes\":") !== -1) customTheme = JSON.parse(storageItem);
// I didn't manage to make it work with Object.assign and I'm lazy to debug it
let finalObj = { themes: [] };
for (let i = 0; i < defaultThemes.themes.length; i++) finalObj.themes.push(defaultThemes.themes[i]);
for (let i = 0; i < customTheme.themes.length; i++) finalObj.themes.push(customTheme.themes[i]);
for (let themeOption of finalObj.themes) addTheme(themeOption);
function createSubOption(content) {
    let nameDiv = document.createElement("div");
    nameDiv.style = "display: flex; float: left; height: 100%";
    let textName = document.createElement("l");
    textName.textContent = content;
    textName.classList.add("textName");
    nameDiv.append(textName);
    return nameDiv;
}
function createBtn(image, card, select) {
    let genericBtn = document.createElement("div");
    genericBtn.classList.add("circular");
    genericBtn.style.backgroundColor = card;
    let genericImg = document.createElement("img");
    fetchData(genericImg, image, select);
    genericImg.style = "width: 15px; height: 15px;";
    genericBtn.append(genericImg);
    addHoverEvents(genericBtn);
    return genericBtn;
}

function addTheme(themeOption) {
    let containerDiv = document.createElement("div");
    containerDiv.classList.add("colorSelect");
    let nameDiv = createSubOption(themeOption.name)
    let exportBtn = createBtn("export", themeOption.color.card, themeOption.color.select);
    exportBtn.addEventListener("click", () => {
        let link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([JSON.stringify(themeOption)]));
        link.download = `${themeOption.name}-export.json`;
        link.click();
    });
    let applyBtn = createBtn("color", themeOption.color.card, themeOption.color.select);
    applyBtn.addEventListener("click", () => {
        for (let values in themeOption.color) document.documentElement.style.setProperty(`--${values}`, themeOption.color[values]);
        for (let items of document.querySelectorAll("[data-fetch]")) fetchData(items, items.getAttribute("data-fetch"));
        localStorage.setItem("ffmpegWeb-currentTheme", themeOption.custom);
        for (let item of document.querySelectorAll("[data-change]")) item.value = getComputedStyle(document.body).getPropertyValue(`--${item.getAttribute("data-change")}`)
    });
    let exportDiv = document.createElement("div");
    if (!themeOption.custom.startsWith("a")) {
        let deleteBtn = createBtn("delete", themeOption.color.card, themeOption.color.select);
        deleteBtn.addEventListener("click", () => {
            for (let i = 0; i < customTheme.themes.length; i++) if (customTheme.themes[i].custom === themeOption.custom) customTheme.themes.splice(i, 1);
            setTimeout(() => { containerDiv.remove() }, 300);
            localStorage.setItem("ffmpegWeb-customThemes", JSON.stringify(customTheme));
            document.getElementById("themeOptions").style.maxHeight = `${parseInt(document.getElementById("themeOptions").style.maxHeight.replace("px", "")) - 55}px`
        });
        exportDiv.append(deleteBtn);
    }
    exportDiv.style = "display: flex; float: right";
    exportDiv.append(exportBtn, applyBtn);
    containerDiv.append(nameDiv, exportDiv);
    document.getElementById("themeOptions").append(containerDiv);
    document.getElementById("themeOptions").style.maxHeight = `${parseInt(document.getElementById("themeOptions").style.maxHeight.replace("px", "")) + 55}px`
}
for (let item of document.querySelectorAll("[data-change]")) item.addEventListener("input", () => { document.documentElement.style.setProperty(`--${item.getAttribute("data-change")}`, item.value) });
document.querySelector("[data-change=select]").addEventListener("change", () => { for (let items of document.querySelectorAll("[data-fetch]")) fetchData(items, items.getAttribute("data-fetch")); }) // Use "change" to avoid excessive lagging
let secTimeout = false;
document.getElementById("saveTheme").addEventListener("click", () => {
    if (secTimeout) {
        createAlert("Please wait a second.", "secondWait");
        return;
    }
    secTimeout = true;
    setTimeout(() => { secTimeout = false }, 1000);
    let name = prompt("Choose the name of your new theme");
    if (name === null) return;
    customTheme.themes.push({
        name: name,
        color: {
            text: document.querySelector("[data-change=text]").value,
            background: document.querySelector("[data-change=background]").value,
            card: document.querySelector("[data-change=card]").value,
            row: document.querySelector("[data-change=row]").value,
            input: document.querySelector("[data-change=input]").value,
            select: document.querySelector("[data-change=select]").value,
        },
        custom: new Date().toISOString()
    });
    addTheme(customTheme.themes[customTheme.themes.length - 1]);
    localStorage.setItem("ffmpegWeb-currentTheme", customTheme.themes[customTheme.themes.length - 1].custom);
    localStorage.setItem("ffmpegWeb-customThemes", JSON.stringify(customTheme));
    createAlert("Theme saved and applied successfully! You can manage it from the 'Manage Themes' section above.", "themeApplied")
});
document.getElementById("importTheme").addEventListener("click", () => {
    let quickInput = document.createElement("input");
    quickInput.type = "file";
    quickInput.addEventListener("input", () => {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            let getJson = JSON.parse(reader.result);
            let supportedVar = ["text", "background", "card", "row", "input", "select"]
            if (getJson.color !== undefined) {
                for (let colorTheme in getJson.color) if (/^#[0-9A-F]{6}$/i.test(getJson.color[colorTheme]) && supportedVar.indexOf(colorTheme) !== -1) {
                    document.querySelector(`[data-change=${colorTheme}]`).value = getJson.color[colorTheme];
                    document.documentElement.style.setProperty(`--${colorTheme}`, getJson.color[colorTheme]);
                }
                createAlert("Theme applied! Make sure to save it, so that you won't need to import it again.", "appliedTheme");
            }
        });
        reader.readAsText(quickInput.files[0]);
    })
    quickInput.click();
});
let currentTheme = localStorage.getItem("ffmpegWeb-currentTheme");
if (currentTheme !== null) {
    for (let item of finalObj.themes) if (item.custom === currentTheme) {
        for (let values in item.color) document.documentElement.style.setProperty(`--${values}`, item.color[values]);
        for (let items of document.querySelectorAll("[data-fetch]")) fetchData(items, items.getAttribute("data-fetch"));
    }
}
for (let item of document.querySelectorAll("[data-change]")) item.value = getComputedStyle(document.body).getPropertyValue(`--${item.getAttribute("data-change")}`)
if (localStorage.getItem("ffmpegWeb-alertDuration") === null) localStorage.setItem("ffmpegWeb-alertDuration", "5000");
let oldAlert = undefined;
function createAlert(text, noRepeat) {
    if (localStorage.getItem("ffmpegWeb-showAlert") === "b" || localStorage.getItem("ffmpegWeb-ignoredAlert") !== null && localStorage.getItem("ffmpegWeb-ignoredAlert").split(",").indexOf(noRepeat) !== -1) return;
    let firstAlertContainer = document.createElement("div");
    firstAlertContainer.classList.add("totalCenter", "fill", "opacity");
    let alertContainer = document.createElement("div");
    alertContainer.classList.add("alert");
    let textContainer = document.createElement("div");
    textContainer.classList.add("verticalcenter");
    let content = document.createElement("l");
    content.textContent = text;
    content.style.width = "75%";
    let img = document.createElement("img");
    img.style = "width: 25px; height: 25px; margin-right: 10px;";
    fetchData(img, "alert");
    let noRepeatIndication = document.createElement("l");
    noRepeatIndication.style = "text-decoration: underline; display: flex; justify-content: flex-end; width: 25%";
    noRepeatIndication.textContent = "Don't show again";
    noRepeatIndication.addEventListener("click", () => { if (localStorage.getItem("ffmpegWeb-ignoredAlert") === null) localStorage.setItem("ffmpegWeb-ignoredAlert", `${noRepeat},`); else localStorage.setItem("ffmpegWeb-ignoredAlert", `${localStorage.getItem("ffmpegWeb-ignoredAlert")}${noRepeat},`); deleteAlert(firstAlertContainer); });
    textContainer.append(img, content, noRepeatIndication);
    alertContainer.append(textContainer);
    firstAlertContainer.append(alertContainer);
    function appendThis() {
        document.body.append(firstAlertContainer);
        setTimeout(() => { firstAlertContainer.style.opacity = "1", 15 });
    }
    if (oldAlert !== undefined) {
        deleteAlert(oldAlert);
        setTimeout(() => { appendThis() }, 300);
    } else appendThis();
    oldAlert = firstAlertContainer;
    appendThis();
    function deleteAlert(alert) {
        alert.style.opacity = "0"; setTimeout(() => { alert.remove(); oldAlert = undefined; }, 400)
    }
    setTimeout(() => deleteAlert(firstAlertContainer), parseInt(localStorage.getItem("ffmpegWeb-alertDuration")));
    for (let item of [noRepeatIndication, img]) addHoverEvents(item);
}
createAlert("Loading ffmpeg. The 'Select files' button will be disabled until it has been loaded.", "ffmpegLoading");
document.getElementById("btnSelect").classList.add("disabled");
if (!ffmpeg.isLoaded()) ffmpeg.load().then(() => {
    createAlert("Loaded ffmpeg successfully!", "ffmpegSuccessful");
    document.getElementById("btnSelect").classList.remove("disabled");
});
let installationPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installationPrompt = event;
});
document.getElementById("pwaInstall").addEventListener("click", () => {
    installationPrompt.prompt();
    installationPrompt.userChoice.then(choice => {
        if (choice.outcome === "accepted") scrollItem();
    });
});
if (window.matchMedia('(display-mode: standalone)').matches) scrollItem();
function scrollItem(invert) {
    let itemId = [["pwaPromote", "redownload"], ["Left", "Right"]];
    if (invert) { itemId[0].reverse(); itemId[1].reverse() }
    document.getElementById(itemId[0][0]).classList.add("animate__animated", `animate__backOut${itemId[1][0]}`);
    setTimeout(() => {
        document.getElementById(itemId[0][0]).style.display = "none";
        document.getElementById(itemId[0][0]).classList.remove("animate__animated", `animate__backOut${itemId[1][0]}`);
        document.getElementById(itemId[0][1]).style.display = "inline";
        document.getElementById(itemId[0][1]).classList.add("animate__animated", `animate__backIn${itemId[1][1]}`);
    }, 510)
}
document.getElementById("alertDuration").addEventListener("input", () => { localStorage.setItem("ffmpegWeb-alertDuration", document.getElementById("alertDuration").value) });
document.getElementById("resetBtn").addEventListener("click", () => { localStorage.setItem("ffmpegWeb-ignoredAlert", ""); createAlert("All the alerts are now visible", "alertVisible") });
document.getElementById("alertAsk").addEventListener("input", () => {
    if (document.getElementById("alertAsk").checked) {
        localStorage.setItem("ffmpegWeb-showAlert", "a");
        document.getElementById("alertOptions").style.display = "block";
        setTimeout(() => { document.getElementById("alertOptions").style.maxHeight = "9999px"; }, 15);
    } else {
        localStorage.setItem("ffmpegWeb-showAlert", "b");
        document.getElementById("alertOptions").style.maxHeight = "0px";
        setTimeout(() => { document.getElementById("alertOptions").style.display = "none" }, 350);
    }
});
if (localStorage.getItem("ffmpegWeb-showAlert") === "b") { document.getElementById("alertOptions").style.maxHeight = "0px"; document.getElementById("alertOptions").style.display = "none"; document.getElementById("alertAsk").checked = false; }
if (localStorage.getItem("ffmpegWeb-alertDuration") !== null) document.getElementById("alertDuration").value = parseInt(localStorage.getItem("ffmpegWeb-alertDuration"));
function getLicense(license, author) {
    switch (license) {
        case "hippocratic":
            return `${author} (“Licensor”)<br><br>Hippocratic License Version Number: 2.1.<br><br>Purpose. The purpose of this License is for the Licensor named above to permit the Licensee (as defined below) broad permission, if consistent with Human Rights Laws and Human Rights Principles (as each is defined below), to use and work with the Software (as defined below) within the full scope of Licensor’s copyright and patent rights, if any, in the Software, while ensuring attribution and protecting the Licensor from liability.<br><br>Permission and Conditions. The Licensor grants permission by this license (“License”), free of charge, to the extent of Licensor’s rights under applicable copyright and patent law, to any person or entity (the “Licensee”) obtaining a copy of this software and associated documentation files (the “Software”), to do everything with the Software that would otherwise infringe (i) the Licensor’s copyright in the Software or (ii) any patent claims to the Software that the Licensor can license or becomes able to license, subject to all of the following terms and conditions:<br><br>* Acceptance. This License is automatically offered to every person and entity subject to its terms and conditions. Licensee accepts this License and agrees to its terms and conditions by taking any action with the Software that, absent this License, would infringe any intellectual property right held by Licensor.<br><br>* Notice. Licensee must ensure that everyone who gets a copy of any part of this Software from Licensee, with or without changes, also receives the License and the above copyright notice (and if included by the Licensor, patent, trademark and attribution notice). Licensee must cause any modified versions of the Software to carry prominent notices stating that Licensee changed the Software. For clarity, although Licensee is free to create modifications of the Software and distribute only the modified portion created by Licensee with additional or different terms, the portion of the Software not modified must be distributed pursuant to this License. If anyone notifies Licensee in writing that Licensee has not complied with this Notice section, Licensee can keep this License by taking all practical steps to comply within 30 days after the notice. If Licensee does not do so, Licensee’s License (and all rights licensed hereunder) shall end immediately.<br><br>* Compliance with Human Rights Principles and Human Rights Laws.<br><br>    1. Human Rights Principles.<br><br>        (a) Licensee is advised to consult the articles of the United Nations Universal Declaration of Human Rights and the United Nations Global Compact that define recognized principles of international human rights (the “Human Rights Principles”). Licensee shall use the Software in a manner consistent with Human Rights Principles.<br><br>        (b) Unless the Licensor and Licensee agree otherwise, any dispute, controversy, or claim arising out of or relating to (i) Section 1(a) regarding Human Rights Principles, including the breach of Section 1(a), termination of this License for breach of the Human Rights Principles, or invalidity of Section 1(a) or (ii) a determination of whether any Law is consistent or in conflict with Human Rights Principles pursuant to Section 2, below, shall be settled by arbitration in accordance with the Hague Rules on Business and Human Rights Arbitration (the “Rules”); provided, however, that Licensee may elect not to participate in such arbitration, in which event this License (and all rights licensed hereunder) shall end immediately. The number of arbitrators shall be one unless the Rules require otherwise.<br><br>        Unless both the Licensor and Licensee agree to the contrary: (1) All documents and information concerning the arbitration shall be public and may be disclosed by any party; (2) The repository referred to under Article 43 of the Rules shall make available to the public in a timely manner all documents concerning the arbitration which are communicated to it, including all submissions of the parties, all evidence admitted into the record of the proceedings, all transcripts or other recordings of hearings and all orders, decisions and awards of the arbitral tribunal, subject only to the arbitral tribunal's powers to take such measures as may be necessary to safeguard the integrity of the arbitral process pursuant to Articles 18, 33, 41 and 42 of the Rules; and (3) Article 26(6) of the Rules shall not apply.<br><br>    2. Human Rights Laws. The Software shall not be used by any person or entity for any systems, activities, or other uses that violate any Human Rights Laws.  “Human Rights Laws” means any applicable laws, regulations, or rules (collectively, “Laws”) that protect human, civil, labor, privacy, political, environmental, security, economic, due process, or similar rights; provided, however, that such Laws are consistent and not in conflict with Human Rights Principles (a dispute over the consistency or a conflict between Laws and Human Rights Principles shall be determined by arbitration as stated above).  Where the Human Rights Laws of more than one jurisdiction are applicable or in conflict with respect to the use of the Software, the Human Rights Laws that are most protective of the individuals or groups harmed shall apply.<br><br>    3. Indemnity. Licensee shall hold harmless and indemnify Licensor (and any other contributor) against all losses, damages, liabilities, deficiencies, claims, actions, judgments, settlements, interest, awards, penalties, fines, costs, or expenses of whatever kind, including Licensor’s reasonable attorneys’ fees, arising out of or relating to Licensee’s use of the Software in violation of Human Rights Laws or Human Rights Principles.<br><br>* Failure to Comply. Any failure of Licensee to act according to the terms and conditions of this License is both a breach of the License and an infringement of the intellectual property rights of the Licensor (subject to exceptions under Laws, e.g., fair use). In the event of a breach or infringement, the terms and conditions of this License may be enforced by Licensor under the Laws of any jurisdiction to which Licensee is subject. Licensee also agrees that the Licensor may enforce the terms and conditions of this License against Licensee through specific performance (or similar remedy under Laws) to the extent permitted by Laws. For clarity, except in the event of a breach of this License, infringement, or as otherwise stated in this License, Licensor may not terminate this License with Licensee.<br><br>* Enforceability and Interpretation. If any term or provision of this License is determined to be invalid, illegal, or unenforceable by a court of competent jurisdiction, then such invalidity, illegality, or unenforceability shall not affect any other term or provision of this License or invalidate or render unenforceable such term or provision in any other jurisdiction; provided, however, subject to a court modification pursuant to the immediately following sentence, if any term or provision of this License pertaining to Human Rights Laws or Human Rights Principles is deemed invalid, illegal, or unenforceable against Licensee by a court of competent jurisdiction, all rights in the Software granted to Licensee shall be deemed null and void as between Licensor and Licensee. Upon a determination that any term or provision is invalid, illegal, or unenforceable, to the extent permitted by Laws, the court may modify this License to affect the original purpose that the Software be used in compliance with Human Rights Principles and Human Rights Laws as closely as possible. The language in this License shall be interpreted as to its fair meaning and not strictly for or against any party.<br><br> * Disclaimer. TO THE FULL EXTENT ALLOWED BY LAW, THIS SOFTWARE COMES “AS IS,” WITHOUT ANY WARRANTY, EXPRESS OR IMPLIED, AND LICENSOR AND ANY OTHER CONTRIBUTOR SHALL NOT BE LIABLE TO ANYONE FOR ANY DAMAGES OR OTHER LIABILITY ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THIS LICENSE, UNDER ANY KIND OF LEGAL CLAIM.<br><br>This Hippocratic License is an Ethical Source license (https://ethicalsource.dev) and is offered for use by licensors and licensees at their own risk, on an “AS IS” basis, and with no warranties express or implied, to the maximum extent permitted by Laws.`;
        default:
            return `MIT License<br><br>Copyright (c) ${author}<br><br>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:<br><br>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. <br><br>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
    }
}
for (let item of document.querySelectorAll("[data-license]")) item.addEventListener("click", () => {
    document.getElementById("selectedLicense").innerHTML = getLicense(item.getAttribute("data-license"), item.getAttribute("data-author"));
    if (document.querySelector(".licenseSelect") !== null) document.querySelector(".licenseSelect").classList.remove("licenseSelect");
    item.classList.add("licenseSelect");
});
let suggestedMetadata = [["album", "composer", "genre", "copyright", "title", "language", "artist", "album_artist", "performer", "disc", "publisher", "track", "lyrics", "compilation", "date", "creation_time", "album-sort", "artist-sort", "title-sort"], ["Album name", "Composers", "Genre", "Copyright", "Title", "Language", "Artists", "Album Artists", "Performers", "Disc", "Publishers", "Track number", "Lyrics", "Compilation", "Published date", "Creation time", "Album sort name", "Artist sort name", "Title sort name"]]
for (let i = 0; i < suggestedMetadata[0].length; i++) {
    let metadataAppend = document.createElement("div");
    metadataAppend.classList.add("optionBtn", "minWidth");
    metadataAppend.setAttribute("data-key", suggestedMetadata[0][i]);
    let label = document.createElement("l");
    label.classList.add("totalCenter");
    label.textContent = suggestedMetadata[1][i];
    metadataAppend.addEventListener("click", () => {
        if (document.querySelector(".metadataSelect") !== null) document.querySelector(".metadataSelect").classList.remove("metadataSelect");
        metadataAppend.classList.add("metadataSelect");
        generalByeAnimation(document.getElementById("onlyCustom"));
    });
    metadataAppend.append(label);
    document.getElementById("metadataShow").append(metadataAppend);
    addHoverEvents(metadataAppend);
}
document.querySelector("[data-key=custom]").addEventListener("click", () => {
    if (document.querySelector(".metadataSelect") !== null) document.querySelector(".metadataSelect").classList.remove("metadataSelect");
    document.querySelector("[data-key=custom]").classList.add("metadataSelect");
    generalHelloAnimation(document.getElementById("onlyCustom"), true)
});
let customCount = 0;
document.getElementById("customAlbumArt").addEventListener("change", () => {
    if (document.getElementById("customAlbumArt").checked) {
        document.getElementById("customAlbumArt").checked = false;
        let imgInput = document.createElement("input");
        imgInput.type = "file";
        imgInput.addEventListener("change", () => {
            document.getElementById("customAlbumArt").checked = true;
            conversionOptions.metadata.img = imgInput.files[0];
        });
        imgInput.click();
    }
})
document.getElementById("itemAdd").addEventListener("click", () => {
    let elementKey = document.querySelector(".metadataSelect").getAttribute("data-key");
    let currentCustom = false;
    if (elementKey === "custom") { elementKey = document.getElementById("metadataKey").value; customCount++; currentCustom = true; }
    let pushId = conversionOptions.metadata.items.length;
    conversionOptions.metadata.items.push({ key: elementKey, value: document.getElementById("metadataValue").value });
    let containerDiv = document.createElement("div");
    containerDiv.classList.add("colorSelect");
    containerDiv.style = "background-color: var(--row)";
    let metadataName = createSubOption(`${elementKey} | ${document.getElementById("metadataValue").value}`);
    let deleteDiv = document.createElement("div");
    deleteDiv.style = "display: flex; float: right";
    let deleteBtn = createBtn("delete", "var(--card)", `${getComputedStyle(document.body).getPropertyValue("--select")}`);
    deleteBtn.addEventListener("click", () => {
        if (currentCustom) customCount--;
        conversionOptions.metadata.items.splice(pushId, 1);
        setTimeout(() => { containerDiv.remove() }, 300);
        document.getElementById("metadataAdded").style.maxHeight = `${parseInt(document.getElementById("metadataAdded").style.maxHeight.replace("px", "")) - 55}px`;
    });
    deleteDiv.append(deleteBtn);
    containerDiv.append(metadataName, deleteDiv);
    document.getElementById("metadataAdded").append(containerDiv);
    document.getElementById("metadataAdded").style.maxHeight = `${parseInt(document.getElementById("metadataAdded").style.maxHeight.replace("px", "")) + 55}px`
})
document.getElementById("cutVideoSelect").addEventListener("change", () => {
    let showValue = [undefined, document.getElementById("singleCrop"), document.getElementById("multiCrop")]
    for (let i = 1; i < showValue.length; i++) if (parseInt(document.getElementById("cutVideoSelect").value) === i) generalHelloAnimation(showValue[i], true); else generalByeAnimation(showValue[i]);
})
let currentState = document.querySelector("html").offsetWidth > 799 ? 0 : 1;
if (currentState === 0) document.getElementById("textAdapt").textContent = "card at the right of this one";
window.addEventListener("resize", () => {
    if (document.querySelector("html").offsetWidth > 799 && currentState === 1) {
        currentState = 0;
        document.getElementById("textAdapt").textContent = "card at the right of this one";
        document.querySelector(".flexAdaptive").prepend(document.querySelector("[data-card=contentCard]"), document.querySelector("[data-card=fileSelection]"), document.querySelector("[data-card=metadata]"), document.querySelector("[data-card=video]"), document.querySelector("[data-card=audio]", document.querySelector("[data-card=progress]")));
    } else if (document.querySelector("html").offsetWidth < 800 && currentState === 0) {
        document.getElementById("textAdapt").textContent = "second last card";
        currentState = 1;
        document.querySelector(".flexAdaptive").prepend(document.querySelector("[data-card=contentCard]"), document.querySelector("[data-card=metadata]"), document.querySelector("[data-card=video]"), document.querySelector("[data-card=audio]",  document.querySelector("[data-card=fileSelection]"), document.querySelector("[data-card=progress]")));
    }
})