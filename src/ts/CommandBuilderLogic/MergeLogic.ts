import CreateTopDialog from "../CreateTopDialog";
import FfmpegHandler from "../FFmpegUtils/FFmpegBuilder";
import ffmpeg from "../FFmpegUtils/FFmpegClass";
import FFmpegFileNameHandler from "../FFmpegUtils/FFmpegHandleFileName";
import { getLang } from "../LanguageAdapt";
import FileSaver from "../SaveFile";
import MergeOptions from "../TabOptions/MergeOptions";
import Settings from "../TabOptions/Settings";
import { conversionFileDone } from "../Writables";

/**
 * Merge the provided files in a single one
 * @param files the array of Files to elaborate
 * @param handle if provided, the output file will be saved using the File System API
 */

export default async function MergeLogic(files: File[], handle?: FileSystemDirectoryHandle) {
    const obj = new ffmpeg(Settings.version as "0.11.x");
    await obj.promise;
    CreateTopDialog(`${getLang("Started operation")} ${obj.operationId}! ${getLang(`Change the Operation ID from the "Conversion Status" tab to see the current progress.`)}`, "OperationStarted");
    /**
     * See "FileLogic" for the documentation of each step of the FFmpeg conversion
     */
    await obj.load();
    conversionFileDone.update((val) => {
        val[obj.operationId] = [1, 1, MergeOptions.fileName];
        return [...val];
    })
    obj.writeFile(new File([files.map(e => `file '${FFmpegFileNameHandler(e).replace(/\'/g, "'\\''")}'`).join("\n")], "__FfmpegWebExclusive__Merge.txt"), true); // Create the txt file with all the file names to join
    const merge = new FfmpegHandler(obj, { albumArtReEncode: MergeOptions.keepAlbumArt, suggestedFileExtension: MergeOptions.fileName.substring(MergeOptions.fileName.lastIndexOf(".") + 1) });
    merge.addFiles(files);
    const fileSave = new FileSaver(Settings.storageMethod, handle);
    await fileSave.promise;
    for (let { file } of await merge.start(["-f", "concat", "-safe", "0", "-i", "__FfmpegWebExclusive__Merge.txt", "-c", "copy", "-map_metadata", "0", ...(MergeOptions.fileName.endsWith(".m4a") ? ["-vn"] : [])], MergeOptions.fileName)) file instanceof Uint8Array ? await fileSave.write(file, MergeOptions.fileName) : await fileSave.native(file, MergeOptions.fileName, files[0].path);
    merge.operationComplete();
    for (let file of files) await obj.removeFile(FFmpegFileNameHandler(file));
    await obj.removeFile("__FfmpegWebExclusive__Merge.txt");
    await fileSave.release();
    conversionFileDone.update((val) => {
        val[obj.operationId][0] = -1;
        return [...val];
    })
    obj.exit();
    CreateTopDialog(`${getLang("Completed operation")} ${obj.operationId}`, "OperationCompleted");
}