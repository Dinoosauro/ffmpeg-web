import { writable } from "svelte/store";
import ConversionOptions from "./TabOptions/ConversionOptions";
import Settings from "./TabOptions/Settings";

interface FileUrls {
    name: string,
    path: string
}
/**
 * If the video source must be copied or not.
 * This writable is used so that the UI can be updated with the required settings for video copy
 */
export let reEncodeVideo = writable<boolean>(ConversionOptions.videoTypeSelected === "copy");
/**
 * The progress of the [x] operation, from 0 to 1.
 */
export let conversionProgress: number[] = [0];
/**
 * The last 50 console strings of the [x] operation
 */
export let conversionText: string[][] = [[""]]
/**
 * An array for the operation [x] that contains the [current file that is being converted, the numer of files to convert, the name of the file that is being converted]
 */
export let conversionFileDone = writable<[number, number, string][]>([[0, 0, "NotStarted"]]);
/**
 * The ID of the current conversion
 */
export let currentConversionValue = writable<number>(0);
/**
 * A Date.now() of the last time the operation failed, so that the script can know if a conversion was successful, and if it's possible to fetch that file
 */
export let conversionFailedDate = writable<number>(0);
/**
 * The section that the user has chosen from the "What do you want to do?" slider
 */
export let applicationSection = writable<string>("MediaEnc");
/**
 * If [it's possible to use the slider values, the audio is lossless]
 */
export let audioBitrateSettings = writable<[boolean, boolean]>([false, false]);
/**
 * The selected image format, so that the "higher bitrate on the left" or the "lower bitrate on the left" cann be updated
 */
export let imageFormatSelected = writable<string>(ConversionOptions.imageTypeSelected);
/**
 * If a string (the file name) is provided, the "Overwrite file?" dialog will be shown.
 */
export let showOverwriteDialog = writable<string | undefined>(undefined);
/**
 * How the file should be saved to the file system
 */
export let currentStorageMethod = writable<string>(Settings.storageMethod);
/**
 * If the screensaver should be shown or not
 */
export let showScreensaver = writable<boolean>(false);
/**
 * The URLs and the file name of the exported content via a link
 */
export let fileUrls = writable<FileUrls[]>([]);
/**
 * If files should be saved in memory or not
 */
export let changedFileSave = writable<boolean>(Settings.fileSaver.keepInMemory);