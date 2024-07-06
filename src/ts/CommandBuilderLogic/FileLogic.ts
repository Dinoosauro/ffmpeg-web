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

/**
 * Convert media to a video or an audio
 * @param files the array of Files to elaborate
 * @param handle if provided, the files will be saved using the File System API
 */
export default async function FileLogic(pickedFiles: File[], handle?: FileSystemDirectoryHandle) {
    let outputFiles: File[][] = [];
    switch (ConversionOptions.conversionOption) {
        case 0: // Keep only the first file
            outputFiles = [[pickedFiles[0]]];
            break;
        case 1: // Add all files to the output one
            outputFiles = [[...pickedFiles]];
            break;
        case 2: // Add all the files that have the same name as the first file
            outputFiles = [pickedFiles.filter(file => file.name.substring(0, file.name.lastIndexOf(".")) === pickedFiles[0].name.substring(0, pickedFiles[0].name.lastIndexOf(".")))];
            break;
        case 3: { // Add all the files that have the same name (for every file)
            let fileNameComparison = pickedFiles.map((item) => { return { file: item, name: item.name.substring(0, item.name.lastIndexOf(".")) } });
            for (let i = 0; i < fileNameComparison.length; i++) {
                /**
                 * The array of files with the same name as fileNameComparison[i]
                 */
                let fileTemp = [];
                if (fileNameComparison[i] === undefined)
                    for (let x = i + 1; x < fileNameComparison.length; x++) {
                        if (fileNameComparison[x] === undefined) break; // By splicing a value, the array will "move to the left". So, it's possible that the length changes
                        if (fileNameComparison[i].name === fileNameComparison[x].name) {
                            fileTemp.push(fileNameComparison[x].file);
                            fileNameComparison.splice(x, 1);
                            x--; // Since it's spliced, the next value will be in the same position as the one that has been spliced.
                        }
                    }
                fileTemp.length !== 0 && outputFiles.push([fileNameComparison[i].file, ...fileTemp]);
            }
            break;
        }
        case 4: // Same command for every file
            for (let item of pickedFiles) outputFiles.push([item]);
            break;
    }
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