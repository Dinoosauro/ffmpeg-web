// Register service worker for offline access
if ('serviceWorker' in navigator) {
    let registration;
    const registerServiceWorker = async () => {
        registration = await navigator.serviceWorker.register('./service-worker.js',);
    };
    registerServiceWorker();
} else console.error(":/")
// Check if there's a new version fetching updatecode.txt with no cache. If the result isn't the same as the current app version, a confirm dialog will be shown so that the user can update.
let appVersion = "1.1.2";
fetch("./updatecode.txt", { cache: "no-store" }).then((res) => res.text().then((text) => { if (text.replace("\n", "") !== appVersion) if (confirm(`There's a new version of ffmpeg-web. Do you want to update? [${appVersion} --> ${text.replace("\n", "")}]`)) { caches.delete("ffmpegweb-cache"); location.reload(true); } }).catch((e) => { console.error(e) })).catch((e) => console.error(e));
document.getElementById("version").textContent = appVersion; // Write current text version to the info tab in settings
// Load English translations for strings that come from JavaScript
let englishTranslations = {
    html: {},
    js: {
        added: "Added",
        toZip: "to the zip file",
        downloadHere: "Download here",
        troubleDownload: "Having trouble downloading? Click here",
        wait: "Please wait a second",
        chooseName: "Choose a name for your theme",
        themeCreated: "Theme saved and applied successfully! You can manage it from the 'Manage Themes' section above.",
        themeApplied: "Theme applied! Make sure to save it, so that you won't need to import it again.",
        ffmpegLoad: "Loading ffmpeg. The 'Select files' button will be disabled until it has been loaded.",
        successful: "Loaded ffmpeg successfully!",
        error: "An error occourred while loading ffmpeg",
        rightCard: "card at the right of this one",
        secondCard: "second last card",
        noAgain: "Don't show again",
        visibleAlerts: "All the alerts are now visible",
        ffmpegWait: "Wait until ffmpeg is loaded",
        allAlbum: "All the album arts are exported",
        conversionEnded: "Executed conversion of all selected files :D",
        oom: "The ffmpeg process has reported an Out of memory error. Please refresh the webpage and restart the operation. If you are using the \"Multiple timestamp\" cut, add again only the missing files."
    }
}
let currentTranslation = englishTranslations;
// conversionOptions: an object that contains options about the encoding settings. These options will be applied to every file passed.
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
        merged: false,
        dividerProgression: 0,
    },
    metadata: {
        items: [],
        img: undefined,
    }
}

document.getElementById("btnSelect").addEventListener("click", () => { // The "Select file" button.
    // If ffmpeg.wasm is not loaded, don't do anything.
    if (document.getElementById("btnSelect").classList.contains("disabled")) { createAlert(englishTranslations.js.ffmpegWait, "ffmpegLoadRemind"); return; };
    // Reset the inputs so that, even if there's an error in the ffmpeg conversion, it'll be possible to continue using the website.
    document.getElementById("reset").reset();
    tempOptions = optionGet();
    // Start file selection progress
    document.getElementById("fileInput").click();
});
let isMultiCheck = [false, 0]; // Array of two items: [Boolean: multiple files must be converted (with multiple file outputs); the number of files converted]

// The first function that uses ffmpeg: extract an album art from an audio file and convert it to the selected image format.
async function extractAlbumArt() {
    for (let item of document.getElementById("fileInput").files) {
        ffmpeg.FS("writeFile", item.name, await fetchFile(item));
        let prepareScript = ["-i", item.name];
        if (document.querySelector(".imgSelect").getAttribute("data-imgval") !== "no") prepareScript.push("-vcodec", document.querySelector(".imgSelect").getAttribute("data-imgval")); // data-imgval = encoder; data-extension = file extension;
        let outName = `${item.name.substring(0, item.name.lastIndexOf("."))}.${document.querySelector(".imgSelect").getAttribute("data-extension")}`;
        await ffmpeg.run(...prepareScript, outName);
        downloadItem(await ffmpeg.FS("readFile", outName), outName);
    }
    createAlert(englishTranslations.js.allAlbum, "albumArtExported");
}

