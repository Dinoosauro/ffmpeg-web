import CreateTopDialog from "../CreateTopDialog";
import FfmpegHandler from "../FFmpegUtils/FFmpegBuilder";
import ffmpeg from "../FFmpegUtils/FFmpegClass";
import FFmpegFileNameHandler from "../FFmpegUtils/FFmpegHandleFileName";
import { getLang } from "../LanguageAdapt";
import FileSaver from "../SaveFile";
import MetadataOptions from "../TabOptions/MetadataOptions";
import Settings from "../TabOptions/Settings";
import { conversionFileDone } from "../Writables";

/**
 * Add metadata to the provided files
 * @param files the array of Files to elaborate
 * @param handle if provided, the files will be saved using the File System API
 */
export default async function MetadataLogic(files: File[], handle?: FileSystemDirectoryHandle) {
    /**
     * The index of the first custom item
     */
    const customEnabled = MetadataOptions.metadataAdded.findIndex(item => item.custom) !== -1;
    /**
     * The array of metadata commands to pass to FFmpeg
     */
    const getArgs = MetadataOptions.metadataAdded.map(item => [`-metadata`, `${item.key}=${item.value}`]).flat();
    /**
     * See "FileLogic" for documentation of each step
     */
    const obj = new ffmpeg(Settings.version as "0.11.x");
    await obj.promise;
    CreateTopDialog(`${getLang("Started operation")} ${obj.operationId}! ${getLang(`Change the Operation ID from the "Conversion Status" tab to see the current progress.`)}`, "OperationStarted");
    const fileSave = new FileSaver(Settings.storageMethod, handle);
    await fileSave.promise;
    for (let file of files) {
        conversionFileDone.update((val) => {
            if (!val[obj.operationId]) val[obj.operationId] = [0, files.length, ""];
            val[obj.operationId][0]++;
            val[obj.operationId][2] = file.name;
            return [...val];
        })
        const handler = new FfmpegHandler(obj, { addedFromInput: true, albumArtName: MetadataOptions.customAlbumArt ? FFmpegFileNameHandler(MetadataOptions.customAlbumArt) : undefined });
        handler.addFiles([file, ...(MetadataOptions.customAlbumArt ? [MetadataOptions.customAlbumArt] : [])]);
        const extension = file.name.substring(file.name.lastIndexOf(".") + 1);
        try {
            for (let result of await handler.start([`-i`, FFmpegFileNameHandler(file), `-codec`, `copy`, ...(MetadataOptions.keepCurrentMetadata ? [] : ["-map_metadata", "-1"]), ...(customEnabled && !MetadataOptions.keepMP4Thumbnail && (extension === "alac" || extension === "m4a" || extension === "mp4" || extension === "m4v") ? ["-movflags", "use_metadata_tags"] : []), ...(MetadataOptions.deleteVideo ? [`-vn`] : []), ...getArgs, `__FfmpegWebExclusive__0__$ReplaceWithUUID.${extension}`], FFmpegFileNameHandler(file))) result.file instanceof Uint8Array ? await fileSave.write(result.file, result.suggestedFileName) : await fileSave.native(result.file, result.suggestedFileName, file.path); // Add $ReplaceWithUUID so that duplicates won't be created in case of multiple timestamps
        } catch (ex) {
            console.error(ex);
            break;
        }
        handler.operationComplete();
        await handler.ffmpeg.removeFile(file);
        Settings.exit.afterFile && obj.exit();
    }
    await fileSave.release();
    !Settings.exit.afterFile && obj.exit();
    conversionFileDone.update((val) => {
        val[obj.operationId][0] = -1;
        return [...val];
    })
    CreateTopDialog(`${getLang("Completed operation")} ${obj.operationId}`, "OperationCompleted");

}