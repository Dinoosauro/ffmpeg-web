import type { FFmpegEvent } from "../../interfaces/ffmpeg";
import CreateTopDialog from "../CreateTopDialog";
import FfmpegHandler from "../FFmpegUtils/FFmpegBuilder";
import ffmpeg from "../FFmpegUtils/FFmpegClass";
import FFmpegFileNameHandler from "../FFmpegUtils/FFmpegHandleFileName";
import { getLang } from "../LanguageAdapt";
import FileSaver from "../SaveFile";
import ConversionOptions from "../TabOptions/ConversionOptions";
import EncoderInfo from "../TabOptions/EncoderInfo";
import Settings from "../TabOptions/Settings";
import { albumToVideoBackground, conversionFileDone } from "../Writables";

/**
 * Convert an audio file to a video one, displaying the album art and additional metadata
 * @param pickedFiles the array of Files to elaborate
 * @param handle if provided, the files will be saved using the File System API 
 */
export default async function AudioToVideoLogic(pickedFiles: File[], handle?: FileSystemDirectoryHandle) {
    /**
     * Copy the audioToVideo custom options so that, even if they are changed later, the conversion will continue to be the same.
     */
    const chosenConversionOptions = { ...ConversionOptions.audioToVideo };
    /**
     * Get the possible custom album art. If undefined, it hasn't been provided, so the music's album art will be used
     */
    const chosenImage = albumToVideoBackground.img;
    const [videoCodec, audioCodec] = [ConversionOptions.videoTypeSelected, ConversionOptions.audioTypeSelected];
    const obj = new ffmpeg(((Settings.version === "0.11.x" && chosenConversionOptions.disable011 ? "0.12.x" : Settings.version) as "0.11.x" | "0.12.x"));
    await obj.promise;
    const fileSave = new FileSaver(Settings.storageMethod, handle);
    /**
    * Get if multiple timestamps must be added or not
    */
    const multipleTimestamps = ConversionOptions.trimOptions.id === 2;
    CreateTopDialog(`${getLang("Started operation")} ${obj.operationId}! ${getLang(`Change the Operation ID from the "Conversion Status" tab to see the current progress.`)}`, "OperationStarted");
    /**
     * An object that will contain as its key the name of the metadata property, and as its value the content of the metadata property
     */
    let metadataObject: { [key: string]: string } = {};
    /**
     * The metadata that is being edited right now. This is kept so that, if there are some multi-line strings, the content will be merged automatically in the property with a new line ("\n")
     */
    let metadataBeingAdded = "";
    /**
     * The duration of the audio, in the HH:MM:ss.cc format (the one provided by FFmpeg). This will be used later to calculate the necessary time to loop.
     */
    let audioDuration = "";
    /**
     * Get the content from the console, so that, when metadata is written there, they'll be added in the JSON object
     * @param value the result of the FFmpegEvent
     */
    function consoleUpdate(value: FFmpegEvent) {
        if (value.detail.str.indexOf("Duration: ") !== -1) { // Found the audio duration
            const duration = value.detail.str.substring(value.detail.str.indexOf("Duration: ") + "Duration: ".length);
            audioDuration = duration.substring(0, duration.indexOf(","));
        }
        for (const str of value.detail.str.split("\n")) { // On native version, sometimes the passed content is more than one line, mergining multiple metadata fields. By splitting it for each newline, we make sure that all the metadata is available
            if (str.indexOf(" : ") !== -1 && str.startsWith("    ")) { // Metadata divider
                let key = str.substring(0, str.indexOf(":")).trim();
                if (metadataObject[key]) return; // Do not add again metadata that has already been added previously
                metadataBeingAdded = key || metadataBeingAdded;
                if (!metadataObject[metadataBeingAdded]) metadataObject[metadataBeingAdded] = ""; // Create the property if it doesn't exist, so that content can be added with concatenation
                metadataObject[metadataBeingAdded] += `${str.substring(str.indexOf(":") + 1).trim()}\n`;
            }
        }
    }
    const ffmpegOperation = new FfmpegHandler(obj, { addedFromInput: true, disableCut: true });
    for (const singleFile of pickedFiles) {
        // @ts-ignore
        document.addEventListener("consoleUpdate", consoleUpdate);
        conversionFileDone.update((val) => { // Update the writable that contains all the information about this conversion with the file progress and its name
            if (!val[obj.operationId] || val[obj.operationId][0] === 0) val[obj.operationId] = [0, pickedFiles.length, ""]; // Initialize the array entry: [file number, file length, file name]
            val[obj.operationId][0]++;
            val[obj.operationId][2] = singleFile.name;
            return [...val];
        })
        ffmpegOperation.addFiles([singleFile]);
        /**
         * A random UUID for the current image operation.
         */
        const randomImageIdentifier = crypto.randomUUID();
        /**
         * The image that'll be used as a base for the metadata canvases. Initially it can be a String or an Uint8Array, but after the first canvas generation it'll always be a Blob.
         */
        let imageResult = (await ffmpegOperation.start(["-i", FFmpegFileNameHandler(singleFile), `__FfmpegWebExclusive__img_${randomImageIdentifier}.png`], `__FfmpegWebExclusive__img_${randomImageIdentifier}.png`))[0].file as string | Uint8Array | Blob; // Extract the album art from the content
        ffmpegOperation.operationComplete();
        if (typeof imageResult === "string") { // FFmpeg native was used, so we need to read the content of the file
            const img = await obj.readFile(imageResult, true);
            if (img) imageResult = img;
        }
        /**
         * The container of all the Image Blobs that'll be added in the output video.
         */
        const metadataImages: Blob[] = [];
        if (chosenImage || !imageResult || !(imageResult instanceof Uint8Array)) { // If the user has chosen a custom image, or it wasn't possible to get the album art, we'll create a new Canvas with the custom image in the first case, a blank PNG in the second/third one.
            const canvas = document.createElement("canvas");
            canvas.width = chosenImage?.width ?? 1000;
            canvas.height = chosenImage?.height ?? 1000;
            if (chosenImage) { // We'll add now the custom image as a Blob
                const ctx = canvas.getContext("2d");
                ctx && ctx.drawImage(chosenImage, 0, 0, canvas.width, canvas.height);
                chosenConversionOptions.content.showImportedImage && metadataImages.push(await new Promise<Blob>((resolve) => {
                    canvas.toBlob((blob) => blob && resolve(blob));
                }))
            }
            imageResult = await new Promise((resolve) => { // We'll use this new canvas as a reference for the metadata. If a custom image has been provided, the canvas still has it drawn, so we'll use that. Otherwise, it'll be blank.
                canvas.toBlob((blob) => {
                    blob && resolve(blob);
                })
            })
        } else {
            imageResult = new Blob([imageResult]);
        }
        /**
         * The URL of the image used as a base for metadata editing
         */
        let objectUrl = URL.createObjectURL(imageResult as Blob);
        chosenConversionOptions.scale !== 1 && await new Promise<void>((resolve) => { // If the user wants to scale the image, we'll generate another canvas with the scaled width/height
            const img = new Image();
            img.onload = () => {
                const canvas = Object.assign(document.createElement("canvas"), { width: img.width * chosenConversionOptions.scale, height: img.height * chosenConversionOptions.scale });
                canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((async (blob) => {
                    if (blob) {
                        objectUrl = URL.createObjectURL(blob);
                        await obj.removeFile(`__FfmpegWebExclusive__img_${randomImageIdentifier}.png`);
                        await obj.writeFile(new File([blob], `__FfmpegWebExclusive__img_${randomImageIdentifier}.png`));
                    }
                    resolve();
                }))
            }
            img.onerror = () => resolve();
            img.src = objectUrl;
        })
        /**
         * The Canvas with the blurred image, that'll be used when writing metadata text.
         * Note: even if it might seem stupid to create all of these canvases, merging everything in a single canvas can cause lots of issues. By applying the filter only one time, we'll avoid applying heavy filters multiple times (especially on Safari, where a polyfill must be used).
         */
        const blurredImage = Object.assign(document.createElement("canvas"), { width: chosenImage?.width ?? 1000, height: chosenImage?.height ?? 1000 });
        const [width, height] = await new Promise<[number, number]>((resolve) => {
            const image = new Image();
            image.onload = () => {
                blurredImage.width = image.naturalWidth;
                blurredImage.height = image.naturalHeight;
                const ctx = blurredImage.getContext("2d");
                if (ctx) {
                    ctx.filter = "brightness(50%)";
                    ctx.drawImage(image, 0, 0, blurredImage.width, blurredImage.height); // First, let's draw the canvas only with the brightness change.
                    ctx.filter = "blur(8px)"; // Add it after brightness so that we don't have white corners
                    ctx.drawImage(blurredImage, 0, 0, blurredImage.width, blurredImage.height);
                }
                resolve([blurredImage.width, blurredImage.height]);
            }
            image.onerror = () => resolve([1000, 1000]);
            image.src = objectUrl;
        });
        // @ts-ignore | We no longer need to fetch console updates
        document.removeEventListener("consoleUpdate", consoleUpdate);
        for (const str in metadataObject) metadataObject[str] = metadataObject[str].substring(0, metadataObject[str].length - 1); // Delete \n from all the metadata fields
        chosenConversionOptions.saveTemp && await obj.writeFile(new File([JSON.stringify(metadataObject)], `__FfmpegWebExclusive__metadata_${randomImageIdentifier}.json`));
        /**
         * The canvas where the main metadata will be written
         */
        const generalInfoCanvas = Object.assign(document.createElement("canvas"), { width, height });
        const ctx = generalInfoCanvas.getContext("2d");
        if (!ctx) throw new Error("Failed obtaining Canvas context");
        /**
         * The content of the file that will tell FFmpeg the path of all the images to loop
         */
        let runFile = "";
        /**
         * The duration for each image
         */
        const duration = (chosenConversionOptions.ms / 1000).toFixed(3);
        if (chosenConversionOptions.content.showQuickInfo) { // The user actually wants the main info canvas, so we'll add it.
            ctx.drawImage(blurredImage, 0, 0, generalInfoCanvas.width, generalInfoCanvas.height);
            ctx.fillStyle = "#fafafa";
            ctx.font = `${height * 10 / 100}px ${chosenConversionOptions.font}`;
            let writeFrom = height * 13 / 100;
            for (const str of getTextToWrite(ctx, metadataObject["title"] ?? singleFile.name)) { // Go to a new line when needed
                ctx.fillText(str, width * 5 / 100, writeFrom);
                writeFrom += (height * 12 / 100);
            }
            writeFrom += (height * 3 / 100);
            ctx.font = `${height * 6 / 100}px ${chosenConversionOptions.font}`;
            for (const str of getTextToWrite(ctx, `${metadataObject["artist"] ?? ""} — ${metadataObject["album"] ?? ""}`)) {
                ctx.fillText(str, width * 5 / 100, writeFrom);
                writeFrom += (height * 8 / 100);
            };
            await obj.writeFile(new File([await new Promise<Blob>((resolve) => generalInfoCanvas.toBlob((blob) => blob && resolve(blob)))], `__FfmpegWebExclusive__MainImg_${randomImageIdentifier}.png`));
            runFile += `file '__FfmpegWebExclusive__MainImg_${randomImageIdentifier}.png'\nduration ${duration}`;
        }
        ctx.font = `${height * 6 / 100}px ${chosenConversionOptions.font}`;
        /**
         * Generate a canvas with a title and the top and content at the bottom. This is currently used to write the metadata of every field.
         * @param text the array of string that needs to be written in each line
         * @param title the name of the property (that'll be the title of the image)
         */
        async function writeSingleAlbum(text: string[], title: string) {
            const canvas = Object.assign(document.createElement("canvas"), { width, height });
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Failed 2d context fetching");
            ctx.drawImage(blurredImage, 0, 0, canvas.width, canvas.height); // Add the blurred image as the background
            ctx.fillStyle = "#fafafa";
            ctx.font = `${height * 5 / 100}px ${chosenConversionOptions.font}`; // Title customization
            let startWritingHere = 0;
            for (const titleStr of getTextToWrite(ctx, title)) { // Divide the title in multiple lines if it cannot be displayed on one line
                startWritingHere += canvas.height * 7 / 100;
                ctx.fillText(titleStr, canvas.width * 5 / 100, startWritingHere); // Write the title
            }
            ctx.font = `${height * 3.5 / 100}px ${chosenConversionOptions.font}`; // Description customization
            while (text.length !== 0) {
                startWritingHere += canvas.height * 6.5 / 100;
                if (startWritingHere > canvas.height) { // Time to create a new canvas
                    metadataImages.push(await new Promise((resolve) => canvas.toBlob(blob => blob && resolve(blob)))); // Store this canvas in the images
                    await writeSingleAlbum(text, title); // And create a new canvas. The lines that have alredy been written are automatically deleted when shifting the text.
                    return; // Avoid writing anything else
                }
                /**
                 * The text that should be written in the canvas.
                 */
                const writeThis = text.shift();
                writeThis && ctx.fillText(writeThis, canvas.width * 5 / 100, startWritingHere);
            }
            metadataImages.push(await new Promise((resolve) => canvas.toBlob(blob => blob && resolve(blob)))); // Add the image to the Blob array
        }
        if (chosenConversionOptions.content.showMetadataRecap) for (const key in metadataObject) await writeSingleAlbum(getTextToWrite(ctx, metadataObject[key]), key); // Create a new image for every metadata
        if (chosenConversionOptions.content.showAlbumArt) runFile += `${runFile.length === 0 ? "" : "\n"}file '__FfmpegWebExclusive__img_${randomImageIdentifier}.png'\nduration ${duration}`; // If the user wants to show the album art, add it to the runFile.
        metadataImages.push(metadataImages[metadataImages.length - 1]); // We'll add two times the same last image so that it's displayed in the loop. I don't know why FFmpeg needs this, but otherwise it doesn't work.
        for (let i = 0; i < metadataImages.length; i++) {
            obj.writeFile(new File([metadataImages[i]], `__FfmpegWebExclusive__${i}_${randomImageIdentifier}.png`));
            runFile += `${runFile.length === 0 ? "" : "\n"}file '__FfmpegWebExclusive__${i}_${randomImageIdentifier}.png'\nduration ${duration}`;
        }
        obj.writeFile(new File([runFile], `__FfmpegWebExclusive__run${randomImageIdentifier}.txt`));
        /**
         * Get information about hardware acceleration for the output video
         */
        const hardwareAcceleration = ffmpegOperation.hardwareAcceleration(false, { video: chosenConversionOptions.videoBitrate });
        // Get information about hardware acceleration for the output codec
        const encoderInfo = EncoderInfo.video.get(videoCodec);
        const outputVideoInfo = encoderInfo ? encoderInfo[ffmpegOperation.ffmpeg.native ? Settings.hardwareAcceleration.type as "nvidia" : "NoHardwareAcceleration"] ?? videoCodec : "libx264";
        // Get information about hardware acceleration for the H264 codec, that'll be used for the looped video.
        const h264Encoder = EncoderInfo.video.get("libx264");
        const h264EncoderOutput = h264Encoder ? h264Encoder[ffmpegOperation.ffmpeg.native ? Settings.hardwareAcceleration.type as "nvidia" : "NoHardwareAcceleration"] ?? "libx264" : "libx264";
        try {
            /**
             * The number of times the loop should be repeated so that it's the same of the song
             */
            let finalLoopDuration = 0;
            if (chosenConversionOptions.useDuration) { // Calculate it only if the user is using this method
                let audioSeconds = 0;
                const audioDurationSplit = audioDuration.split(/[:.]/);
                for (let i = 0; i < audioDurationSplit.length; i++) audioSeconds += (+(audioDurationSplit[i]) * (i === 0 ? 3600 : i === 1 ? 60 : 1));
                finalLoopDuration = audioSeconds / Math.floor(runFile.split("\n").length / 2);
            }
            await ffmpegOperation.start([...hardwareAcceleration.beginning, "-f", "concat", "-safe", "0", "-i", `__FfmpegWebExclusive__run${randomImageIdentifier}.txt`, chosenConversionOptions.fps === -1 ? "-vsync" : "-vf", chosenConversionOptions.fps === -1 ? "vfr" : `fps=${chosenConversionOptions.fps}`, "-pix_fmt", "yuv420p", "-vcodec", h264EncoderOutput, "-b:v", chosenConversionOptions.videoBitrate, ...hardwareAcceleration.after, `__FfmpegWebExclusive__FirstOutput_${randomImageIdentifier}.mp4`], undefined, true); // Start the ffmpeg process: create a video with all the images 
            ffmpegOperation.operationComplete();
            await ffmpegOperation.start(["-stream_loop", chosenConversionOptions.useDuration ? Math.ceil(finalLoopDuration).toString() : "-1", "-i", `__FfmpegWebExclusive__FirstOutput_${randomImageIdentifier}.mp4`, ...(chosenConversionOptions.useDuration ? [] : ["-i", FFmpegFileNameHandler(singleFile), "-map_metadata", "1"]), "-shortest", "-map", "0:v:0", ...(chosenConversionOptions.useDuration ? [] : ["-map", "1:a:0"]), "-vcodec", "copy", `__FfmpegWebExclusive__SecondOutput_${randomImageIdentifier}_.mp4`], undefined, true); // Start the ffmpeg process: loop the video with for the number of times needed. Note that, if the seconds method is being used, we need to ceil the number since ffmpeg accepts only Int64 and not floating values.
            ffmpegOperation.operationComplete();
            const start = await ffmpegOperation.start([...hardwareAcceleration.beginning, "-i", `__FfmpegWebExclusive__SecondOutput_${randomImageIdentifier}_.mp4`, "-i", FFmpegFileNameHandler(singleFile), "-map_metadata", "1", "-vcodec", outputVideoInfo, "-acodec", audioCodec, "-b:a", chosenConversionOptions.audioBitrate, "-map", "0:v:0", "-map", "1:a:0", "-b:v", chosenConversionOptions.videoBitrate, ...(outputVideoInfo !== "copy" ? hardwareAcceleration.after : []), ...(chosenConversionOptions.useInterleaveDelta ? ["-max_interleave_delta", "0"] : []), ...(chosenConversionOptions.useDuration ? ["-to", audioDuration] : []), `__FfmpegWebExclusive__ThirdOutput_${randomImageIdentifier}_.${chosenConversionOptions.extension}`]) // Start the ffmpeg process: finally, we'll add the audio and transcode it to the output codec. If the seconds method is being used, it'll be trimmed to the audio duration to avoid having a video longer than the audio.
            /**
             * If the output file is a Uint8Array, the result is from FFmpeg WebAssembly, and it'll be written using standard JavaScript APIs. Otherwise, it's a path for the native FFmpeg process, and it'll be moved using Node's FS API.
             */
            for (const { file, extension, suggestedFileName } of start) file instanceof Uint8Array ? await fileSave.write(file, multipleTimestamps ? suggestedFileName : `${FFmpegFileNameHandler(singleFile).substring(0, FFmpegFileNameHandler(singleFile).lastIndexOf("."))}.${extension}`) : await fileSave.native(file, multipleTimestamps ? suggestedFileName : `${singleFile.name.substring(0, singleFile.name.lastIndexOf("."))}.${extension}`, singleFile.path);
        } catch (ex) {
            console.error(ex);
            break;
        }
        ffmpegOperation.operationComplete(); // Delete the downloaded items from the list
        for (const file of [FFmpegFileNameHandler(singleFile), ...metadataImages.map((item, i) => `__FfmpegWebExclusive__${i}_${randomImageIdentifier}.png`), `__FfmpegWebExclusive__img_${randomImageIdentifier}.png`, `__FfmpegWebExclusive__run${randomImageIdentifier}.txt`, `__FfmpegWebExclusive__FirstOutput_${randomImageIdentifier}.mp4`, ...(chosenConversionOptions.saveTemp ? [`__FfmpegWebExclusive__metadata_${randomImageIdentifier}.json`] : []), ...(chosenConversionOptions.content.showQuickInfo ? [`__FfmpegWebExclusive__MainImg_${randomImageIdentifier}.png`] : [])]) { // Most of the files that need to be deleted. If the user wants to save temporary files, they'll be downloaded.
            if (chosenConversionOptions.saveTemp && FFmpegFileNameHandler(singleFile) !== file && file !== `__FfmpegWebExclusive__run${randomImageIdentifier}.txt`) {
                const tempFile = await obj.readFile(file);
                const title = `[${fileSave.sanitize(singleFile.name)}] ${file.replace("__FfmpegWebExclusive__", "").replace(`_${randomImageIdentifier}`, "")}`;
                tempFile ? await fileSave.write(tempFile, title) : await fileSave.native(file, title, singleFile.path);
            }
            await obj.removeFile(file); // And remove the source files from the FS.
        }
        await obj.removeFile(`__FfmpegWebExclusive__SecondOutput_${randomImageIdentifier}_.mp4`); // Remove the looped video
        await obj.removeFile(`__FfmpegWebExclusive__ThirdOutput_${randomImageIdentifier}_.${chosenConversionOptions.extension}`); // Remove the final video
        Settings.exit.afterFile && obj.exit(); // Exit from FFmpeg
        /**
         * Restore the metadata objects so that they can be used for the next conversion.
         */
        metadataObject = {};
        metadataBeingAdded = "";
    }
    await fileSave.release(); // Save .zip file if necessary
    !Settings.exit.afterFile && obj.exit();
    conversionFileDone.update((val) => {
        val[obj.operationId][0] = -1; // With "-1", the conversion is marked as completed
        return [...val];
    })
    CreateTopDialog(`${getLang("Completed operation")} ${obj.operationId}`, "OperationCompleted");
}

/**
 * Make sure the text doesn't overflow in the canvas by splitting it into a string array, one string for each line.
 * @param context the CanvasRenderingContext2D that'll be used for calculating the width of the text
 * @param source the text to write
 * @returns a string[], where each line should stay in the canvas.
 */
function getTextToWrite(context: CanvasRenderingContext2D, source: string) {
    const output = [""];
    for (const text of source.split("\n")) {
        const splitSpaces = text.split(" ");
        for (const string of splitSpaces) {
            const suggested = `${output[output.length - 1]}${string} `;
            if (context.measureText(suggested).width > (context.canvas.width * 95 / 100)) output[output.length] = `${string} `; else output[output.length - 1] = suggested;
        }
        output.push("");
    }
    return output;
}