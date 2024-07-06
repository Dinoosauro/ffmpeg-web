import ConversionOptions from "../TabOptions/ConversionOptions";
import ffmpeg from "../FFmpegUtils/FFmpegClass";
import FfmpegHandler from "../FFmpegUtils/FFmpegBuilder";
import { conversionFileDone, conversionProgress, conversionText } from "../Writables";
import FileSaver from "../SaveFile";
import Settings from "../TabOptions/Settings";
import TopDialog from "../../lib/UIElements/TopDialog.svelte";
import CreateTopDialog from "../CreateTopDialog";
import { getLang } from "../LanguageAdapt";
import FFmpegFileNameHandler from "../FFmpegUtils/FFmpegHandleFileName";
import FileDivider from "./FileDivider";

/**
 * Convert media to a video or an audio
 * @param files the array of Files to elaborate
 * @param handle if provided, the files will be saved using the File System API
 */
export default async function FileLogic(pickedFiles: File[], handle?: FileSystemDirectoryHandle) {
    const outputFiles = FileDivider(pickedFiles);
    const obj = new ffmpeg(Settings.version as "0.11.x");
    await obj.promise;
    CreateTopDialog(`${getLang("Started operation")} ${obj.operationId}! ${getLang(`Change the Operation ID from the "Conversion Status" tab to see the current progress.`)}`, "OperationStarted");
    const ffmpegOperation = new FfmpegHandler(obj);
    /**
     * Get if multiple timestamps must be added or not
     */
    const multipleTimestamps = ConversionOptions.trimOptions.id === 2;
    const fileSave = new FileSaver(Settings.storageMethod, handle);
    await fileSave.promise;
    for (let singleOperation of outputFiles) {
        conversionFileDone.update((val) => { // Update the writable that contains all the information about this conversion with the file progress and its name
            if (!val[obj.operationId] || val[obj.operationId][0] === 0) val[obj.operationId] = [0, outputFiles.length, ""]; // Initialize the array entry: [file number, file length, file name]
            val[obj.operationId][0]++;
            val[obj.operationId][2] = singleOperation[0].name;
            return [...val];
        })
        ffmpegOperation.addFiles(singleOperation); // Add files in the FFmpeg WebAssembly's virtual FS.
        const build = ffmpegOperation.build(); // Get the output script
        try {
            const start = await ffmpegOperation.start(build); // And start the FFmpeg process
            /**
             * If the output file is a Uint8Array, the result is from FFmpeg WebAssembly, and it'll be written using standard JavaScript APIs. Otherwise, it's a path for the native FFmpeg process, and it'll be moved using Node's FS API.
             */
            for (const { file, extension, suggestedFileName } of start) file instanceof Uint8Array ? await fileSave.write(file, multipleTimestamps ? suggestedFileName : `${FFmpegFileNameHandler(singleOperation[0]).substring(0, FFmpegFileNameHandler(singleOperation[0]).lastIndexOf("."))}.${extension}`) : await fileSave.native(file, multipleTimestamps ? suggestedFileName : `${singleOperation[0].name.substring(0, singleOperation[0].name.lastIndexOf("."))}.${extension}`, singleOperation[0].path);
        } catch (ex) {
            console.error(ex);
            break;
        }
        ffmpegOperation.operationComplete(); // Delete the downloaded items from the list
        for (let file of singleOperation) await obj.removeFile(file); // And remove the source files from the FS.
        Settings.exit.afterFile && obj.exit(); // Exit from FFmpeg
    }
    await fileSave.release(); // Save .zip file if necessary
    !Settings.exit.afterFile && obj.exit();
    conversionFileDone.update((val) => {
        val[obj.operationId][0] = -1; // With "-1", the conversion is marked as completed
        return [...val];
    })
    CreateTopDialog(`${getLang("Completed operation")} ${obj.operationId}`, "OperationCompleted");
}