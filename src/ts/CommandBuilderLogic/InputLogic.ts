import ffmpeg from "../FFmpegUtils/FFmpegClass";
import FFmpegFileNameHandler from "../FFmpegUtils/FFmpegHandleFileName";
import FfmpegHandler from "../FFmpegUtils/FFmpegBuilder";
import InputOptions from "../TabOptions/InputOptions";
import FileSaver from "../SaveFile";
import Settings from "../TabOptions/Settings";
import CreateTopDialog from "../CreateTopDialog";
import { conversionFileDone } from "../Writables";
import { getLang } from "../LanguageAdapt";

/**
 * Handle custom FFmpeg command
 * @param files the array of Files to elaborate
 * @param handle if provided, the files will be saved using the File System API
 */
export default async function InputLogic(files: File[], handle?: FileSystemDirectoryHandle) {
    let getVal = InputOptions.val.map(item => item.display);
    for (let i = 0; i < getVal.length; i++) {
        /**
         * The easiest thing would be to look if a str starts with $input, and then replacing it.
         * However, I don't know if there's some strange ffmpeg syntax where the input name can be used as part of another string. So, I made that $input[x] is replaced everywhere
         * Note that this is done as a recursive function so that the position of the match is updated at every edit, while in a `matchAll` the index would be the same even after the string edit.
         */
        function patch() {
            const matchedStr = /\$input\[/gi.exec(getVal[i]);
            if (matchedStr === null || matchedStr.index === undefined) return;
            const getNumber = getVal[i].substring(matchedStr.index + "$input[".length);
            const addTo = getNumber.indexOf("]");
            const outputNumber = +getNumber.substring(0, addTo);
            if (!isNaN(outputNumber) && files[outputNumber]) getVal[i] = `${getVal[i].substring(0, matchedStr.index)}${FFmpegFileNameHandler(files[outputNumber])}${getVal[i].substring(matchedStr.index + "$input[".length + addTo + 1)}`;
            patch(); // Check if there are other $input[x] in the string
        }
        patch();
        getVal[i] = getVal[i].replace(/\$dollar/gi, "$");
    }
    const obj = new ffmpeg(Settings.version as "0.11.x");
    await obj.promise;
    conversionFileDone.update((val) => {
        val[obj.operationId] = [1, 1, getVal[getVal.length - 1]]; // Only a file will be elaborated
        return [...val];
    })

    CreateTopDialog(`${getLang("Started operation")} ${obj.operationId}! ${getLang(`Change the Operation ID from the "Conversion Status" tab to see the current progress.`)}`, "OperationStarted");
    /**
     * Everything here is basically the same as "FileLogic" and "ImageLogic". I won't copy again the documentation
     */
    const logic = new FfmpegHandler(obj, { addedFromInput: true });
    logic.addFiles(files);
    const fileSave = new FileSaver(localStorage.getItem("ffmpegWeb-DefaultStorageMethod") ?? "link", handle);
    await fileSave.promise;
    for (let { file, suggestedFileName } of await logic.start(getVal)) file instanceof Uint8Array ? await fileSave.write(file, suggestedFileName) : await fileSave.native(file, suggestedFileName, files[0].path);
    logic.operationComplete();
    for (let file of files) await logic.ffmpeg.removeFile(FFmpegFileNameHandler(file));
    await fileSave.release();
    conversionFileDone.update((val) => {
        val[obj.operationId][0] = -1;
        return [...val];
    })
    obj.exit();
    CreateTopDialog(`${getLang("Completed operation")} ${obj.operationId}`, "OperationCompleted");

}