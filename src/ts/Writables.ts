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
/**
 * The version of FFmpeg that is being used, so that more options can be shown depending on it
 */
export let ffmpegVersionUsed = writable<string>(Settings.version);
/**
 * The Date.now() of when the screensaver was enabled, so that it cannot be dismissed before 1s
 */
export let screensaverActivationTime = writable<number>(Date.now());
/**
 * If the "Installation" card, that provides information on how to install ffmpeg-web on Electron or as a Progressive Web App, should be shown
 */
export let showInstallationCard = writable<boolean>(Settings.showInstallationPrompt);
/**
 * Show the "ffmpeg-web has been updated" dialog
 */
export let updateDialogShown = writable<boolean>((localStorage.getItem("ffmpegWeb-LastVersion") || window.ffmpegWebVersion) !== window.ffmpegWebVersion); // Set the current version
/**
 * If the user should be able to change the buffer size of the encoder
 */
export let showBufSize = writable<boolean>(Settings.hardwareAcceleration.type === "vaapi" || Settings.hardwareAcceleration.type === "nvidia" || Settings.hardwareAcceleration.type === "amd");
localStorage.setItem("ffmpegWeb-LastVersion", window.ffmpegWebVersion);
/**
 * The keys that are being pressed in the document
 */
export let currentlyPressedKeys = writable<string[]>([]);
window.addEventListener("keydown", (e) => currentlyPressedKeys.update(prev => {
    const newPrev = [...prev, e.key.toLowerCase()];
    newPrev.indexOf("meta") !== -1 && newPrev.indexOf("p") !== -1 && e.preventDefault(); // Disable printing (since it's useless on this website, and it would interfere with the "Show settings" shortcut)
    return newPrev
}));
window.addEventListener("keyup", (e) => currentlyPressedKeys.update(prev => {
    prev.splice(prev.indexOf(e.key.toLowerCase()), 1);
    return [...prev];
}));
/**
 * The object that'll contain the custom image for the "Audio to video section", if the user has chosen to use it.
 */
export let albumToVideoBackground: { img: HTMLImageElement | undefined } = { img: undefined };