document.getElementById("fileInput").addEventListener("input", () => { // After a file has been selected, the website will start to look into the selected files and start the conversion
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); // Go to the bottom of the page, where the conversion stats will be displayed.
    let files = document.getElementById("fileInput").files;
    if (document.getElementById("mergeName").value.endsWith(".alac")) document.getElementById("mergeName").value = `${document.getElementById("mergeName").value.substring(0, document.getElementById("mergeName").value.length - 5)}.m4a`; // Since ffmpeg doesn't recognize the ".alac" extension, it'll be converted to .m4a, that still supports the alac encoder
    let tempPush = [];
    if (document.querySelector(".sectionSelect").getAttribute("section") === "extractalbum") { // If the user is on the "Extract album tab", execute a completely different function that will handle that, and stop this.
        extractAlbumArt();
        return;
    }
    conversionOptions.output.dividerProgression = parseInt(document.getElementById("trackStart").value) - 1;
    if (document.getElementById("cutVideoSelect").value === "2") tempOptions.isSecondCut = true; // If the value is "2", the user wants that the content divided in some parts (with timestamps)
    if (document.querySelector(".sectionSelect").getAttribute("section") === "cmd") conversionOptions.output.custom = true; else conversionOptions.output.custom = false; // Make this so that if the user changes tab for more conversion the custom script isn't kept
    if (document.querySelector(".sectionSelect").getAttribute("section") === "merge") conversionOptions.output.merged = true; else conversionOptions.output.merged = false; // Same as before
    if (document.getElementById("redownload").style.display !== "inline") scrollItem();
    if (conversionOptions.output.merged) { // If the user wants to merge content, go to the function created for that and return
        mergeContent(files);
        return;
    }
    switch (parseInt(document.getElementById("multiVideoHandle").value)) { // multiVideoHandle is the ID of the select that permits the user to choose how multiple files should be handled
        case 1: case -1: // Cases where every item selected is important in the final script
            tempPush = files;
            break;
        case 2: // Match the file content that has the same name as the first content
            for (let i = 1; i < files.length; i++) if (files[0].name.substring(0, files[0].name.lastIndexOf(".")) === files[i].name.substring(0, files[i].name.lastIndexOf("."))) tempPush.push(files[i], files[0]);
            break;
        case 3: case 4: // Multiple files output: look to the function that handles it.
            isMultiCheck[0] = true;
            ffmpegMultiCheck();
            return;
        default: // Just the first file uploaded
            tempPush.push(files[0]);
            break;
    }
    for (let item of tempPush) loadFile(item); // Add information about the current file to the object that contains operation-specific informations
    ffmpegStart(); // Start the conversion
});
function ffmpegMultiCheck() { // Manages multiple outputs
    let files = document.getElementById("fileInput").files;
    if (document.getElementById("cutVideoSelect").value === "2") tempOptions.isSecondCut = true; // If the value is "2", the user wants that the content divided in some parts (with timestamps)
    if (isMultiCheck[1] >= files.length) { document.getElementById("reset").reset(); createAlert(currentTranslation.js.conversionEnded, "convertAll"); isMultiCheck = [false, 0]; return } // All the files are converted, so nothing else will be done
    if (parseInt(document.getElementById("multiVideoHandle").value) === 3) { // Add input to the command if they have the same name (for each content selected)
        let stopLooking = false;
        for (let i = isMultiCheck[1]; i < files.length; i++) {
            for (let x = isMultiCheck[1]; x < files.length; x++) { // Not efficient at all, I should really improve this
                if (files[i].name === files[x].name) continue;
                if (files[i].name.substring(0, files[i].name.lastIndexOf(".")) === files[x].name.substring(0, files[x].name.lastIndexOf("."))) {
                    stopLooking = true;
                    conversionOptions.output.name = safeCharacters(files[i].name.substring(0, files[i].name.lastIndexOf(".")));
                    isMultiCheck[1] = i + 1; // i !== isMultiCheck[1]
                    loadFile(files[i]); // Add information about the selected files
                    loadFile(files[x]); // Add information about the selected files
                    ffmpegStart(); // Start ffmpeg
                    break;
                }
            }
            if (stopLooking) break;
        }
    } else { // For each file selected, execute the same command
        loadFile(files[isMultiCheck[1]]); // Fetch file information
        conversionOptions.output.name = safeCharacters(files[isMultiCheck[1]].name.substring(0, files[isMultiCheck[1]].name.lastIndexOf(".")));
        isMultiCheck[1] += 1;
        ffmpegStart(); // Start conversion
    }
}
async function mergeContent(file) { // Function that mangaes merging content
    let conversionFile = "";
    let deleteFiles = []; // The files to delete from ffmpeg.wasm memory after the conversion
    for (let fileItem of file) { // Create a list of content that will be merged, so that it can be passed to ffmpeg
        conversionFile += `\nfile '${fileItem.name}'`;
        ffmpeg.FS("writeFile", fileItem.name, await fetchFile(fileItem));
        deleteFiles.push(fileItem.name)
    }
    conversionFile = conversionFile.substring(1); // Delete the first \n
    await ffmpeg.FS("writeFile", "array.txt", new TextEncoder().encode(conversionFile)); // Create a binary file from the list, so that it can be handled by ffmpeg.
    if (document.getElementById("mergeName").value === "") document.getElementById("mergeName").value = `merged-${file[0].name}`; // Create a fallback name if the user hasn't written anything in the "Output file name" textbox
    if (document.getElementById("mergeName").value.endsWith(".m4a")) await ffmpeg.run("-f", "concat", "-safe", "0", "-i", "array.txt", "-c", "copy", "-map_metadata", "0", "-vn", `a${document.getElementById("mergeName").value}`); else await ffmpeg.run("-f", "concat", "-safe", "0", "-i", "array.txt", "-c", "copy", "-map_metadata", "0", `a${document.getElementById("mergeName").value}`); // If the file ends with ".m4a", the video (99% it's an album art) must be discarded, since ffmpeg won't be able to handled that correctly.
    let data = await ffmpeg.FS("readFile", `a${document.getElementById("mergeName").value}`); // get the result
    deleteFiles.push(`a${document.getElementById("mergeName").value}`);
    let start = "a"; // The prefix to the output file
    if (document.getElementById("keepAlbumArt").checked) { // The album art must be kept
        try {
            await ffmpeg.run("-i", file[0].name, "temp.jpg"); // Fetch the album art from the original file
            await ffmpeg.run("-i", `a${document.getElementById("mergeName").value}`, "-i", "temp.jpg", "-map", "0", "-map", "1", "-c", "copy", "-disposition:v:0", "attached_pic", `aa${document.getElementById("mergeName").value}`); // And merge it, without re-encoding, to the final content
            data = await ffmpeg.FS("readFile", `aa${document.getElementById("mergeName").value}`); // Fetch the new file with album art
            deleteFiles.push(`aa${document.getElementById("mergeName").value}`, "temp.jpg");
            start = "aa";
        } catch (ex) {
            console.error(ex);
        }
    }
    try {
        await ffmpeg.run("-i", `${start}${document.getElementById("mergeName").value}`, "-i", file[0].name, "-map", "0", "-map_metadata", "1", "-c", "copy", `aaa${document.getElementById("mergeName").value}`); // Copy all of the metadata of the first selected file to the final one
        data = await ffmpeg.FS("readFile", `aaa${document.getElementById("mergeName").value}`); // Fetch the final file
        deleteFiles.push(`aaa${document.getElementById("mergeName").value}`);
    } catch (ex) {
        console.error(ex);
    }
    document.getElementById("console").innerHTML = consoleText; // Add information text
    document.getElementById("console").parentElement.scrollTo({ top: document.getElementById("console").parentElement.scrollHeight, behavior: 'smooth' }); // Scroll to the bottom of information text
    downloadItem(data, document.getElementById("mergeName").value);
    for (let fileItem of deleteFiles) await ffmpeg.FS("unlink", fileItem);
    tempOptions = optionGet(); // Prepare for another conversion, deleting conversion-specific informations
}
async function ffmpegReadyMetadata() { // Used by the "Metadata" tab, this function will add to the array all the metadata the user has inserted
    tempOptions.ffmpegArray.push("-codec", "copy"); // No re-encodnig
    if (!document.getElementById("metadataKeep").checked) tempOptions.ffmpegArray.push("-map_metadata", "-1"); // If the user wants to keep metadata, use the metadata of the selected file as base for other ones
    for (let item of conversionOptions.metadata.items) tempOptions.ffmpegArray.push("-metadata", `${item.key}=${item.value}`); // Add all of the custom metadata to the script
    if (conversionOptions.metadata.img !== undefined && document.getElementById("customAlbumArt").checked) { // If there's a valid image, add it as an album art. It'll be added in the array later.
        ffmpeg.FS("writeFile", "temp.jpg", await fetchFile(conversionOptions.metadata.img));
        tempOptions.deleteFile.push("temp.jpg");
    }
    if (document.getElementById("removeOlderArt").checked) tempOptions.ffmpegArray.push("-vn"); // If the user doesn't want to keep the album art, delete it
    tempOptions.fileExtension = tempOptions.ffmpegName[0].substring(tempOptions.ffmpegName[0].lastIndexOf(".") + 1);
    if (!document.getElementById("mp4Keep").checked && customCount > 0 && tempOptions.fileExtension === "mp4" || tempOptions.fileExtension === "m4v" || tempOptions.fileExtension === "m4a" || tempOptions.fileExtension === "alac") tempOptions.ffmpegArray.push("-movflags", "use_metadata_tags"); // Enable custom metadata for MP4 container
    addSimpleCut(); // Checks if the user wants to trim the content to get only a part of it
    tempOptions.ffmpegArray.push(`a${tempOptions.ffmpegName[0]}`);
}
function getFfmpegItem() { // The function that will manage the start and the end of the specific file part (if timestamps are provideed)
    let item = document.getElementById("timestampArea").value.split("\n"); // Each line is a new timestamp
    let getOptions = item[tempOptions.secondCutProgress]; // The timestamp the website needs to look
    getOptions = getOptions.split(document.getElementById("dividerInput").value); // Split by the divider, so in a array value there'll be the title, in the other the timestamp
    let cutTimestamp = ["", ""];
    function getCutAlignment() {
        if (document.getElementById("timestampPosition").value === "0") return [getOptions[1], getOptions[0].replaceAll(" ", "")]; // Timestamp at the left
        return [getOptions[0], getOptions[1].replaceAll(" ", "")] // Timestamp at the right
    }
    let alignmentResult = getCutAlignment();
    conversionOptions.output.dividerProgression++;
    conversionOptions.output.name = safeCharacters(alignmentResult[0]);
    cutTimestamp[0] = alignmentResult[1];
    tempOptions.secondCutProgress++;
    if (item.length > tempOptions.secondCutProgress && item[tempOptions.secondCutProgress].replaceAll(" ", "").length > 1) { // If there's another timestamp next, get its length for the end of the current content.
        getOptions = item[tempOptions.secondCutProgress];
        getOptions = getOptions.split(document.getElementById("dividerInput").value);
        cutTimestamp[1] = getCutAlignment()[1];
    }
    if (conversionOptions.output.custom) { // If this is used in a custom script, fetch the final extension 
        tempOptions.fileExtension = tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].substring(tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].lastIndexOf("."));
    }
    return intelligentTime(cutTimestamp);
}
function intelligentTime(timeArray) {
    for (let i = 0; i < timeArray.length; i++) {
        if (timeArray[i] === "" && i === 0) timeArray = "00:00:00"; else if (timeArray[i] === "") continue;
        timeArray[i] = timeArray[i].replaceAll(".", ":");
        let splitArray = timeArray[i].split(":");
        for (let x = 0; x < splitArray.length; x++) if (splitArray[x].length === 1) splitArray[x] = `0${splitArray[x]}`;
        if (splitArray.length === 1) splitArray.unshift("00", "00"); else if (splitArray.length === 2) splitArray.unshift("00");
        timeArray[i] = splitArray.join(":");     
    }
    return timeArray;
}
async function ffmpegStart(skipImport) { // The function that manages most of the ffmpeg conversions
    let finalScript = [];
    if (!skipImport) {
    if (conversionOptions.output.custom) readFfmpegScript(); else if (document.querySelector(".sectionSelect").getAttribute("section") === "metadata") await ffmpegReadyMetadata(); else buildFfmpegScript();
    if (tempOptions.itsscale !== []) finalScript.push(...tempOptions.itsscale); // tempOptions.itsscale contains the options that go before the input files
    for (let i = 0; i < tempOptions.ffmpegBuffer.length; i++) { // Add each file to the ffmpeg filesystem
        ffmpeg.FS('writeFile', tempOptions.ffmpegName[i], await fetchFile(tempOptions.ffmpegBuffer[i]));
        if (conversionOptions.output.custom && tempOptions.ffmpegArray.indexOf(`$input[${i}]`) !== -1) tempOptions.ffmpegArray[tempOptions.ffmpegArray.indexOf(`$input[${i}]`)] = tempOptions.ffmpegName[i]; else finalScript.push("-i", tempOptions.ffmpegName[i]);
        tempOptions.deleteFile.push(tempOptions.ffmpegName[i]);
    }
} else for (let name of tempOptions.ffmpegName) finalScript.push("-i", name);
    if (tempOptions.isSecondCut) { // Cut content by timestamp
        let fetchTimestamp = getFfmpegItem();
        if (!skipImport) tempOptions.ffmpegArray.pop();  // Delete the last item of the array (the output file) and insert the start and end of the new item. This is necessary only for the first time
        tempOptions.ffmpegArray.push("-ss", fetchTimestamp[0]);
        if (fetchTimestamp[1] !== "") tempOptions.ffmpegArray.push("-to", fetchTimestamp[1]); else tempOptions.isSecondCut = false;
    if (document.getElementById("smartMetadata").checked) tempOptions.ffmpegArray.push("-metadata", `title=${conversionOptions.output.name}`, "-metadata", `track=${conversionOptions.output.dividerProgression}`); // Smart metadata for multiple dividers
        tempOptions.ffmpegArray.push(`a${conversionOptions.output.name}.${tempOptions.fileExtension}`); // Push the output file name
    }
    finalScript.push(...tempOptions.ffmpegArray);
    await ffmpeg.run(...finalScript); // Run conversion
    let startDifferentText = "a";
    if (conversionOptions.output.custom) { // Get file name and extension of the custom file output
        conversionOptions.output.name = safeCharacters(tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].substring(0, tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].lastIndexOf(".")));
        tempOptions.fileExtension = tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].substring(tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].lastIndexOf(".") + 1);
        startDifferentText = "";
    }
    let data = ffmpeg.FS('readFile', `${startDifferentText}${conversionOptions.output.name}.${tempOptions.fileExtension}`); // Read the result of the conversion
    tempOptions.deleteFile.push(`${startDifferentText}${conversionOptions.output.name}.${tempOptions.fileExtension}`);
    if (document.getElementById("albumArtCheck").checked && conversionOptions.output.audExtension !== "ogg" || document.querySelector(".sectionSelect").getAttribute("section") === "metadata" && document.getElementById("customAlbumArt").checked && conversionOptions.metadata.img !== undefined) { // If these conditions are satisfied, the album art must be added
        try {
            if (document.getElementById("albumArtCheck").checked && conversionOptions.output.audExtension !== "ogg" && !document.getElementById("customAlbumArt").checked) await ffmpeg.run("-i", tempOptions.ffmpegName[0], "temp.jpg"); // If the album art isn't provided by the user (this is only possible in the metadata tab), it'll be fetched from the input file.
            let tempArray = [];
    if (document.getElementById("smartMetadata").checked && tempOptions.isSecondCut) tempArray.push("-metadata", `title=${conversionOptions.output.name}`, "-metadata", `track=${conversionOptions.output.dividerProgression}`); // Smart metadata for cutting item by timestamp
            await ffmpeg.run("-i", `${startDifferentText}${conversionOptions.output.name}.${tempOptions.fileExtension}`, "-i", "temp.jpg", "-map", "0", "-map", "1", "-c", "copy", "-disposition:v:0", "attached_pic", ...tempArray, `aa${conversionOptions.output.name}.${tempOptions.fileExtension}`); // Add the album art to the file
            data = ffmpeg.FS("readFile", `aa${conversionOptions.output.name}.${tempOptions.fileExtension}`) // Read the exported file with the album art
            tempOptions.deleteFile.push(`temp.jpg`, `aa${conversionOptions.output.name}.${tempOptions.fileExtension}`);
        } catch (ex) {
            console.error(ex);
        }
    }
    downloadItem(data);
    document.getElementById("console").innerHTML = consoleText; // Add output text to the console
    document.getElementById("console").parentElement.scrollTo({ top: document.getElementById("console").parentElement.scrollHeight, behavior: 'smooth' }); // Scroll to the end of the console text
    let textCutSplit = document.getElementById("timestampArea").value.split("\n");
    if (tempOptions.isSecondCut && textCutSplit.length > tempOptions.secondCutProgress && textCutSplit[tempOptions.secondCutProgress].replaceAll(" ", "").length > 1) { // If there's another timestamp, run again the conversion
        tempOptions.ffmpegArray.splice(tempOptions.ffmpegArray.lastIndexOf("-ss"), tempOptions.ffmpegArray.length);
        try {
            if (document.getElementById("quitFfmpegTimestamp").checked) await resetFfmpeg();
            for (let file of [`a${conversionOptions.output.name}.${tempOptions.fileExtension}`, `aa${conversionOptions.output.name}.${tempOptions.fileExtension}`]) try { await ffmpeg.FS('unlink', file); } catch (ex) { console.warn(ex) }; // Delete the files from the ffmpeg file system
            await ffmpegStart(!document.getElementById("quitFfmpegTimestamp").checked);
        } catch (ex) {
            console.warn(ex);
        }
    }
    for (let file of tempOptions.deleteFile) try { await ffmpeg.FS('unlink', file); } catch (ex) { console.warn(ex) }; // Delete the files from the ffmpeg file system
    tempOptions.deleteFile = []; // Restore the deleteFile array. This is useful especially with multiple timestamp cut, since otherwise ffmpeg-web would continue to try deleting the old files.
    tempOptions = optionGet(); // Delete the conversion-specific informations, so that a new item can be converted
    conversionOptions.output.dividerProgression = 0; // Restore the divider progression so that each conversion has its own track progression
    if (isMultiCheck[0]) setTimeout(async () => { // if antother item must be converted, restart all of this process; otherwise reset the text input so that the user can select another file. In both cases, restore ffmpeg to free memory
        finalScript = []; 
        if (document.getElementById("quitFfmpegGeneral").checked) await resetFfmpeg(); 
        ffmpegMultiCheck() 
    }, 350); else {
        document.getElementById("reset").reset(); 
        if (document.getElementById("quitFfmpegGeneral").checked) await resetFfmpeg()
    } 
}
function downloadItem(data, name) { // Function to download a file
    downloadName = name !== undefined ? name : `${safeCharacters(conversionOptions.output.name)}.${tempOptions.fileExtension}`; // If no name is provided, fetch the result of the conversion
    if (document.getElementById("zipSave").checked) { // If the user wants a zip file, add it to JSZIP, and notify the user
        zip.file(downloadName, new File([data.buffer], downloadName));
        createAlert(`${currentTranslation.js.added} ${downloadName} ${currentTranslation.js.toZip}`, "zipFileAdd");
        return;
    }
    var link = document.createElement("a");
    link.href = URL.createObjectURL(new File([data.buffer], downloadName));
    link.download = downloadName;
    link.textContent = currentTranslation.js.downloadHere;
    link.setAttribute("ref", linkStore.length);
    link.click();
    if (document.getElementById("saveFiles").checked) { // If the user hasn't disabled the "Keep the link of the video/audio" option, it'll be added to a Select, so that the download can be restored at a later time
        let option = document.createElement("option");
        option.textContent = link.download;
        option.value = linkStore.length;
        option.style = "display: block; text-align: center;";
        option.setAttribute("ref", option.value);
        document.getElementById("redownloadVideos").append(option);
        linkStore.push(link);
    } else URL.revokeObjectURL(link.href);
}
let linkStore = []; // The array that will contain the links to download the converted files
document.getElementById("redownloadVideos").addEventListener("input", () => { // When the user changes the "Conversion download" select option, a new link will be appended to download the selected content
    document.getElementById("linkContainer").innerHTML = "";
    document.getElementById("linkContainer").append(linkStore[parseInt(document.getElementById("redownloadVideos").value)]);
    document.getElementById("memDelete").style.display = "block";
});
document.getElementById("memDelete").addEventListener("click", () => { // Delete the link and the option for the "Conversion download" select
    URL.revokeObjectURL(linkStore[parseInt(document.getElementById("redownloadVideos").value)].href);
    linkStore[parseInt(document.getElementById("redownloadVideos").value)] = undefined;
    document.querySelector(`[ref='${parseInt(document.getElementById("redownloadVideos").value)}']`).remove();
    document.getElementById("redownloadVideos").value = -1;
    document.getElementById("memDelete").style.display = "none;"
})
function loadFile(file) { // Add additional informations about the file
    tempOptions.ffmpegBuffer.push(file);
    tempOptions.ffmpegName.push(file.name);
}
let isAudBitrateShown = true;
function safeCharacters(input) { // Replaces characters that aren't permittend on Windows with characters that look similar to them
    return input.replaceAll("<", "‹").replaceAll(">", "›").replaceAll(":", "∶").replaceAll("\"", "″").replaceAll("/", "∕").replaceAll("\\", "∖").replaceAll("|", "¦").replaceAll("?", "¿").replaceAll("*", "");
}
for (let item of document.querySelectorAll("[data-audioval]")) item.addEventListener("click", () => {
    switch (item.getAttribute("data-audioval")) {
        case "libopus": // libopus doesn't support the bitrate slider, so that option must be made invisible, and instead the textbox will be shown.
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
        case "no": // For lossless items, no bitrate content should be shown
            isAudBitrateShown = false;
            generalByeAnimation(document.getElementById("audioBitrateSettings"));
            break;
        default: // Show both bitrate slider and custom bitrate checkbox
            document.getElementById("sliderAudio").disabled = false;
            if (!isAudBitrateShown) { generalHelloAnimation(document.getElementById("audioBitrateSettings"), true); isAudBitrateShown = true };
            break;
    }
    if (item.getAttribute("data-extension") === "ogg") generalByeAnimation(document.getElementById("albumArtContainer")); else generalHelloAnimation(document.getElementById("albumArtContainer"), true); // There is no support to OGG album art, so it won't be shown if the output file is a OGG.
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
for (let item of document.querySelectorAll("[data-select=bitrate]")) item.addEventListener("change", () => { // Triggerend after the user changes the slider that regulates the bitrate (video and/or audio)
    if (item.value == "0") { // The user wants to choose quality with a slider
        document.getElementById(`${item.getAttribute("data-child")}Quantization`).style.display = "flex";
        document.getElementById(`${item.getAttribute("data-child")}Manual`).style.display = "none";
    } else { // The user wants to choose quality with a textbox
        document.getElementById(`${item.getAttribute("data-child")}Quantization`).style.display = "none";
        document.getElementById(`${item.getAttribute("data-child")}Manual`).style.display = "flex";
    }
    if (item.getAttribute("data-child") === "aud") conversionOptions.audioOptions.bitrateType = item.value; else conversionOptions.videoOptions.bitrateType = item.value; // Set the bitrate value
})
for (let item of document.querySelectorAll("[data-update=audBitLength]")) item.addEventListener("input", () => { conversionOptions.audioOptions.bitrateLength = item.value });
for (let item of document.querySelectorAll("[data-update=vidBitLength]")) item.addEventListener("input", () => { conversionOptions.videoOptions.bitrateLength = item.value });
document.getElementById("fpsInput").addEventListener("input", () => { // Update the FPS of the output video
    conversionOptions.videoOptions.fps = document.getElementById("fpsInput").value;
    document.getElementById("fpsTarget").min = conversionOptions.videoOptions.fps / 2;
})
function optionGet() { // Function that return information used only for a specific conversion operation
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
let tempOptions = optionGet(); // tempOptions will be refreshed at each operation
function getFilter(filtersMap) { // Function that manages adding filters via the GUI
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
    if (document.getElementById("vidOutput").checked || document.querySelector(".sectionSelect").getAttribute("section") === "imgenc") { // Start by elaborating video settings. Since ffmpeg filters are the same for video and images, they'll be used also if the user wants to convert an image.
        if (document.querySelector(".sectionSelect").getAttribute("section") !== "imgenc") { // If the output isn't an image, handle the arguments that can be applied only to videos (ex: bitrate & fps)
            tempOptions.ffmpegArray.push("-vcodec", conversionOptions.videoOptions.codec); // On videos, the encoder will always be added.
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
            if (document.querySelector(".imgSelect").getAttribute("data-imgval") !== "no") tempOptions.ffmpegArray.push("-vcodec", document.querySelector(".imgSelect").getAttribute("data-imgval")); // Add codec only if necessary, otherwise use the standard one
        }
        function lookValue(id) { if (id.value === "" || parseInt(id.value) === 0) return false; return true; }
        if (document.getElementById("checkOrientation").checked && lookValue(document.getElementById("inputWidth")) && lookValue(document.getElementById("inputHeight"))) tempOptions.ffmpegArray.push("-aspect", `${document.getElementById("inputWidth").value}/${document.getElementById("inputHeight").value}`); // Change aspect ratio if the user has selected a custom one
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
        if (conversionOptions.output.orientation !== -1) videoFilters += `,rotate=PI*${conversionOptions.output.orientation}:oh=iw:ow=ih`; // Setup orientation filter
        if (videoFilters.length > 0) { // If there are any video filters, add them to the ffmpeg conversion arguments
            videoFilters = videoFilters.substring(1);
            tempOptions.ffmpegArray.push("-filter:v", videoFilters);
        }
        if (document.getElementById("checkPixelSpace").checked && document.getElementById("pixelSpace").value !== "") tempOptions.ffmpegArray.push("-pix_fmt", document.getElementById("pixelSpace").value) // Change pixel space
    } else if (document.querySelector(".sectionSelect").getAttribute("section") !== "imgenc" && !document.getElementById("albumArtCheck").checked || conversionOptions.audioOptions.codec === "libfdk_aac" || conversionOptions.audioOptions.codec === "alac" || conversionOptions.audioOptions.codec === "aac" || conversionOptions.output.audExtension === "ogg") tempOptions.ffmpegArray.push("-vn"); // If it's not an image AND if the user doesn't want to keep their album art OR is an .ogg/.m4a audio file, delete the video track, so that ffmpeg can convert it
    if (document.getElementById("audOutput").checked && document.querySelector(".sectionSelect").getAttribute("section") !== "imgenc") { // If it's not an image, and the user wants to keep audio, elaborate the audio track options
        if (conversionOptions.audioOptions.codec !== "no") tempOptions.ffmpegArray.push("-acodec", conversionOptions.audioOptions.codec); // If it's necessary, expicitly add the audio encoder
        switch (parseInt(conversionOptions.audioOptions.bitrateType)) { // Add the audio bitrate: case 0 = quality with a slider; case 1 = quality from the user textbox input
            case 0:
                tempOptions.ffmpegArray.push("-qscale:a", conversionOptions.audioOptions.bitrateLength);
                break;
            default:
                tempOptions.ffmpegArray.push("-b:a", conversionOptions.audioOptions.bitrateLength);
                break;
        }
        if (conversionOptions.audioOptions.channels !== -1) tempOptions.ffmpegArray.push("-ac", conversionOptions.audioOptions.channels); // Change output channels
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
        if (audioFilters.length > 0) { // If there are any filters, add them to the ffmpegm arguments
            audioFilters = audioFilters.substring(1);
            tempOptions.ffmpegArray.push("-filter:a", audioFilters);

        }
    }
    addSimpleCut(); // Check if the user wants to trim to only a specific part of the video
    if (conversionOptions.output.name === "output") conversionOptions.output.name = safeCharacters(tempOptions.ffmpegName[0].substring(0, tempOptions.ffmpegArray[0].lastIndexOf("."))); // If no output name is specified, it'll be extracted from the first file
    if (conversionOptions.videoOptions.codec === "copy" && document.getElementById("vidOutput").checked) tempOptions.fileExtension = tempOptions.ffmpegName[0].substring(tempOptions.ffmpegName[0].lastIndexOf(".") + 1); else if (conversionOptions.output.vidExtension !== null && document.getElementById("vidOutput").checked || conversionOptions.output.vidExtension !== null && document.querySelector(".sectionSelect").getAttribute("section") === "imgenc") tempOptions.fileExtension = conversionOptions.output.vidExtension; else if (conversionOptions.audioOptions.codec === "copy") tempOptions.fileExtension = tempOptions.ffmpegName[0].substring(tempOptions.ffmpegName[0].lastIndexOf(".") + 1); else tempOptions.fileExtension = conversionOptions.output.audExtension; // If there's a video track and the user wants to have it, make the video extension the final file extension. Otherwise, use the audio extension.
    tempOptions.ffmpegArray.push(`a${conversionOptions.output.name}.${tempOptions.fileExtension}`); // Temp output file
}
function addSimpleCut() { // Trim content  from a start time to an end time
    if (document.getElementById("cutVideoSelect").value === "1") {
        if (document.getElementById("startCut").value !== "") tempOptions.ffmpegArray.push("-ss", document.getElementById("startCut").value);
        if (document.getElementById("endCut").value !== "") tempOptions.ffmpegArray.push("-to", document.getElementById("endCut").value);
    }
}
const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg = createFFmpeg({ log: false, corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js' }); // Currently ffmpeg.wasm will remain on version 0.11.0 until significant performance improvements will be made
let progressMove = true;
let consoleText = "";
ffmpeg.setLogger(({ type, message }) => { // Set an event every time there's an update from ffmpeg.wasm: add the message to the progress div
    consoleText += `<br>[${type}] ${message}`;
    if (`[${type}] ${message}`.startsWith("[fferr] OOM")) setTimeout(() => {
        alert(currentTranslation.js.oom);
        document.getElementById("trackStart").value = conversionOptions.output.dividerProgression - 1;
    }, 400);
    if (consoleText.length > parseInt(document.getElementById("maxCharacters").value)) consoleText = consoleText.substring(consoleText.length - Math.floor(parseInt(document.getElementById("maxCharacters").value) * 9 / 10));
    if (progressMove) {
        document.getElementById("console").innerHTML = consoleText;
        progressMove = false;
        document.getElementById("console").parentElement.scrollTo({ top: document.getElementById("console").parentElement.scrollHeight, behavior: 'smooth' });
        setTimeout(() => { progressMove = true; document.getElementById("console").innerHTML = consoleText; document.getElementById("console").parentElement.scrollTo({ top: document.getElementById("console").parentElement.scrollHeight, behavior: 'smooth' }); }, 600);
    }
});
ffmpeg.setProgress(({ ratio }) => { // Update the progress bar
    document.getElementById("progress").value = Math.floor(ratio * 100);
});
function checkShow(a, b, c) { // Manage show/hide divs when a checkbox is checked or unchecked
    // a) Checkbox to which an "input" event will be added
    // b): A comma-separated values of the items to show/hide
    // c) If the checkbox value must be reversed (hidden if selected; shown if not selected)
    document.getElementById(a).addEventListener("input", () => {
        let check = null;
        if (c) check = !document.getElementById(a).checked; else check = document.getElementById(a).checked;
        for (let item of b.split(",")) {
            if (check) { // Show items
                document.getElementById(item).style.display = "";
                if (document.getElementById(item).getAttribute("block") === "a") document.getElementById(item).style.display = "block";
                generalHelloAnimation(document.getElementById(item));
                setTimeout(() => { document.getElementById(item).style.maxHeight = "9999px" }, 50);
            } else { // Hide items
                document.getElementById(item).style.maxHeight = "0px";
                document.getElementById(item).classList.remove("animate__backInUp");
                document.getElementById(item).classList.add("animate__animated", "animate__backOutDown");
                setTimeout(() => { if (!c && document.getElementById(a).checked || c && !document.getElementById(a).checked) document.getElementById(item).classList.remove("animate__animated", "animate__backOutDown"); document.getElementById(item).style.display = "none" }, 1050);
            }
        }
    })
};
document.querySelector("[section=reenc]").addEventListener("click", () => { setTimeout(() => { document.getElementById("onlyVidSettings").style.display = "block"; }, 1100) })
document.getElementById("vidOutput").addEventListener("input", () => { // If video output checkbox is checked, put the audio card at the right, otherwise put the audio card at the left
    if (document.getElementById("vidOutput").checked) {
        document.getElementById("audioOpt").classList.remove("leftCard");
        document.getElementById("audioOpt").classList.add("rightCard");
    } else {
        document.getElementById("audioOpt").classList.remove("rightCard");
        document.getElementById("audioOpt").classList.add("leftCard");

    }
});
let showItem = [["vidOutput", "audOutput", "checkFps", "checkOrientation", "checkPixelSpace", "smartMetadata"], ["videoElementsDisplay,videoOpt", "audioElementsDisplay,audioOpt", "fpsDiv", "orientationDiv", "pixelSpaceDiv", "smartTrackId"], [false, false, true, false, false, false]] // Array with values: [Checkbox ID, a comma-separated array of divs to show/hide, a boolean that indicates if the items must be hidden if the checkbox is ticked]
for (let i = 0; i < showItem[0].length; i++) checkShow(showItem[0][i], showItem[1][i], showItem[2][i])
let fetchImg = null; // fetchImg will be a JSON file contianing all of the SVG assets
for (let item of document.querySelectorAll("[data-fetch]")) fetchData(item, item.getAttribute("data-fetch")); // Fetch all the images from the DOM to add a source
fetch("./assets/mergedAssets.json").then((res) => { res.json().then((json) => { fetchImg = json }).catch((ex) => { console.warn(ex) }) }).catch((ex) => { console.warn(ex) }); // Fetch the JSON file containing all the SVG files
function fetchData(element, link, customImg) {
    if (fetchImg === null) { // Fetch still hasn't finished, so retry after 150 seconds
        setTimeout(() => { fetchData(element, link, customImg) }, 150);
        return;
    }
    element.src = URL.createObjectURL(new Blob([fetchImg[link].replaceAll("#212121", customImg ?? getComputedStyle(document.body).getPropertyValue("--select"))], { type: "image/svg+xml" }));
}
let dialogShow = [[document.getElementById("showFilter"), document.getElementById("hideFilter"), document.getElementById("hideFilter2"), document.getElementById("showFilter2"), document.getElementById("showSettings"), document.getElementById("hideSettings")], [document.getElementById("audioFilterDialog"), document.getElementById("audioFilterDialog"), document.getElementById("videoFilterDialog"), document.getElementById("videoFilterDialog"), document.getElementById("settings"), document.getElementById("settings")], ["block", "none", "none", "block", "block", "none"]] // An array of items containing: [An array of items that will trigger an action when clicked, the dialog that will change visibility, the type of visibility]
for (let i = 0; i < dialogShow[0].length; i++) dialogShow[0][i].addEventListener("click", () => {
    if (dialogShow[2][i] !== "none") { // The dialog must be shown, so a "hello" animation will be shown
        dialogShow[1][i].classList.remove("animate__backOutDown");
        dialogShow[1][i].classList.add("animate__animated", "animate__backInDown");
        dialogShow[1][i].style.display = dialogShow[2][i];
    } else { // The dialog must be hidden, so a "goodbye" animation will be shown
        dialogShow[1][i].classList.remove("animate__backInDown");
        dialogShow[1][i].classList.add("animate__animated", "animate__backOutDown");
        setTimeout(() => { if (!dialogShow[1][i].classList.contains("animate__backInDown")) dialogShow[1][i].style.display = dialogShow[2][i] }, 1050);
    }
});
function updateSelectInformation(id, changeOption) { // Function that permits to change conversion options fetching value from a textbox
    // id) the ID of the element that will trigger the event
    // changeOption) an array containing the two keys that refer to the object to change
    let optionFetch = changeOption.split(".");
    document.getElementById(id).addEventListener("input", () => { conversionOptions[optionFetch[0]][optionFetch[1]] = parseFloat(document.getElementById(id).value) })
}
let selectInfo = [["audioChannelSelect", "orientationChoose"], ["audioOptions.channels", "output.orientation"]];
for (let i = 0; i < selectInfo[0].length; i++) updateSelectInformation(selectInfo[0][i], selectInfo[1][i]);
let pixelFormatChosen = false; // This will become true if the user decides voluntarily to change the pixel format space
document.getElementById("curveSelect").addEventListener("input", () => { // If the user still hasn't decided a color space and it's changing curve options, the color space will automatically be edited so that it can be read by most players
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
document.getElementById("checkPixelSpace").addEventListener("input", () => { pixelFormatChosen = true }) // If the user interacts with the pixel space select, respect their decision and keep the selected pixel space
window.scrollTo({ top: 0, behavior: "smooth" });
function readFfmpegScript() { // Function that reads a custom ffmpeg script
    for (let part of document.getElementById("ffmpegScript").value.split(" ")) tempOptions.ffmpegArray.push(part.replaceAll("$space", " ")); // Use the $space to add a space in the same argument
    // Delete and then add again the output file name, so that, if the user wants to trim the video, it can be added.
    let outputName = tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1];
    tempOptions.ffmpegArray.pop();
    addSimpleCut();
    tempOptions.ffmpegArray.push(outputName);
}
function sectionRefer() { // Returns an object that's used to choose which divs should be visible for each website section
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
function generalByeAnimation(item) { // Add an animation to remove an item 
    item.classList.remove("animate__backInUp");
    item.classList.add("animate__animated", "animate__backOutDown");
    setTimeout(() => { item.style.display = "none"; item.classList.remove("animate__animated", "animate__backOutDown") }, 1050);
}
function generalHelloAnimation(item, setDisplay) { // Ad an animation to add an item
    if (setDisplay) item.style.display = "block";
    item.classList.remove("animate__backOutDown");
    item.classList.add("animate__animated", "animate__backInUp");
    setTimeout(() => { item.classList.remove("animate__animated", "animate__backInUp") }, 1050);
}
for (let items of document.querySelectorAll(["[section]"])) items.addEventListener("click", () => { // Set up an event that manages showing or hiding parts of the website when the user changes section
    document.querySelector(".sectionSelect").classList.remove("sectionSelect");
    items.classList.add("sectionSelect"); // Add to the new selected item the class
    let refer = sectionRefer();
    for (let item in refer) {
        if (item === items.getAttribute("section")) setTimeout(() => { for (let i = 0; i < refer[item].id.length; i++) if (refer[item].visible[i]) generalHelloAnimation(refer[item].id[i], true); else generalByeAnimation(refer[item].id[i]); }, 1045); else for (let i = 0; i < refer[item].id.length; i++) generalByeAnimation(refer[item].id[i]); // If the object key is the same as the section the user has clicked and the item must be visible in that section, make it visible. Otherwise, hide it.
    }
    document.getElementById("multiVideoHandle").value = refer[Object.keys(refer)[Object.keys(refer).indexOf(items.getAttribute("section"))]].value; // Change the value of the "Select how multiple files should be handled" select to the default for that section
    if (parseInt(document.getElementById("multiVideoHandle").value) === -1) document.getElementById("multiVideoHandle").disabled = true; else document.getElementById("multiVideoHandle").disabled = false; // If the new value of the select is -1, it must be disabled since it'll be handled in a different way.
    if (items.getAttribute("section") === "imgenc") setTimeout(() => { generalHelloAnimation(document.getElementById("videoOpt"), true); }, 1100); // If the section selected is the image one, show the video output options, since ffmpeg video options can be used also for images 
    if (items.getAttribute("section") === "imgenc" || items.getAttribute("section") === "merge" || items.getAttribute("section") === "extractalbum") generalByeAnimation(document.getElementById("smartCut")); else setTimeout(() => { generalHelloAnimation(document.getElementById("smartCut"), true) }, 1100); // Options where the "smart cut" (cut for each timestamp) doesn't work / doesn't make sense should have it hidden
    if (items.getAttribute("section") === "imgenc") document.getElementById("imgChooser1").append(document.getElementById("imgElementsDisplay")); else if (items.getAttribute("section") === "extractalbum") document.getElementById("imgChooser2").append(document.getElementById("imgElementsDisplay")); // The image selection might be used two times: the first time in the "Image convert" option, so that the user can change the output of the converted image, and the second time in the "Extract album art" section, where the user can extract the album art of an audio file and choose the output file format
});
document.querySelector("[data-fetch=arrowright]").addEventListener("click", () => { scrollItem() }) // Scroll the last div (the PWA/Progress tab) to the right, so where the conversion progress div is
document.querySelector("[data-fetch=arrowleft]").addEventListener("click", () => { scrollItem(true) }) // Scroll the last div (the PWA/Progress tab) to the left, so where the PWA promotion is
let zip = new JSZip(); // Create new .zip file so that, if the user enables it from settings, it can be used
document.getElementById("zipSave").addEventListener("input", () => { // Save conversion as zip file option
    if (document.getElementById("zipSave").checked) { // Show the buttons to save a zip file, and not the select to download each file
        generalByeAnimation(document.getElementById("redownloadPart"));
        setTimeout(() => { generalHelloAnimation(document.getElementById("zipPart"), true) }, 1040);
    } else { // Opposite
        generalByeAnimation(document.getElementById("zipPart"));
        setTimeout(() => { generalHelloAnimation(document.getElementById("redownloadPart"), true) }, 1040);
    }
});
let previousLink = undefined;
document.getElementById("downloadZip").addEventListener("click", () => { // Generate a blob and download it
    document.getElementById("zipSpinner").style.display = "flex";
    zip.generateAsync({ type: "blob" }).then(function (content) {
        if (previousLink !== undefined) URL.revokeObjectURL(previousLink);
        // It's similar to the downlaodFiles part, but it doesn't save it in the selection and it has a different text
        let specialLink = document.createElement("a"); // Create a link to download it since it might be blocked on some mobile browsers
        specialLink.textContent = currentTranslation.js.troubleDownload;
        specialLink.href = URL.createObjectURL(new Blob([content]));
        specialLink.style = "text-align: center; display: block;";
        specialLink.download = "ffmpeg-web.zip";
        specialLink.click();
        document.getElementById("troubleContainer").innerHTML = "";
        document.getElementById("troubleContainer").appendChild(specialLink);
    document.getElementById("zipSpinner").style.display = "none";
    });
});
document.getElementById("cleanZip").addEventListener("click", () => { // Create a new empty zip
    zip = new JSZip();
    URL.revokeObjectURL(document.querySelector("[download='ffmpeg-web.zip']").href);
})
function addHoverEvents(item) { // Add a brightness effect when the user hovers on an item
    item.classList.add("isHovered");
}
for (let item of document.querySelectorAll("input,.button,select,.optionBtn,.slider,img,.circular")) addHoverEvents(item); // A list of elements from the DOM that should have the hover effect
if (localStorage.getItem("ffmpegWeb-advanced") === "a") document.getElementById("advancedFormat").checked = true; // Show advanced formats
if (!document.getElementById("advancedFormat").checked) for (let item of document.querySelectorAll("[advanced]")) item.style.display = "none"; // If the user doesn't want to see "advanced" encoders (that basically no one uses nowdays), hide them
document.getElementById("advancedFormat").addEventListener("input", () => { // Show or hide advanced codecs setting
    if (!document.getElementById("advancedFormat").checked) {
        for (let item of document.querySelectorAll("[advanced]")) item.style.display = "none";
        localStorage.setItem("ffmpegWeb-advanced", "b");
    } else {
        for (let item of document.querySelectorAll("[advanced]")) item.style.display = "flex";
        localStorage.setItem("ffmpegWeb-advanced", "a");
    }
});
function checkPosition(force) { // Logic that handles a great part of the card resizing between left and right cards
    if (force || document.getElementById("vidOutput").checked && document.getElementById("audOutput").checked || !document.getElementById("vidOutput").checked && !document.getElementById("audOutput").checked) { // If it's forced, or if both/none the audio or the video tab are visible, show the last card (the progress/PWA one) with full width
        document.getElementById("scrollableItem").classList.add("leftCard", "rightCard", "width100");
    } else { // Otherwise, add it at the right of the Audio/Video tab
        document.getElementById("scrollableItem").classList.add("rightCard");
        document.getElementById("scrollableItem").classList.remove("width100", "leftCard");
    }
    if (window.innerWidth < 800) document.getElementById("scrollableItem").classList.remove("limitWidth"); // If must be a card per row
    if (!document.getElementById("vidOutput").checked && document.getElementById("audOutput").checked) { // If only the audio card is visible, adjust its left margin, since it would be positioned at the left when usually it's at the right 
        document.getElementById("audioOpt").classList.remove("rightCard");
        document.getElementById("audioOpt").classList.add("leftCard");
    } else {
        document.getElementById("audioOpt").classList.add("rightCard");
        document.getElementById("audioOpt").classList.remove("leftCard");
    }
    generalHelloAnimation(document.getElementById("scrollableItem"));
}
for (let item of ["[section=metadata]", "[section=imgenc]"]) document.querySelector(item).addEventListener("click", () => { // These two sections add only a card, so the last card (the progress/PWA one) will be always shown at the right
    setTimeout(() => {
        document.getElementById("scrollableItem").classList.add("rightCard");
        document.getElementById("scrollableItem").classList.remove("width100", "leftCard");
        if (window.innerWidth < 800) document.getElementById("scrollableItem").classList.remove("limitWidth"); // Just like before, if there must be only a card per row, delete the limitWidth class
        generalHelloAnimation(document.getElementById("scrollableItem"));
    }, 1100)
});
for (let item of ["[section=merge]", "[section=cmd]", "[section=extractalbum]"]) document.querySelector(item).addEventListener("click", () => { // These elements don't add any card, so the last card (the progress/PWA one) will be shown at full width
    setTimeout(() => {
        document.getElementById("scrollableItem").classList.add("leftCard", "rightCard", "width100");
        if (window.innerWidth < 800) document.getElementById("scrollableItem").classList.remove("limitWidth");  // Just like before, if there must be only a card per row, delete the limitWidth class
        generalHelloAnimation(document.getElementById("scrollableItem"));
    }, 1100)
});
document.querySelector("[section=reenc]").addEventListener("click", () => { checkPosition() }); // The re-enc card is the only one that might vary the position of the last card, so it has its own function above
document.querySelector("[section=imgenc]").addEventListener("click", () => {
    setTimeout(() => { document.getElementById("videoOpt").style.maxHeight = "" }, 150);
})
for (let switchItems of ["vidOutput", "audOutput"]) document.getElementById(switchItems).addEventListener("input", () => { checkPosition() }); // "vidOutput" and "audOutput" are the two checkboxes that make the video and audio dialog appear, so the event that put them at the left or right of the screen will be called.
let defaultThemes = { // An array of the default themes of ffmpeg-web
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
let customTheme = { themes: [] }; // Array of custom themes, fetched from LocalStorage
let storageItem = localStorage.getItem("ffmpegWeb-customThemes");
if (storageItem !== null && storageItem.indexOf("themes\":") !== -1) customTheme = JSON.parse(storageItem); // If storageIte contains the themes key, put it as the custom theme object
// I didn't manage to make it work with Object.assign and I'm lazy to debug it
let finalObj = { themes: [] }; // Merge both default and custom themes into an object (finalObj) so that both categories will be appended in the theme settings
for (let i = 0; i < defaultThemes.themes.length; i++) finalObj.themes.push(defaultThemes.themes[i]);
for (let i = 0; i < customTheme.themes.length; i++) finalObj.themes.push(customTheme.themes[i]);
for (let themeOption of finalObj.themes) addTheme(themeOption);
function createSubOption(content) { // Creates a label that contains information about the option (ex: the theme name)
    let nameDiv = document.createElement("div");
    nameDiv.style = "display: flex; float: left; height: 100%";
    let textName = document.createElement("l");
    textName.textContent = content;
    textName.classList.add("textName");
    nameDiv.append(textName);
    return nameDiv;
}
function createBtn(image, card, select) { // Creates a circular button in the settings (ex: apply theme)
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

function addTheme(themeOption) { // Creates a div for managing themes
    let containerDiv = document.createElement("div");
    containerDiv.classList.add("colorSelect");
    let nameDiv = createSubOption(themeOption.name) // Show the theme name at the left
    let exportBtn = createBtn("export", themeOption.color.card, themeOption.color.select); // Export the theme as a JSON file
    exportBtn.addEventListener("click", () => {
        let link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([JSON.stringify(themeOption)]));
        link.download = `${themeOption.name}-export.json`;
        link.click();
    });
    let applyBtn = createBtn("color", themeOption.color.card, themeOption.color.select); // Apply the theme to the website
    applyBtn.addEventListener("click", () => {
        for (let values in themeOption.color) document.documentElement.style.setProperty(`--${values}`, themeOption.color[values]); // Replace default CSS variables
        for (let items of document.querySelectorAll("[data-fetch]")) fetchData(items, items.getAttribute("data-fetch")); // Fetch new icons
        localStorage.setItem("ffmpegWeb-currentTheme", themeOption.custom); // Set the current theme identifier to the localStorage so that it can be restored when the page is refreshed
        for (let item of document.querySelectorAll("[data-change]")) item.value = getComputedStyle(document.body).getPropertyValue(`--${item.getAttribute("data-change")}`)
    });
    let exportDiv = document.createElement("div");  // The div that will contain all the new buttons
    if (!themeOption.custom.startsWith("a")) { // If the theme custom identifier starts with "a", it's not a custom one, so the delete button won't be shwon
        let deleteBtn = createBtn("delete", themeOption.color.card, themeOption.color.select); // Add a delete button
        deleteBtn.addEventListener("click", () => {
            for (let i = 0; i < customTheme.themes.length; i++) if (customTheme.themes[i].custom === themeOption.custom) customTheme.themes.splice(i, 1); // Look where the custom theme is, and delete it. Might replace this with array.find in the future
            setTimeout(() => { containerDiv.remove() }, 300); // Wait until the animation has finished to remove it from the DOM
            localStorage.setItem("ffmpegWeb-customThemes", JSON.stringify(customTheme)); // Update the custom themes available
            document.getElementById("themeOptions").style.maxHeight = `${parseInt(document.getElementById("themeOptions").style.maxHeight.replace("px", "")) - 55}px` // Add a height animation before removing the item from the DOM
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
document.querySelector("[data-change=select]").addEventListener("change", () => { for (let items of document.querySelectorAll("[data-fetch]")) fetchData(items, items.getAttribute("data-fetch")); }) // Use "change" to avoid excessive lagging. In this way, when the user tries to create a new theme and changes the "Select" color (that is basically the accent), all the SVGs will be fetched again with the new color.
let secTimeout = false;
document.getElementById("saveTheme").addEventListener("click", () => { // The function that permits to save the custom theme
    // Add a second timeout to avoid spamming and to avoid same custom id.
    if (secTimeout) {
        createAlert(currentTranslation.js.wait, "secondWait");
        return;
    }
    secTimeout = true;
    setTimeout(() => { secTimeout = false }, 1000);
    let name = prompt(currentTranslation.js.chooseName);
    if (name === null) return;
    customTheme.themes.push({ // Add item to the customTheme property
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
    addTheme(customTheme.themes[customTheme.themes.length - 1]); // And add it to the DOM
    localStorage.setItem("ffmpegWeb-currentTheme", customTheme.themes[customTheme.themes.length - 1].custom); // Set the new theme as the current one, so that it'll be kept if the page is refreshed
    localStorage.setItem("ffmpegWeb-customThemes", JSON.stringify(customTheme)); // And save the new theme in the custom theme LocalStorage property
    createAlert(englishTranslations.js.themeCreated, "themeApplied")
});
document.getElementById("importTheme").addEventListener("click", () => { // Function that permits to import a theme
    let quickInput = document.createElement("input"); // Create a file input that will fetch the file
    quickInput.type = "file";
    quickInput.addEventListener("input", () => {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            let getJson = JSON.parse(reader.result);
            let supportedVar = ["text", "background", "card", "row", "input", "select"]
            if (getJson.color !== undefined) {
                for (let colorTheme in getJson.color) if (/^#[0-9A-F]{6}$/i.test(getJson.color[colorTheme]) && supportedVar.indexOf(colorTheme) !== -1) { // If it's a requested property, and if it's a hex color, save it 
                    document.querySelector(`[data-change=${colorTheme}]`).value = getJson.color[colorTheme];
                    document.documentElement.style.setProperty(`--${colorTheme}`, getJson.color[colorTheme]);
                }
                createAlert(currentTranslation.js.themeApplied, "appliedTheme");
            }
        });
        reader.readAsText(quickInput.files[0]);
    })
    quickInput.click();
});
let currentTheme = localStorage.getItem("ffmpegWeb-currentTheme"); // Fetch the default theme
if (currentTheme !== null) { // The user has changed theme at least once, so the selected theme will be applied
    for (let item of finalObj.themes) if (item.custom === currentTheme) {
        for (let values in item.color) document.documentElement.style.setProperty(`--${values}`, item.color[values]);
        for (let items of document.querySelectorAll("[data-fetch]")) fetchData(items, items.getAttribute("data-fetch"));
    }
}
for (let item of document.querySelectorAll("[data-change]")) item.value = getComputedStyle(document.body).getPropertyValue(`--${item.getAttribute("data-change")}`) // Set the new color as the value of the "New theme" input colors
if (localStorage.getItem("ffmpegWeb-alertDuration") === null) localStorage.setItem("ffmpegWeb-alertDuration", "5000");
let oldAlert = undefined;
function createAlert(text, noRepeat, showBottom) { // Create an alert at the top of the page for informations
    if (localStorage.getItem("ffmpegWeb-showAlert") === "b" || localStorage.getItem("ffmpegWeb-ignoredAlert") !== null && localStorage.getItem("ffmpegWeb-ignoredAlert").split(",").indexOf(noRepeat) !== -1) return; // If the user doesn't want to see alerts, or the alert ID is the list of dismissed items, don't show it.
    let firstAlertContainer = document.createElement("div");
    firstAlertContainer.classList.add("totalCenter", "fill", "opacity");
    let alertContainer = document.createElement("div");
    alertContainer.classList.add("alert");
    let textContainer = document.createElement("div");
    textContainer.classList.add("verticalcenter");
    let content = document.createElement("l");
    content.textContent = text;
    content.style.width = "75%";
    // Create the alert img icon
    let img = document.createElement("img");
    img.style = "width: 25px; height: 25px; margin-right: 10px;";
    fetchData(img, "alert");
    // Create the "Don't show this again" button
    let noRepeatIndication = document.createElement("l");
    noRepeatIndication.style = "text-decoration: underline; display: flex; justify-content: flex-end; width: 25%";
    noRepeatIndication.textContent = currentTranslation.js.noAgain;
    noRepeatIndication.addEventListener("click", () => { if (localStorage.getItem("ffmpegWeb-ignoredAlert") === null) localStorage.setItem("ffmpegWeb-ignoredAlert", `${noRepeat},`); else localStorage.setItem("ffmpegWeb-ignoredAlert", `${localStorage.getItem("ffmpegWeb-ignoredAlert")}${noRepeat},`); deleteAlert(firstAlertContainer); });
    textContainer.append(img, content, noRepeatIndication);
    alertContainer.append(textContainer);
    firstAlertContainer.append(alertContainer);
    function appendThis() {
        document.body.append(firstAlertContainer);
        setTimeout(() => { firstAlertContainer.style.opacity = "1", 15 });
    }
    if (oldAlert !== undefined && !showBottom) { // If there's an old alert, delete it before appending the new one. This won't be done for bottom alerts, that are reserved for language changes
        deleteAlert(oldAlert);
        setTimeout(() => { appendThis() }, 300);
    } else appendThis();
    if (!showBottom) oldAlert = firstAlertContainer; else { // Don't save the bottom alert as an old alert, since it's only for language, and instead add a label to go back to English.
        let restoreEnglish = document.createElement("l");
        restoreEnglish.style.textDecoration = "underline";
        restoreEnglish.style.marginLeft = "15px";
        restoreEnglish.style.fontSize = "0.8em";
        restoreEnglish.textContent = "Go back to English";
        restoreEnglish.addEventListener("click", () => { manageTranslations("en"); deleteAlert(firstAlertContainer) })
        addHoverEvents(restoreEnglish);
        content.append(restoreEnglish);
    }
    if (showBottom) alertContainer.style.bottom = "5vh"; else alertContainer.style.top = "5vh";
    appendThis();
    function deleteAlert(alert) {
        alert.style.opacity = "0"; setTimeout(() => { alert.remove(); oldAlert = undefined; }, 400)
    }
    setTimeout(() => deleteAlert(firstAlertContainer), parseInt(localStorage.getItem("ffmpegWeb-alertDuration"))); // Delete the current alert after an amount of ms the user has decided from the settings
    for (let item of [noRepeatIndication, img]) addHoverEvents(item);
}
function loadFfmpeg(skipInfo) {
    return new Promise((resolve) => {
if (!skipInfo) createAlert(currentTranslation.js.ffmpegLoad, "ffmpegLoading"); // Wait until ffmpeg-web loads the ffmpeg.wasm core component.
document.getElementById("btnSelect").classList.add("disabled"); // Disable the "Select file" button until it has loaded
if (!ffmpeg.isLoaded()) ffmpeg.load().then(() => {
    // ffmpeg is loaded, so the "File select" button can now be clicked
    if (!skipInfo) createAlert(currentTranslation.js.successful, "ffmpegSuccessful");
    document.getElementById("btnSelect").classList.remove("disabled");
    resolve();
}).catch((ex) => {
    createAlert(`${englishTranslations.js.error} ${ex}`, "ffmpegFail");
    resolve();
});
})
}
loadFfmpeg();
async function resetFfmpeg() {
    for (let file of tempOptions.deleteFile) try { await ffmpeg.FS('unlink', file); } catch (ex) { console.warn(ex) }; // Delete the files from the ffmpeg file system
    ffmpeg.exit();
    await loadFfmpeg(true);
}
// Set up PWA installation prompt: catch the popup and display it when the user clicks the "Install as PWA" button
let installationPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installationPrompt = event;
});
document.getElementById("pwaInstall").addEventListener("click", () => {
    installationPrompt.prompt();
    installationPrompt.userChoice.then(choice => {
        if (choice.outcome === "accepted") scrollItem(); // Scroll to the progress tab
    });
});
if (window.matchMedia('(display-mode: standalone)').matches) scrollItem(); // The PWA is installed, so scroll to the progress tab
function scrollItem(invert) { // Scroll between the two parts (PWA promotion & progress) of the tab
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
document.getElementById("alertDuration").addEventListener("input", () => { localStorage.setItem("ffmpegWeb-alertDuration", document.getElementById("alertDuration").value) }); // When the user changes the value of the "Alert duration" textbox, it'll be automatically saved in the LocalStorage
document.getElementById("resetBtn").addEventListener("click", () => { localStorage.setItem("ffmpegWeb-ignoredAlert", ""); createAlert(currentTranslation.js.visibleAlerts, "alertVisible") }); // Show again all the ignored values
document.getElementById("alertAsk").addEventListener("input", () => { // The checkbox that permits the user to disable alerts entirely
    if (document.getElementById("alertAsk").checked) { // The user wants to see alerts
        localStorage.setItem("ffmpegWeb-showAlert", "a"); // a = show alerts
        document.getElementById("alertOptions").style.display = "block";
        setTimeout(() => { document.getElementById("alertOptions").style.maxHeight = "9999px"; }, 15); // show custom alert options
    } else {
        localStorage.setItem("ffmpegWeb-showAlert", "b"); // b = delete alerts
        document.getElementById("alertOptions").style.maxHeight = "0px";
        setTimeout(() => { document.getElementById("alertOptions").style.display = "none" }, 350); // hide custom alert options
    }
});
if (localStorage.getItem("ffmpegWeb-showAlert") === "b") { document.getElementById("alertOptions").style.maxHeight = "0px"; document.getElementById("alertOptions").style.display = "none"; document.getElementById("alertAsk").checked = false; } // Checks if the user wants to show alerts, and, if not, hide the settings in the "Alerts" setting tab.
if (localStorage.getItem("ffmpegWeb-alertDuration") !== null) document.getElementById("alertDuration").value = parseInt(localStorage.getItem("ffmpegWeb-alertDuration"));
function getLicense(license, author) { // Get open-soruce licenses
    switch (license) {
        case "hippocratic":
            return `${author} (“Licensor”)<br><br>Hippocratic License Version Number: 2.1.<br><br>Purpose. The purpose of this License is for the Licensor named above to permit the Licensee (as defined below) broad permission, if consistent with Human Rights Laws and Human Rights Principles (as each is defined below), to use and work with the Software (as defined below) within the full scope of Licensor’s copyright and patent rights, if any, in the Software, while ensuring attribution and protecting the Licensor from liability.<br><br>Permission and Conditions. The Licensor grants permission by this license (“License”), free of charge, to the extent of Licensor’s rights under applicable copyright and patent law, to any person or entity (the “Licensee”) obtaining a copy of this software and associated documentation files (the “Software”), to do everything with the Software that would otherwise infringe (i) the Licensor’s copyright in the Software or (ii) any patent claims to the Software that the Licensor can license or becomes able to license, subject to all of the following terms and conditions:<br><br>* Acceptance. This License is automatically offered to every person and entity subject to its terms and conditions. Licensee accepts this License and agrees to its terms and conditions by taking any action with the Software that, absent this License, would infringe any intellectual property right held by Licensor.<br><br>* Notice. Licensee must ensure that everyone who gets a copy of any part of this Software from Licensee, with or without changes, also receives the License and the above copyright notice (and if included by the Licensor, patent, trademark and attribution notice). Licensee must cause any modified versions of the Software to carry prominent notices stating that Licensee changed the Software. For clarity, although Licensee is free to create modifications of the Software and distribute only the modified portion created by Licensee with additional or different terms, the portion of the Software not modified must be distributed pursuant to this License. If anyone notifies Licensee in writing that Licensee has not complied with this Notice section, Licensee can keep this License by taking all practical steps to comply within 30 days after the notice. If Licensee does not do so, Licensee’s License (and all rights licensed hereunder) shall end immediately.<br><br>* Compliance with Human Rights Principles and Human Rights Laws.<br><br>    1. Human Rights Principles.<br><br>        (a) Licensee is advised to consult the articles of the United Nations Universal Declaration of Human Rights and the United Nations Global Compact that define recognized principles of international human rights (the “Human Rights Principles”). Licensee shall use the Software in a manner consistent with Human Rights Principles.<br><br>        (b) Unless the Licensor and Licensee agree otherwise, any dispute, controversy, or claim arising out of or relating to (i) Section 1(a) regarding Human Rights Principles, including the breach of Section 1(a), termination of this License for breach of the Human Rights Principles, or invalidity of Section 1(a) or (ii) a determination of whether any Law is consistent or in conflict with Human Rights Principles pursuant to Section 2, below, shall be settled by arbitration in accordance with the Hague Rules on Business and Human Rights Arbitration (the “Rules”); provided, however, that Licensee may elect not to participate in such arbitration, in which event this License (and all rights licensed hereunder) shall end immediately. The number of arbitrators shall be one unless the Rules require otherwise.<br><br>        Unless both the Licensor and Licensee agree to the contrary: (1) All documents and information concerning the arbitration shall be public and may be disclosed by any party; (2) The repository referred to under Article 43 of the Rules shall make available to the public in a timely manner all documents concerning the arbitration which are communicated to it, including all submissions of the parties, all evidence admitted into the record of the proceedings, all transcripts or other recordings of hearings and all orders, decisions and awards of the arbitral tribunal, subject only to the arbitral tribunal's powers to take such measures as may be necessary to safeguard the integrity of the arbitral process pursuant to Articles 18, 33, 41 and 42 of the Rules; and (3) Article 26(6) of the Rules shall not apply.<br><br>    2. Human Rights Laws. The Software shall not be used by any person or entity for any systems, activities, or other uses that violate any Human Rights Laws.  “Human Rights Laws” means any applicable laws, regulations, or rules (collectively, “Laws”) that protect human, civil, labor, privacy, political, environmental, security, economic, due process, or similar rights; provided, however, that such Laws are consistent and not in conflict with Human Rights Principles (a dispute over the consistency or a conflict between Laws and Human Rights Principles shall be determined by arbitration as stated above).  Where the Human Rights Laws of more than one jurisdiction are applicable or in conflict with respect to the use of the Software, the Human Rights Laws that are most protective of the individuals or groups harmed shall apply.<br><br>    3. Indemnity. Licensee shall hold harmless and indemnify Licensor (and any other contributor) against all losses, damages, liabilities, deficiencies, claims, actions, judgments, settlements, interest, awards, penalties, fines, costs, or expenses of whatever kind, including Licensor’s reasonable attorneys’ fees, arising out of or relating to Licensee’s use of the Software in violation of Human Rights Laws or Human Rights Principles.<br><br>* Failure to Comply. Any failure of Licensee to act according to the terms and conditions of this License is both a breach of the License and an infringement of the intellectual property rights of the Licensor (subject to exceptions under Laws, e.g., fair use). In the event of a breach or infringement, the terms and conditions of this License may be enforced by Licensor under the Laws of any jurisdiction to which Licensee is subject. Licensee also agrees that the Licensor may enforce the terms and conditions of this License against Licensee through specific performance (or similar remedy under Laws) to the extent permitted by Laws. For clarity, except in the event of a breach of this License, infringement, or as otherwise stated in this License, Licensor may not terminate this License with Licensee.<br><br>* Enforceability and Interpretation. If any term or provision of this License is determined to be invalid, illegal, or unenforceable by a court of competent jurisdiction, then such invalidity, illegality, or unenforceability shall not affect any other term or provision of this License or invalidate or render unenforceable such term or provision in any other jurisdiction; provided, however, subject to a court modification pursuant to the immediately following sentence, if any term or provision of this License pertaining to Human Rights Laws or Human Rights Principles is deemed invalid, illegal, or unenforceable against Licensee by a court of competent jurisdiction, all rights in the Software granted to Licensee shall be deemed null and void as between Licensor and Licensee. Upon a determination that any term or provision is invalid, illegal, or unenforceable, to the extent permitted by Laws, the court may modify this License to affect the original purpose that the Software be used in compliance with Human Rights Principles and Human Rights Laws as closely as possible. The language in this License shall be interpreted as to its fair meaning and not strictly for or against any party.<br><br> * Disclaimer. TO THE FULL EXTENT ALLOWED BY LAW, THIS SOFTWARE COMES “AS IS,” WITHOUT ANY WARRANTY, EXPRESS OR IMPLIED, AND LICENSOR AND ANY OTHER CONTRIBUTOR SHALL NOT BE LIABLE TO ANYONE FOR ANY DAMAGES OR OTHER LIABILITY ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THIS LICENSE, UNDER ANY KIND OF LEGAL CLAIM.<br><br>This Hippocratic License is an Ethical Source license (https://ethicalsource.dev) and is offered for use by licensors and licensees at their own risk, on an “AS IS” basis, and with no warranties express or implied, to the maximum extent permitted by Laws.`;
        default:
            return `MIT License<br><br>Copyright (c) ${author}<br><br>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:<br><br>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. <br><br>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
    }
}
for (let item of document.querySelectorAll("[data-license]")) item.addEventListener("click", () => { // For each license label, shoe its license below, fetching a) the license type and b) the author
    document.getElementById("selectedLicense").innerHTML = getLicense(item.getAttribute("data-license"), item.getAttribute("data-author"));
    if (document.querySelector(".licenseSelect") !== null) document.querySelector(".licenseSelect").classList.remove("licenseSelect");
    item.classList.add("licenseSelect");
});
let suggestedMetadata = [["album", "composer", "genre", "copyright", "title", "language", "artist", "album_artist", "performer", "disc", "publisher", "track", "lyrics", "compilation", "date", "creation_time", "album-sort", "artist-sort", "title-sort"], ["Album name", "Composers", "Genre", "Copyright", "Title", "Language", "Artists", "Album Artists", "Performers", "Disc", "Publishers", "Track number", "Lyrics", "Compilation", "Published date", "Creation time", "Album sort name", "Artist sort name", "Title sort name"]] // An array with two arrays: [[ffmpeg medatata ids], [the name to show in the metadata section]]
for (let i = 0; i < suggestedMetadata[0].length; i++) { // Create a new metadata selector
    let metadataAppend = document.createElement("div");
    metadataAppend.classList.add("optionBtn", "minWidth");
    metadataAppend.setAttribute("data-key", suggestedMetadata[0][i]); // Set the ffmpeg metadata id
    let label = document.createElement("l");
    label.classList.add("totalCenter");
    label.textContent = suggestedMetadata[1][i];
    metadataAppend.addEventListener("click", () => {
        if (document.querySelector(".metadataSelect") !== null) document.querySelector(".metadataSelect").classList.remove("metadataSelect"); // Change the selected metadata
        metadataAppend.classList.add("metadataSelect");
        generalByeAnimation(document.getElementById("onlyCustom")); // Hide the textbox where the user was prompted to add a key for custom meteadata
    });
    metadataAppend.append(label);
    document.getElementById("metadataShow").append(metadataAppend);
    addHoverEvents(metadataAppend);
}
document.querySelector("[data-key=custom]").addEventListener("click", () => { // The user wants to add a custom metadata
    if (document.querySelector(".metadataSelect") !== null) document.querySelector(".metadataSelect").classList.remove("metadataSelect"); // Change the selected item
    document.querySelector("[data-key=custom]").classList.add("metadataSelect");
    generalHelloAnimation(document.getElementById("onlyCustom"), true) // Show the textbox that prompts the user to choose a key
});
let customCount = 0;
document.getElementById("customAlbumArt").addEventListener("change", () => { // Create a custom album art
    if (document.getElementById("customAlbumArt").checked) {
        document.getElementById("customAlbumArt").checked = false; // Change it to false so that, if the user aborts the file selection, they'll be able to choose another file.
        let imgInput = document.createElement("input");
        imgInput.type = "file";
        imgInput.addEventListener("change", () => {
            document.getElementById("customAlbumArt").checked = true; // The user has selected an image, so it can continue
            conversionOptions.metadata.img = imgInput.files[0]; // Add the file to the conversionOptions property
        });
        imgInput.click();
    }
})
document.getElementById("itemAdd").addEventListener("click", () => { // The user has decided to add a metadata
    let elementKey = document.querySelector(".metadataSelect").getAttribute("data-key");
    // If it's custom, get the key value
    let currentCustom = elementKey === "custom";
    if (currentCustom) { elementKey = document.getElementById("metadataKey").value; customCount++; }
    let pushId = conversionOptions.metadata.items.length; // The space where the new metadata will be added
    conversionOptions.metadata.items.push({ key: elementKey, value: document.getElementById("metadataValue").value }); // Push the new metadata in the metadata conversion options
    let containerDiv = document.createElement("div"); // Create a div that shows the user the new metadata selection
    containerDiv.classList.add("colorSelect");
    containerDiv.style = "background-color: var(--row)";
    let metadataName = createSubOption(`${elementKey} | ${document.getElementById("metadataValue").value}`); // Create a label with the metadata information
    let deleteDiv = document.createElement("div");
    deleteDiv.style = "display: flex; float: right";
    let deleteBtn = createBtn("delete", "var(--card)", `${getComputedStyle(document.body).getPropertyValue("--select")}`); // Create a button to delete the selected metadata
    deleteBtn.addEventListener("click", () => {
        if (currentCustom) customCount--;
        conversionOptions.metadata.items.splice(pushId, 1); // Delete it from the metadata array
        // Add an height animation before deleting it also from the DOM
        setTimeout(() => { containerDiv.remove() }, 300);
        document.getElementById("metadataAdded").style.maxHeight = `${parseInt(document.getElementById("metadataAdded").style.maxHeight.replace("px", "")) - 55}px`;
    });
    deleteDiv.append(deleteBtn);
    containerDiv.append(metadataName, deleteDiv);
    document.getElementById("metadataAdded").append(containerDiv);
    document.getElementById("metadataAdded").style.maxHeight = `${parseInt(document.getElementById("metadataAdded").style.maxHeight.replace("px", "")) + 55}px`
})
document.getElementById("cutVideoSelect").addEventListener("change", () => { // The slider that permits the user to trim a video
    let showValue = [undefined, document.getElementById("singleCrop"), document.getElementById("multiCrop")] // The item to show if the value is 0, 1 or 2
    for (let i = 1; i < showValue.length; i++) if (parseInt(document.getElementById("cutVideoSelect").value) === i) generalHelloAnimation(showValue[i], true); else generalByeAnimation(showValue[i]); // If i is the same as the selected value, show the div, otherwise hide it.
})
let currentState = document.querySelector("html").offsetWidth > 799 ? 0 : 1; // 0 = two cards shown; 1 = a card shown
function resizeTab() {
    if (document.querySelector("html").offsetWidth > 799 && currentState === 1) { // Setup two cards per row
        currentState = 0;
        document.getElementById("textAdapt").textContent = currentTranslation.js.rightCard;
        document.querySelector(".flexAdaptive").prepend(document.querySelector("[data-card=contentCard]"), document.querySelector("[data-card=fileSelection]"), document.querySelector("[data-card=metadata]"), document.querySelector("[data-card=video]"), document.querySelector("[data-card=audio]", document.querySelector("[data-card=progress]"))); // Move the file selection tab at the right of the first row
    } else if (document.querySelector("html").offsetWidth < 800 && currentState === 0) { // Setup a card per row
        document.getElementById("textAdapt").textContent = currentTranslation.js.secondCard;
        currentState = 1;
        verticalTabPrefer();
    }
}
function verticalTabPrefer() {
    document.querySelector(".flexAdaptive").prepend(document.querySelector("[data-card=contentCard]"), document.querySelector("[data-card=metadata]"), document.querySelector("[data-card=video]"), document.querySelector("[data-card=audio]", document.querySelector("[data-card=fileSelection]"), document.querySelector("[data-card=progress]"))); // Move the file selection tab at on the second last row
}
window.addEventListener("resize", () => resizeTab());
if (currentState === 1) verticalTabPrefer(); // Add it now so that, if the website has a vertical layout, the tabs will be moved
document.getElementById("zipSave").addEventListener("change", () => { localStorage.setItem("ffmpegWeb-zipSave", document.getElementById("zipSave").checked ? "a" : "b"); }) // Save the choiche the user has made to save or not the content to a zip file
if (localStorage.getItem("ffmpegWeb-zipSave") === "a") { document.getElementById("zipSave").checked = true; document.getElementById("zipSave").dispatchEvent(new Event("input")) }; // If checked, trigger the "input" event of the checkbox, that shows/hide the zip manager section
function hexToRgbNew(hex) { // Borrowed from https://stackoverflow.com/a/11508164. Gets a RGB value from a hex color
    var arrBuff = new ArrayBuffer(4);
    var vw = new DataView(arrBuff);
    vw.setUint32(0, parseInt(hex, 16), false);
    var arrByte = new Uint8Array(arrBuff);

    return arrByte[1] + "," + arrByte[2] + "," + arrByte[3];
}
if (navigator.userAgent.toLowerCase().indexOf("safari") !== -1 && navigator.userAgent.toLowerCase().indexOf("chrome") === -1) { // Fix select look on Safari
    let rgbOption = hexToRgbNew(getComputedStyle(document.body).getPropertyValue("--text").replace("#", "")).split(",");
    document.getElementById("safariFix").innerHTML = `select {-webkit-appearance: none; background-image: url("data:image/svg+xml;utf8,<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='24' height='24' viewBox='0 0 24 24'><path fill='rgb(${rgbOption[0]},${rgbOption[1]},${rgbOption[2]}' d='M7.406 7.828l4.594 4.594 4.594-4.594 1.406 1.406-6 6-6-6z'></path></svg>"); background-position: 100% 50%; background-repeat: no-repeat; font-size: 10pt}`;
}
document.getElementById("maxCharacters").addEventListener("input", () => {
    if (parseInt(document.getElementById("maxCharacters").value) > 9) localStorage.setItem("ffmpegWeb-maxConsole", document.getElementById("maxCharacters").value);
})
if (localStorage.getItem("ffmpegWeb-maxConsole") !== null) document.getElementById("maxCharacters").value = localStorage.getItem("ffmpegWeb-maxConsole");
for (let item of document.querySelectorAll("[data-translate]")) englishTranslations.html[item.getAttribute("data-translate")] = item.textContent; // Fetch the translation of the HTML elements, so that if the user changes language, they'll be able to restore English without refreshing.
function applyTranslation(jsonItem) { // The function that applies the translations to the HTML document
    currentTranslation = jsonItem; // Save the new translation in the object
    for (let item in jsonItem.html) {
        for (let htmlelement of document.querySelectorAll(`[data-translate=${item}]`)) htmlelement.textContent = jsonItem.html[item];
    }
    document.getElementById("textAdapt").textContent = document.querySelector("html").offsetWidth > 799 ? currentTranslation.js.rightCard : currentTranslation.js.secondCard; // Change the language of the "second last card" or "card at the right", that refers to the card where the user can choose a file
}
let language = navigator.language || navigator.userLanguage; // Get the preferred language of the browser
function manageTranslations(langId) { // The function that fetches the language JSON file
    document.getElementById("langSelect").value = langId; // Change the selected language on the Language settings tab
    if (langId === "en") { // If it's English, use the default translations that are included with the default HTML & JavaScript
        applyTranslation(englishTranslations);
        return;
    }
    // Otherwise, fetch the translations and apply them
    fetch(`/translations/${langId}.json`).then((res) => {
        res.json().then((json) => {
            applyTranslation(json);
        })
    })
}
document.getElementById("langSelect").addEventListener("change", () => { // When the user changes the selected language, fetch the new language JSON file and save their choice for the future usage of the website
    manageTranslations(document.getElementById("langSelect").value);
    localStorage.setItem("ffmpegWeb-CurrentLanguage", document.getElementById("langSelect").value);
})
let supportedLanguages = ["it", "en"]; 
for (let lang of supportedLanguages) {
    if (language.indexOf(lang) !== -1 && localStorage.getItem("ffmpegWeb-CurrentLanguage") === null || localStorage.getItem("ffmpegWeb-CurrentLanguage") === lang) { // If there's no preferred language and the browser suggested language is this one, OR if the preferred language is this one, apply it
        manageTranslations(lang);
        if (localStorage.getItem("ffmpegWeb-CurrentLanguage") === null && lang !== "en") createAlert("A foreign language has been automatically applied", "foreignLanguage", true); // If there's no preferred language, create a bottom alert that asks the user if they want to go back to English
        break;
    }
}
for (let item of document.querySelectorAll("[data-text]")) item.type = "text"; // Since Webpack delets the "type=text" attribute, it'll be added again from JavaScript
document.getElementById("quitFfmpegGeneral").addEventListener("change", () => {document.getElementById("quitFfmpegGeneral").checked ? localStorage.removeItem("ffmpegWeb-GeneralQuit") : localStorage.setItem("ffmpegWeb-GeneralQuit", "a")});
document.getElementById("quitFfmpegTimestamp").addEventListener("change", () => {document.getElementById("quitFfmpegTimestamp").checked ? localStorage.setItem("ffmpegWeb-TimestampQuit", "a") : localStorage.setItem("ffmpegWeb-TimestampQuit", "a")});
if (localStorage.getItem("ffmpegWeb-GeneralQuit") === "a") document.getElementById("quitFfmpegGeneral").checked = false;
if (localStorage.getItem("ffmpegWeb-TimestampQuit") === "a") document.getElementById("quitFfmpegTimestamp").checked = true;
document.getElementById("quitProcess").addEventListener("click", () => resetFfmpeg());