(async () => {
    // Register service worker for offline access
    if ('serviceWorker' in navigator) {
        let registration;
        const registerServiceWorker = async () => {
            registration = await navigator.serviceWorker.register('./service-worker.js',);
        };
        registerServiceWorker();
    } else console.error(":/")
    // Check if there's a new version fetching updatecode.txt with no cache. If the result isn't the same as the current app version, a confirm dialog will be shown so that the user can update.
    let appVersion = "2.0.2";
    let isElectron = typeof window.comunication !== "undefined"; // window.comunication is the type used by the script to comunicate with the Electron main script (used for calling native ffmpeg & doing FS operations)
    let ipcRenderer = isElectron ? window.comunication : null; // Get the ipcRenderer that'll permit to comunicate with the main Electron script, only if the website is running on Electron
    let resolveElectronPromise = null; // Placeholder for a promise for async Electron activities. This promise will be resolved when ffmpeg process is quitted.
    let resolveElectronWritePromise = null; // Placeholder for a promise for async Electron activities. This promise will be resolved when a file will be written in the drive (used for merging files)
    let resolveElectronCopyPromise = null; // Placeholder for a promise for async Electron activities. This promise will be resolved when a file will be copied in the drive. Used when adding an image as album art for a music track.
    let secondsElaboration = -1; // A number that'll contain the total seconds of the input file. This is done to show the progress in a bar.
    let isShiftPressed = false; // If Shift is pressed and the Electron app is running, the file path will be copied instead of opened.
    let zip; // The variable that'll contain the ZIP file, only if using the web app.
    function getSecondsFromFfmpeg(getDuration) { // The function that gets the seconds of the input file from a "Duration: " string provided by the ffmpeg process
        getDuration = getDuration.substring(0, getDuration.indexOf("."));
        let [hour, minute, second] = getDuration.split(":");
        return (hour * 3600) + (minute * 60) + +second; // Note: leave +second to convert it to number
    }
    let localFfmpeg = {
        isLocal: false,
        out: ""
    }
    if (isElectron) { // Add specific events to the ipcRenderer
        ipcRenderer.on("ConsoleStatus", (event, content) => { // Updated the text of the ffmpeg process
            let decode = new TextDecoder().decode(content); // Get it as a string
            ffmpeg._logger({ type: "", message: decode }); // Trigger the "setLogger" event
            if (secondsElaboration === -1 && decode.indexOf("Duration: ") !== -1) { // If a duration isn't provided, and it might be available in the string, add it
                secondsElaboration = getSecondsFromFfmpeg(decode.substring(decode.indexOf("Duration: ") + "Duration: ".length));
            } else if (secondsElaboration !== -1 && decode.indexOf("time=") !== -1) { // Found the time ffmpeg has encoded. Calculate the ratio, and then trigger the "setProcess" event. 
                ffmpeg._process({ ratio: getSecondsFromFfmpeg(decode.substring(decode.indexOf("time=") + "time=".length)) / secondsElaboration });
            }
            if (decode.indexOf("already exists. Overwrite? [y/N]") !== -1) document.getElementById("overwriteDiv").style.display = ""; // If another file with the same file name is in the file system, ask if it should be overwritten.
        });
        ipcRenderer.on("FinishedConversion", (event, content) => { secondsElaboration = -1; resolveElectronPromise() }); // ffmpeg process exited. Resolve the promise.
        ipcRenderer.on("WriteArrayCompleted", () => { resolveElectronWritePromise() }) // Successfully written the "array.txt" file for file merge. Resolve the promise.
        ipcRenderer.on("ImageCopied", () => { resolveElectronCopyPromise() }) // Successfully copied the album art image for metadata editing. Resolve the promise.
        ipcRenderer.on("FSChange", (event, content) => { // Something has been written or deleted. Get what happened, and append it to the DOM
            if (content.action === "add") { // Create the new label with the text
                let l = document.createElement("l");
                l.textContent = content.value;
                l.style.display = "block";
                l.style.marginBottom = "8px";
                l.addEventListener("click", () => {
                    isShiftPressed ? navigator.clipboard.writeText(content.value) : ipcRenderer.send("ExternalOpenPath", content.value);
                })
                document.getElementById("fsAppend").append(l);
            } else { // Delete the item from the DOM
                Array.from(document.getElementById("fsAppend").children).find(e => e.textContent === content.value).remove();
            }
        })
        document.getElementById("overwriteYes").addEventListener("click", () => { // The user wants to overwrite the current file
            ipcRenderer.send("Overwrite", true); // Ask the main process to overwrite
            document.getElementById("overwriteDiv").style.display = "none"; // And hide itself
        })
        // Adapt UI by hiding things that cannot be used in the Electron version (quit ffmpeg process, save file to zip, install as PWA), and show the hardware acceleration settings.
        document.getElementById("redownloadPart").style.display = "none";
        document.getElementById("console").parentElement.style.height = "200px";
        document.getElementById("ramManagement").style.display = "none";
        document.getElementById("zipSaveContainer").style.display = "none";
        document.getElementById("hwAcceleration").style.display = "block";
        document.querySelector("[data-fetch=arrowleft]").style.display = "none";
        document.getElementById("fsPart").style.display = "block";
        document.getElementById("filePathInBarContainer").style.display = "block";
        scrollItem(); // Go to the process tab, since showing the PWA banner is useless.
        for (let item of document.querySelectorAll("a")) item.addEventListener("click", (e) => {
            e.preventDefault();
            ipcRenderer.send("ExternalOpen", item.href);
        })
        document.getElementById("electronInstructions").addEventListener("click", () => { // Show instructions to install Electron app
            ipcRenderer.send("ExternalOpen", "https://github.com/Dinoosauro/ffmpeg-web#electron");
        })
    } else {
        let jsScript = document.createElement("script");
        jsScript.src = localFfmpeg.isLocal ? "./jsres/jszip.js" : "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
        jsScript.onload = () => {
            zip = new JSZip(); // Create new .zip file so that, if the user enables it from settings, it can be used
        }
        document.body.append(jsScript);
        document.getElementById("electronInstructions").addEventListener("click", () => {  // Show instructions to install Electron app
            window.open("https://github.com/Dinoosauro/ffmpeg-web#electron", "_blank");
        })
    }
    fetch(isElectron ? "https://raw.githubusercontent.com/Dinoosauro/ffmpeg-web/main/updatecode.txt" : "./updatecode.txt", { cache: "no-store" }).then((res) => res.text().then((text) => { if (text.replace("\n", "") !== appVersion) if (confirm(`There's a new version of ffmpeg-web. Do you want to update? [${appVersion} --> ${text.replace("\n", "")}]`)) { if (!isElectron) { caches.delete("ffmpegweb-cache"); location.reload(true); } else ipcRenderer.send("ExternalOpen", "https://github.com/Dinoosauro/ffmpeg-web/") } }).catch((e) => { console.error(e) })).catch((e) => console.error(e));
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
            oom: "The ffmpeg process has reported an Out of memory error. Please refresh the webpage and restart the operation. If you are using the \"Multiple timestamp\" cut, add again only the missing files.",
            addArgument: "Add argument"
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
    function getFilePath(path) {
        /*
            Electron provides a file path when a file is selected, and this is very useful to avoid copying files into a temp folder.
            However, this would create conflict if the user wants to use only safe characters for the file. Therefore, the typical "dividers" used by file systems to navigate will be replaced with a temp value, introduced by a dollar. The main rendered will then replace these values.
            This might not be the ideal solution, but honestly there are lots of things in this project that could be rewritten better.
        */
        if (!isElectron) return path;
        return path.replaceAll("$", "$Dollar").replaceAll("/", "$Slash").replaceAll("\\", "$BackwardsSlash").replaceAll(":", "$Dot");
    }
    let pickerButtons = [document.getElementById("btnSelect"), document.getElementById("folderSelect")]; // The buttons that trigger a file picker event
    for (let item of pickerButtons) item.addEventListener("click", (e) => { // The "Select file" button.
        // If ffmpeg.wasm is not loaded, don't do anything.
        if (e.target.classList.contains("disabled")) { createAlert(englishTranslations.js.ffmpegWait, "ffmpegLoadRemind"); return; };
        // Reset the inputs so that, even if there's an error in the ffmpeg conversion, it'll be possible to continue using the website.
        document.getElementById("reset").reset();
        tempOptions = optionGet();
        e.target.id === "folderSelect" ? document.getElementById("fileInput").setAttribute("webkitdirectory", "") : document.getElementById("fileInput").removeAttribute("webkitdirectory"); // Depending on the clicked button, add the "webkitdirectory" attribute to read directory files
        // Start file selection progress
        document.getElementById("fileInput").click();
    });
    let isMultiCheck = [false, 0]; // Array of two items: [Boolean: multiple files must be converted (with multiple file outputs); the number of files converted]
    async function intelliFetch(outName) {
        /*
            A function that is called when the final file should be read. 
                - If running on Electron, this will add to the readFile command a "true" boolean, that will tell to the main renderer to rename the file as the output name.
                - If running on WebAssembly, it will just read the output file name, and return it.
                    Note that await is used for asyncronous file renaming in Electron.
        */
        return await ffmpeg.FS("readFile", outName, isElectron ? true : undefined);
    }
    // The first function that uses ffmpeg: extract an album art from an audio file and convert it to the selected image format.
    async function extractAlbumArt() {
        for (let i = 0; i < document.getElementById("fileInput")._filesToConvert.length; i++) {
            let item = document.getElementById("fileInput")._filesToConvert[i];
            item._path = ((item.path ?? "") === "") ? item.name : getFilePath(item.path); // Create a ._path property that, if available, it'll have the formatted path of the file.
            try {
                document.title = `ffmpeg-web | [${i}/${document.getElementById("fileInput")._filesToConvert.length}] Converting ${document.getElementById("showPathInBar").checked ? item.path ?? item.name : item.name}`; // Update title with the current conversion
            } catch (ex) {
                console.warn(ex);
            }
            ffmpeg.FS("writeFile", item._path, await fetchFile(item));
            let prepareScript = ["-i", item._path];
            if (document.querySelector(".imgSelect").getAttribute("data-imgval") !== "no") prepareScript.push("-vcodec", document.querySelector(".imgSelect").getAttribute("data-imgval")); // data-imgval = encoder; data-extension = file extension;
            let outName = `${item._path.substring(0, item._path.lastIndexOf("."))}.${document.querySelector(".imgSelect").getAttribute("data-extension")}`;
            await ffmpeg.run(...prepareScript, outName);
            downloadItem(await intelliFetch(outName), outName, item.webkitRelativePath);
        }
        document.title = "ffmpeg-web";
        createAlert(englishTranslations.js.allAlbum, "albumArtExported");
    }
    function customPrompt() { // A Promise that'll show the prompt to filter the files depending on how their name ends. It'll return the value of the textbox
        return new Promise((resolve) => {
            document.getElementById("keepFilesThatEndsAlert").style = "top: 5vh; opacity: 1; display: flex; border: 3px solid var(--text); z-index: 4";
            document.getElementById("keepFilesThatEndsAlert").parentElement.style.opacity = "1";
            document.getElementById("confirmKeepFiles").onclick = () => {
                document.getElementById("keepFilesThatEndsAlert").parentElement.style.opacity = "0";
                setTimeout(() => {
                    document.getElementById("keepFilesThatEndsAlert").style = "";
                }, 500);
                resolve(document.getElementById("keepFilesThatEnds").value);
            }
        })
    }
    document.getElementById("fileInput").addEventListener("input", async () => { // After a file has been selected, the website will start to look into the selected files and start the conversion
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); // Go to the bottom of the page, where the conversion stats will be displayed.
        let outputFilter = document.getElementById("fileInput").getAttribute("webkitDirectory") !== null ? await customPrompt() : ""; // If the user has selected a folder, ask which files should be converted by filtering the final part of the name
        document.getElementById("fileInput")._filesToConvert = Array.from(document.getElementById("fileInput").files).filter(e => e.name.toLowerCase() !== ".ds_store" && e.name.toLowerCase() !== "desktop.ini" && e.name.endsWith(outputFilter)); // Keep only the files that should be converted 
        let files = document.getElementById("fileInput")._filesToConvert;
        for (let i = 0; i < files.length; i++) { // For each file, update it. If there's no path, use the default name. Otherwise, get the path with the replaced "divider" charaters
            files[i]._path = ((files[i].path ?? "") === "") ? files[i].name : getFilePath(files[i].path);
        }
        if (document.getElementById("mergeName").value.endsWith(".alac")) document.getElementById("mergeName").value = `${document.getElementById("mergeName").value.substring(0, document.getElementById("mergeName").value.length - 5)}.m4a`; // Since ffmpeg doesn't recognize the ".alac" extension, it'll be converted to .m4a, that still supports the alac encoder
        let tempPush = [];
        if (document.querySelector(".sectionSelect").getAttribute("section") === "extractalbum") { // If the user is on the "Extract album tab", execute a completely different function that will handle that, and stop this.
            extractAlbumArt();
            return;
        }
        conversionOptions.output.dividerProgression = parseInt(document.getElementById("trackStart").value) - 1;
        if (document.getElementById("cutVideoSelect").value === "2") tempOptions.isSecondCut = true; // If the value is "2", the user wants that the content divided in some parts (with timestamps)
        conversionOptions.output.custom = document.querySelector(".sectionSelect").getAttribute("section") === "cmd"; // Make this so that if the user changes tab for more conversion the custom script isn't kept
        conversionOptions.output.merged = document.querySelector(".sectionSelect").getAttribute("section") === "merge"; // Same as before
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
                for (let i = 1; i < files.length; i++) if (files[0]._path.substring(0, files[0]._path.lastIndexOf(".")) === files[i]._path.substring(0, files[i]._path.lastIndexOf("."))) tempPush.push(files[i], files[0]);
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
        let files = document.getElementById("fileInput")._filesToConvert;
        if (document.getElementById("cutVideoSelect").value === "2") tempOptions.isSecondCut = true; // If the value is "2", the user wants that the content divided in some parts (with timestamps)
        if (isMultiCheck[1] >= files.length) { document.getElementById("reset").reset(); createAlert(currentTranslation.js.conversionEnded, "convertAll"); isMultiCheck = [false, 0]; return } // All the files are converted, so nothing else will be done
        if (parseInt(document.getElementById("multiVideoHandle").value) === 3) { // Add input to the command if they have the same name (for each content selected)
            let stopLooking = false;
            for (let i = isMultiCheck[1]; i < files.length; i++) {
                for (let x = isMultiCheck[1]; x < files.length; x++) { // Not efficient at all, I should really improve this
                    if (files[i]._path === files[x]._path) continue;
                    if (files[i]._path.substring(0, files[i]._path.lastIndexOf(".")) === files[x]._path.substring(0, files[x]._path.lastIndexOf("."))) {
                        stopLooking = true;
                        conversionOptions.output.name = safeCharacters(files[i]._path.substring(0, files[i]._path.lastIndexOf(".")));
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
            conversionOptions.output.name = safeCharacters(files[isMultiCheck[1]]._path.substring(0, files[isMultiCheck[1]]._path.lastIndexOf(".")));
            isMultiCheck[1] += 1;
            ffmpegStart(); // Start conversion
        }
    }
    async function mergeContent(file) { // Function that mangaes merging content
        let conversionFile = "";
        let deleteFiles = []; // The files to delete from ffmpeg.wasm memory after the conversion
        for (let fileItem of file) { // Create a list of content that will be merged, so that it can be passed to ffmpeg
            conversionFile += `\nfile '${fileItem._path ?? fileItem.name}'`;
            ffmpeg.FS("writeFile", fileItem._path ?? fileItem.name, await fetchFile(fileItem));
            deleteFiles.push(fileItem._path)
        }
        conversionFile = conversionFile.substring(1); // Delete the first \n
        isElectron ? await new Promise((resolve) => { // Write the array file. In Electron, this needs to be written in the file system. In WebAssembly it can just be written in the local FS with an ArrayBuffer.
            resolveElectronWritePromise = resolve;
            ipcRenderer.send("WriteArrayFile", conversionFile);
        }) : ffmpeg.FS("writeFile", "array.txt", new TextEncoder().encode(conversionFile)); // Create a binary file from the list, so that it can be handled by ffmpeg.
        deleteFiles.push("array.txt"); // Delete the array when finished.
        if (document.getElementById("mergeName").value === "") document.getElementById("mergeName").value = `${file[0]._path.substring(0, file[0]._path.lastIndexOf("."))}-merged${file[0]._path.substring(file[0]._path.lastIndexOf("."))}`; // Create a fallback name if the user hasn't written anything in the "Output file name" textbox
        if (document.getElementById("mergeName").value.endsWith(".m4a")) await ffmpeg.run("-f", "concat", "-safe", "0", "-i", "array.txt", "-c", "copy", "-map_metadata", "0", "-vn", `${document.getElementById("mergeName").value}.tempa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`); else await ffmpeg.run("-f", "concat", "-safe", "0", "-i", "array.txt", "-c", "copy", "-map_metadata", "0", `${document.getElementById("mergeName").value}.tempa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`); // If the file ends with ".m4a", the video (99% it's an album art) must be discarded, since ffmpeg won't be able to handled that correctly.
        let data = await ffmpeg.FS("readFile", `${document.getElementById("mergeName").value}.tempa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`); // get the result
        deleteFiles.push(`${document.getElementById("mergeName").value}.tempa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`);
        let start = "a"; // The prefix to the output file
        if (document.getElementById("keepAlbumArt").checked) { // The album art must be kept
            try {
                await ffmpeg.run("-i", file[0]._path, "temp.jpg"); // Fetch the album art from the original file
                await ffmpeg.run("-i", `${document.getElementById("mergeName").value}.tempa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`, "-i", "temp.jpg", "-map", "0", "-map", "1", "-c", "copy", "-disposition:v:0", "attached_pic", `${document.getElementById("mergeName").value}.tempaa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`); // And merge it, without re-encoding, to the final content
                data = await ffmpeg.FS("readFile", `${document.getElementById("mergeName").value}.tempaa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`); // Fetch the new file with album art
                deleteFiles.push(`${document.getElementById("mergeName").value}.tempaa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`, "temp.jpg");
                start = "aa";
            } catch (ex) {
                console.error(ex);
            }
        }
        try {
            await ffmpeg.run("-i", `${document.getElementById("mergeName").value}.temp${start}.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`, "-i", file[0]._path, "-map", "0", "-map_metadata", "1", "-c", "copy", `${document.getElementById("mergeName").value}.tempaaa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`); // Copy all of the metadata of the first selected file to the final one
            data = await ffmpeg.FS("readFile", `${document.getElementById("mergeName").value}.tempaaa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`); // Fetch the final file
            deleteFiles.push(`${document.getElementById("mergeName").value}.tempaaa.${document.getElementById("mergeName").value.substring(document.getElementById("mergeName").value.lastIndexOf(".") + 1)}`);
        } catch (ex) {
            console.error(ex);
        }
        document.getElementById("console").innerHTML = consoleText; // Add information text
        document.getElementById("console").parentElement.scrollTo({ top: document.getElementById("console").parentElement.scrollHeight, behavior: 'smooth' }); // Scroll to the bottom of information text
        downloadItem(isElectron ? intelliFetch(data) : data, document.getElementById("mergeName").value, file[0].webkitRelativePath);
        for (let fileItem of deleteFiles) await ffmpeg.FS("unlink", fileItem);
        tempOptions = optionGet(); // Prepare for another conversion, deleting conversion-specific informations
    }
    async function ffmpegReadyMetadata() { // Used by the "Metadata" tab, this function will add to the array all the metadata the user has inserted
        tempOptions.ffmpegArray.push("-codec", "copy"); // No re-encodnig
        if (!document.getElementById("metadataKeep").checked) tempOptions.ffmpegArray.push("-map_metadata", "-1"); // If the user wants to keep metadata, use the metadata of the selected file as base for other ones
        for (let item of conversionOptions.metadata.items) tempOptions.ffmpegArray.push("-metadata", `${item.key}=${item.value}`); // Add all of the custom metadata to the script
        if (conversionOptions.metadata.img !== undefined && document.getElementById("customAlbumArt").checked) { // If there's a valid image, add it as an album art. It'll be added in the array later.
            isElectron ? await new Promise((resolve) => { resolveElectronCopyPromise = resolve; ipcRenderer.send("TempImage", conversionOptions.metadata.img.path) }) : await ffmpeg.FS("writeFile", "temp.jpg", await fetchFile(conversionOptions.metadata.img)); // If it's in Electron, copy the image into the local folder. Otherwise, write it in the local FS.
            tempOptions.deleteFile.push("temp.jpg");
        }
        if (document.getElementById("removeOlderArt").checked) tempOptions.ffmpegArray.push("-vn"); // If the user doesn't want to keep the album art, delete it
        tempOptions.fileExtension = tempOptions.ffmpegName[0].substring(tempOptions.ffmpegName[0].lastIndexOf(".") + 1);
        if (!document.getElementById("mp4Keep").checked && customCount > 0 && tempOptions.fileExtension === "mp4" || tempOptions.fileExtension === "m4v" || tempOptions.fileExtension === "m4a" || tempOptions.fileExtension === "alac") tempOptions.ffmpegArray.push("-movflags", "use_metadata_tags"); // Enable custom metadata for MP4 container
        addSimpleCut(); // Checks if the user wants to trim the content to get only a part of it
        tempOptions.ffmpegArray.push(`${tempOptions.ffmpegName[0]}.tempa.${tempOptions.fileExtension}`);
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
        conversionOptions.output.suggestedTitle = safeCharacters(alignmentResult[0]); // Add a "suggesttedTitle" property that'll be used for adding the title metadata of the file.
        conversionOptions.output.name = `${isElectron ? tempOptions.ffmpegName[0].substring(0, tempOptions.ffmpegName[0].lastIndexOf(tempOptions.ffmpegName[0].indexOf("$BackwardsSlash") !== -1 ? "$BackwardsSlash" : "$Slash") + (tempOptions.ffmpegName[0].indexOf("$BackwardsSlash") !== -1 ? "$BackwardsSlash".length : "$Slash".length)) : ""}${safeCharacters(alignmentResult[0])}`; // If Electron is being used, add also the path of the first file for copying.
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
        try {
            document.title = `ffmpeg-web | [${isMultiCheck[1] === 0 ? "1" : isMultiCheck[1]}/${document.getElementById("fileInput")._filesToConvert.length}] Converting "${document.getElementById("showPathInBar").checked ? document.getElementById("fileInput")._filesToConvert[isMultiCheck[1] !== 0 ? isMultiCheck[1] - 1 : 0].path ?? document.getElementById("fileInput")._filesToConvert[isMultiCheck[1] !== 0 ? isMultiCheck[1] - 1 : 0].name : document.getElementById("fileInput")._filesToConvert[isMultiCheck[1] !== 0 ? isMultiCheck[1] - 1 : 0].name}"`; // Update title with the current conversion
        } catch (ex) {
            console.warn(ex);
        }
        let finalScript = [...JSON.parse(localStorage.getItem("ffmpegWeb-Argshwaccel") ?? "[]")]; // Add the items for hardware acceleration initialization, if available
        if (!skipImport) {
            if (conversionOptions.output.custom) readFfmpegScript(); else if (document.querySelector(".sectionSelect").getAttribute("section") === "metadata") await ffmpegReadyMetadata(); else buildFfmpegScript();
            if (tempOptions.itsscale.length !== 0) finalScript.push(...tempOptions.itsscale); // tempOptions.itsscale contains the options that go before the input files
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
            if (document.getElementById("smartMetadata").checked) tempOptions.ffmpegArray.push("-metadata", `title=${conversionOptions.output.suggestedTitle}`, "-metadata", `track=${conversionOptions.output.dividerProgression}`); // Smart metadata for multiple dividers
            tempOptions.ffmpegArray.push(`${conversionOptions.output.name}.${tempOptions.fileExtension}.tempa.${tempOptions.fileExtension}`); // Push the output file name
        }
        finalScript.push(...tempOptions.ffmpegArray);
        await ffmpeg.run(...finalScript); // Run conversion
        let startDifferentText = "a";
        if (conversionOptions.output.custom) { // Get file name and extension of the custom file output
            conversionOptions.output.name = safeCharacters(tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].substring(0, tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].lastIndexOf(".")));
            tempOptions.fileExtension = tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].substring(tempOptions.ffmpegArray[tempOptions.ffmpegArray.length - 1].lastIndexOf(".") + 1);
            startDifferentText = "";
        }
        let data = ffmpeg.FS('readFile', `${conversionOptions.output.name}.${tempOptions.fileExtension}${startDifferentText !== "" ? `.temp${startDifferentText}.${tempOptions.fileExtension}` : ""}`); // Read the result of the conversion
        tempOptions.deleteFile.push(`${conversionOptions.output.name}.${tempOptions.fileExtension}.${startDifferentText !== "" ? `temp${startDifferentText}.${tempOptions.fileExtension}` : ""}`);
        if (document.getElementById("albumArtCheck").checked && conversionOptions.output.audExtension !== "ogg" || document.querySelector(".sectionSelect").getAttribute("section") === "metadata" && document.getElementById("customAlbumArt").checked && conversionOptions.metadata.img !== undefined) { // If these conditions are satisfied, the album art must be added
            try {
                if (document.getElementById("albumArtCheck").checked && conversionOptions.output.audExtension !== "ogg" && !document.getElementById("customAlbumArt").checked) await ffmpeg.run("-i", tempOptions.ffmpegName[0], "temp.jpg"); // If the album art isn't provided by the user (this is only possible in the metadata tab), it'll be fetched from the input file.
                let tempArray = [];
                if (document.getElementById("smartMetadata").checked && tempOptions.isSecondCut) tempArray.push("-metadata", `title=${conversionOptions.output.name}`, "-metadata", `track=${conversionOptions.output.dividerProgression}`); // Smart metadata for cutting item by timestamp
                await ffmpeg.run("-i", `${conversionOptions.output.name}.${tempOptions.fileExtension}.${startDifferentText !== "" ? `temp${startDifferentText}.${tempOptions.fileExtension}` : ""}`, "-i", "temp.jpg", "-map", "0", "-map", "1", "-c", "copy", "-disposition:v:0", "attached_pic", ...tempArray, `${conversionOptions.output.name}.${tempOptions.fileExtension}.tempaa.${tempOptions.fileExtension}`); // Add the album art to the file
                data = ffmpeg.FS("readFile", `${conversionOptions.output.name}.${tempOptions.fileExtension}.tempaa.${tempOptions.fileExtension}`) // Read the exported file with the album art
                tempOptions.deleteFile.push(`temp.jpg`, `${conversionOptions.output.name}.${tempOptions.fileExtension}.tempaa.${tempOptions.fileExtension}`);
            } catch (ex) {
                console.error(ex);
            }
        }
        downloadItem(isElectron ? intelliFetch(data) : data, undefined, tempOptions.ffmpegBuffer[0]?.webkitRelativePath);
        document.title = "ffmpeg-web";
        document.getElementById("console").innerHTML = consoleText; // Add output text to the console
        document.getElementById("console").parentElement.scrollTo({ top: document.getElementById("console").parentElement.scrollHeight, behavior: 'smooth' }); // Scroll to the end of the console text
        let textCutSplit = document.getElementById("timestampArea").value.split("\n");
        if (tempOptions.isSecondCut && textCutSplit.length > tempOptions.secondCutProgress && textCutSplit[tempOptions.secondCutProgress].replaceAll(" ", "").length > 1) { // If there's another timestamp, run again the conversion
            tempOptions.ffmpegArray.splice(tempOptions.ffmpegArray.lastIndexOf("-ss"), tempOptions.ffmpegArray.length);
            try {
                if (document.getElementById("quitFfmpegTimestamp").checked) await resetFfmpeg();
                for (let file of [`${conversionOptions.output.name}.${tempOptions.fileExtension}.tempa.${tempOptions.fileExtension}`, `${conversionOptions.output.name}.${tempOptions.fileExtension}.tempaa.${tempOptions.fileExtension}`]) try { await ffmpeg.FS('unlink', file); } catch (ex) { console.warn(ex) }; // Delete the files from the ffmpeg file system
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
    function downloadItem(data, name, webkitRelativePath) { // Function to download a file
        if ((data ?? "undefined") === "undefined" || typeof data === "object" && typeof data.then === "function") return; // This will automatically block all file downloads in the Electron page.
        downloadName = name !== undefined ? name : `${safeCharacters(conversionOptions.output.name)}.${tempOptions.fileExtension}`; // If no name is provided, fetch the result of the conversion
        if (document.getElementById("zipSave").checked) { // If the user wants a zip file, add it to JSZIP, and notify the user
            let newZip = zip; // Save the zip object as a new variable
            if ((webkitRelativePath ?? "") !== "") { // The user has selected a folder, and therefore it's possible to create a folder hierarchy 
                let path = webkitRelativePath.split("/");
                path.shift();
                path.pop();
                for (let remainingPath of path) newZip = newZip.folder(remainingPath); // Create folders 
            }
            newZip.file(downloadName, new File([data.buffer], downloadName));
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
        tempOptions.ffmpegName.push(file._path);
    }
    let isAudBitrateShown = true;
    function safeCharacters(input) { // Replaces characters that aren't permittend on Windows with characters that look similar to them
        if (document.getElementById("safeFile").checked) return input; // The user wants to use also unsafe characters 
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
        conversionOptions.videoOptions.codec = item.getAttribute(`data-hw-${document.getElementById("hwAccelSelect").value}`) ?? item.getAttribute("data-videoval"); // If the user has selected a hardware acceleration option, and it's available, choose that.
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
                    case 0: // Slider
                        tempOptions.ffmpegArray.push("-qscale:v", conversionOptions.videoOptions.bitrateLength);
                        break;
                    default: // Textbox
                        tempOptions.ffmpegArray.push("-b:v", conversionOptions.videoOptions.bitrateLength);
                        break;
                }
                switch (document.getElementById("hwAccelSelect").value) { // If hardware acceleration is enabled, add some arguments to the command for quality contorl
                    case "apple":
                        tempOptions.ffmpegArray.push("-qmin", conversionOptions.videoOptions.bitrateType === 0 ? conversionOptions.videoOptions.bitrateLength : "28", "-qmax", conversionOptions.videoOptions.bitrateType === 0 ? conversionOptions.videoOptions.bitrateLength : "28");
                        break;
                    case "intel":
                        tempOptions.ffmpegArray.push(...(conversionOptions.videoOptions.bitrateType === 0 ? ["-global_quality", conversionOptions.videoOptions.bitrateLength] : ["-b:v", conversionOptions.videoOptions.bitrateLength, "-maxrate", conversionOptions.videoOptions.bitrateLength]))
                        break;
                    case "nvidia":
                        tempOptions.ffmpegArray.push(...(conversionOptions.videoOptions.bitrateType === 0 ? ["-crf", conversionOptions.videoOptions.bitrateLength] : ["-maxrate", conversionOptions.videoOptions.bitrateLength, "-bufsize", "1000k"]));
                        break;
                    case "amd":
                        tempOptions.ffmpegArray.push(...(conversionOptions.videoOptions.bitrateType === 0 ? ["-rc", "qvbr", "-qvbr_quality_level", conversionOptions.videoOptions.bitrateLength, "-qmin", conversionOptions.videoOptions.bitrateLength, "-qmax", conversionOptions.videoOptions.bitrateLength] : ["-rc", "cbr", "-bufsize", "1000k"]));
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
        tempOptions.ffmpegArray.push(`${conversionOptions.output.name}.${tempOptions.fileExtension}.tempa.${tempOptions.fileExtension}`); // Temp output file
    }
    function addSimpleCut() { // Trim content  from a start time to an end time
        if (document.getElementById("cutVideoSelect").value === "1") {
            if (document.getElementById("startCut").value !== "") tempOptions.ffmpegArray.push("-ss", document.getElementById("startCut").value);
            if (document.getElementById("endCut").value !== "") tempOptions.ffmpegArray.push("-to", document.getElementById("endCut").value);
        }
    }
    if (!isElectron) await new Promise((resolve) => { // Load the ffmpeg.wasm script if Electron isn't being used
        let script = document.createElement("script");
        script.crossOrigin = "anonymous";
        script.src = !localFfmpeg.isLocal ? "https://unpkg.com/@ffmpeg/ffmpeg@0.11.0/dist/ffmpeg.min.js" : "./jsres/ffmpeg-html.js";
        script.onload = () => { resolve() };
        document.body.append(script);
    });
    const { createFFmpeg, fetchFile } = !isElectron ? FFmpeg : { createFFmpeg: () => { }, fetchFile: () => { } }; // If using Electron, the "createFfmpeg" and "fetchFile" function are useless, and should be kept only to avoid errors.
    async function getFfmpegInBlob() {
        let res = await fetch(".jsres/ffmpeg-core.js");
        let blob = await res.blob();
        localFfmpeg.out = blob;
    }
    if (localFfmpeg.isLocal && !isElectron) await getFfmpegInBlob();
    let ffmpeg = !isElectron ? createFFmpeg({ log: false, corePath: localFfmpeg.isLocal ? new URL('jsres/ffmpeg-core.js', document.location).href : 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js' }) : { // If using Electron, create a similar object 
        setLogger: (e) => { ffmpeg._logger = e },  // Set the logger function into a variable that can be called
        setProgress: (e) => { ffmpeg._process = e }, // Set the logger function into a variable that can be called
        isLoaded: (() => false),
        load: (() => { return new Promise((resolve) => resolve()) }),
        FS: (type, path, returnTime) => {
            switch (type) {
                case "readFile":
                    if (returnTime) { // The output file should be read. With Electron, just rename it.
                        document.getElementById("progress").value = 100;
                        ipcRenderer.send("ReadFinalFile", path);
                    } else return path;
                    break;
                case "unlink": // Delete temp files.
                    ipcRenderer.send("DeleteTempFile", path);
                    break;
            }
        },
        run: (...args) => {
            return new Promise((resolve) => {
                resolveElectronPromise = resolve;
                ipcRenderer.send("StartProcess", args);
            })
        },
        exit: () => { },
        _logger: null,
        _process: null
    }; // Currently ffmpeg.wasm will remain on version 0.11.0 until significant performance improvements will be made
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
    let dialogShow = [[document.getElementById("showFilter"), document.getElementById("hideFilter"), document.getElementById("hideFilter2"), document.getElementById("showFilter2"), document.getElementById("showSettings"), document.getElementById("hideSettings"), document.getElementById("hideDialog")], [document.getElementById("audioFilterDialog"), document.getElementById("audioFilterDialog"), document.getElementById("videoFilterDialog"), document.getElementById("videoFilterDialog"), document.getElementById("settings"), document.getElementById("settings"), document.getElementById("updateDialog")], ["block", "none", "none", "block", "block", "none", "none"]] // An array of items containing: [An array of items that will trigger an action when clicked, the dialog that will change visibility, the type of visibility]
    for (let i = 0; i < dialogShow[0].length; i++) dialogShow[0][i].addEventListener("click", () => {
        if (dialogShow[2][i] !== "none") { // The dialog must be shown, so a "hello" animation will be shown
            generalHelloAnimation(dialogShow[1][i], dialogShow[2][i]);
        } else { // The dialog must be hidden, so a "goodbye" animation will be shown
            generalByeAnimation(dialogShow[1][i]);
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
        for (let part of JSON.parse(localStorage.getItem(`ffmpegWeb-Argscustom`) ?? "[]")) tempOptions.ffmpegArray.push(part); // Get the custom arguments
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
        if (item.classList.contains("dialog")) item.parentElement.style.opacity = "0";
        setTimeout(() => {
            (item.classList.contains("dialog") ? item.parentElement : item).style.display = "none";
            item.classList.remove("animate__animated", "animate__backOutDown");
        }, 1050);
    }
    function generalHelloAnimation(item, setDisplay) { // Ad an animation to add an item
        if (setDisplay) {
            (item.classList.contains("dialog") ? item.parentElement : item).style.display = "block";
            setTimeout(() => { if (item.classList.contains("dialog")) item.parentElement.style.opacity = "1" }, 15);
        }
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
    document.getElementById("advancedFormat").addEventListener("input", () => { // Show or hide advanced codecs setting
        for (let item of document.querySelectorAll("[advanced]")) item.style.display = document.getElementById("advancedFormat").checked ? "flex" : "none";
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
            for (let item of pickerButtons) item.classList.add("disabled"); // Disable the "Select file" button until it has loaded
            if (!ffmpeg.isLoaded()) ffmpeg.load().then(() => {
                // ffmpeg is loaded, so the "File select" button can now be clicked
                if (!skipInfo) createAlert(currentTranslation.js.successful, "ffmpegSuccessful");
                for (let item of pickerButtons) item.classList.remove("disabled");
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
        if (!isElectron) { // ffmpeg will automatically be closed with Electron
            ffmpeg.exit();
            await loadFfmpeg(true);
        }
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
        fetch(`./translations/${langId}.json`).then((res) => {
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
    document.getElementById("quitProcess").addEventListener("click", () => resetFfmpeg());
    function customCommandManager({ type }) { // Create a div where the user can add custom arguments
        let container = document.createElement("div");
        let input = document.createElement("input"); // Textbox for the arguments
        input.type = "text";
        input.setAttribute("data-text", "");
        input.classList.add("isHovered", "fill");
        input.style.marginBottom = "15px";
        let button = document.createElement("div"); // Add argument button
        button.role = "button";
        button.textContent = currentTranslation.js.addArgument
        button.setAttribute("data-translate", "addArgument"); // Add a data-translate attribute since it'll be just like a HTML element
        button.classList.add("button", "isHovered");
        let args = document.createElement("div");
        args.style = "display: flex; overflow: auto";
        function addArg(text, restoreFromLocal) {
            let arg = document.createElement("div");
            arg.classList.add("argument", "isHovered");
            arg.textContent = text;
            arg.addEventListener("click", () => {
                arg.remove();
                localStorage.setItem(`ffmpegWeb-Args${type}`, JSON.stringify(Array.from(args.children).map(e => e.textContent))); // Save edits in LocalStorage to be restored
            });
            args.append(arg);
            if (!restoreFromLocal) localStorage.setItem(`ffmpegWeb-Args${type}`, JSON.stringify(Array.from(args.children).map(e => e.textContent))); // Save edits in LocalStorage to be restored, if they are not being restored from the LocalStorage
        }
        button.addEventListener("click", () => { addArg(input.value) });
        for (let item of JSON.parse(localStorage.getItem(`ffmpegWeb-Args${type}`) ?? "[]")) addArg(item, true);
        container.append(input, button, document.createElement("br"), args);
        return container;
    }
    document.getElementById("hwAccelSelect").addEventListener("change", () => { // The user has selected a new template
        let addValues = { // The custom arguments to add at the beginning
            intel: ["-init_hw_device", "qsv=hw"],
            nvidia: ["-vsync", "0", "-hwaccel", "cuda", "-hwaccel_output_format", "cuda"],
        }
        for (let item of document.getElementById("customHardwareId").querySelectorAll(".argument")) item.click(); // Delete all the previous elements
        if ((addValues[document.getElementById("hwAccelSelect").value] ?? "") !== "") {
            for (let item of addValues[document.getElementById("hwAccelSelect").value]) { // And add the new elements
                document.getElementById("customHardwareId").querySelector("input").value = item;
                document.getElementById("customHardwareId").querySelector(".button").click();
            }
        }
        if (document.querySelector(".vidSelect") !== null) document.querySelector(".vidSelect").click(); // Click again the video button to update the video codec
    });
    document.getElementById("newCustomUI").append(customCommandManager({ type: "custom" })); // UI for custom command
    document.getElementById("customHardwareId").append(customCommandManager({ type: "hwaccel" })); // UI for custom hw acceleration initializer
    document.getElementById("showExtraAcceleration").addEventListener("change", () => { // The checkbox that shows the custom hw acceleration initializer div
        document.getElementById("showExtraAcceleration").checked ? generalHelloAnimation(document.getElementById("customHardwareId"), "block") : generalByeAnimation(document.getElementById("customHardwareId"));
    })
    if (localStorage.getItem("ffmpegWeb-LastVersion") !== appVersion) {
        generalHelloAnimation(document.getElementById("updateDialog"), "block"); // Show updated version dialog
        localStorage.setItem("ffmpegWeb-LastVersion", appVersion); // Automatically dismiss the dialog if the user refreshes the page
    }
    document.getElementById("showUpdate").addEventListener("click", () => { // Show the update dialog after the user has requested it
        generalByeAnimation(document.getElementById("settings")); // Before doing that, close the settings dialog
        setTimeout(() => { // And then show the update dialog
            generalHelloAnimation(document.getElementById("updateDialog"), "block");
        }, 1060)
    })
    // Remember if the user has pressed "Shift" or not so that, if pressed, the file path can be copied (Electron only)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Shift") isShiftPressed = true;
    });
    document.addEventListener("keyup", (e) => {
        if (e.key === "Shift") isShiftPressed = false;
    })
    let getLastSelection = JSON.parse(localStorage.getItem("ffmpegWeb-LastSelection") ?? "[]"); // The value of inputs the last time the user has used ffmpeg-web
    fetch("./assets/settings.json").then((res) => res.json().then((json) => { // Get the JSON file that contains the CSS selectors of the inputs
        if (!json.isProductionReady) { // If the JSON file isn't adapted (probably dev server), quickly adapt it by deleting the comments and keeping only the CSS selectors
            for (let item in json.options) json.options[item] = json.options[item].map(e => e.ref);
        }
        for (let update in json.options) { // The "update" keys in the "Options" main key will contain all the properties to change in the HTML object
            for (let value of json.options[update]) { // The "value" string will contain the CSS selector for the item to update
                let dom = document.querySelector(value);
                if (dom === null) continue;
                dom.addEventListener(dom.type === "checkbox" || dom.tagName.toLowerCase() === "select" ? "change" : "input", () => { // Differentiate the event depending on the type of the input
                    let storageParse = JSON.parse(localStorage.getItem("ffmpegWeb-LastSelection") ?? "[]"); // Get again the selection, since it might be different from when the user opened ffmpeg-web (ex: if they have changed more than a property)
                    storageParse.findIndex(e => e.ref === value) !== -1 ? storageParse.find(e => e.ref === value).value = dom[update] : storageParse.push({ ref: value, value: dom[update], update: update }); // Update the property and, if it's not in the array, add it.
                    localStorage.setItem("ffmpegWeb-LastSelection", JSON.stringify(storageParse));
                })
            }
        }
    }))
    for (let type of ["video", "audio"]) { // Update the "Video codec" and "Audio codec" selectors so that, every time they're clicked, the preference will be stored
        let prevSelection = localStorage.getItem(`ffmpegWeb-Last${type}Used`);
        document.getElementById(`${type.substring(0, 3)}Output`).addEventListener("change", () => { // The switch to add a {type} track is checked
            if (document.querySelector(`[data-${type}val='${prevSelection}']`) !== null && localStorage.getItem("ffmpegWeb-StoreOnlySettings") === "a" && document.getElementById(`${type.substring(0, 3)}Output`).checked) document.querySelector(`[data-${type}val='${prevSelection}']`).click(); // If the selector exists, the user wants to remember the choice and it's enabled, click on the {type} codec button
        })
        for (let item of document.querySelectorAll(`[data-${type}val]`)) item.addEventListener("click", () => { localStorage.setItem(`ffmpegWeb-Last${type}Used`, item.getAttribute(`data-${type}val`)) }); // For each {type} codec button, update the LocalStorage with the current selection
    }
    for (let item of getLastSelection) if ((item.ref ?? "") !== "" && (item.value ?? "") !== "" && (item.update ?? "") !== "" && document.querySelector(item.ref) !== null && (localStorage.getItem("ffmpegWeb-StoreOnlySettings") === "a" || document.querySelector(item.ref).closest("#settings"))) { // If the three main properties in the array exist, the item exists in the DOM and a) the user wants to remember all the settings OR b) it's a setting, update the value
        let dom = document.querySelector(item.ref);
        dom[item.update] = item.value;
        for (let a of ["input", "change"]) dom.dispatchEvent(new Event(a));
    }
    document.getElementById("restorePrevious").addEventListener("change", () => { // The switch that permits to enable or disable the option to restore the previous conversion parameters
        document.getElementById("restorePrevious").checked ? localStorage.setItem("ffmpegWeb-StoreOnlySettings", "a") : localStorage.removeItem("ffmpegWeb-StoreOnlySettings");
    })
    document.getElementById("restorePrevious").checked = localStorage.getItem("ffmpegWeb-StoreOnlySettings") === "a";
})();