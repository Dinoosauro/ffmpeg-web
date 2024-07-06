import { writable } from "svelte/store";
import ConversionOptions from "./TabOptions/ConversionOptions";
import Settings from "./TabOptions/Settings";

interface FileUrls {
    name: string,
    path: string
}

export let reEncodeVideo = writable<boolean>(ConversionOptions.videoTypeSelected === "copy");
export let conversionProgress: number[] = [0];
export let conversionText: string[][] = [[""]]
export let conversionFileDone = writable<[number, number, string][]>([[0, 0, "NotStarted"]]);
export let currentConversionValue = writable<number>(0);
export let conversionFailedDate = writable<number>(0);
export let applicationSection = writable<string>("MediaEnc");
export let audioBitrateSettings = writable<[boolean, boolean]>([false, false]);
export let imageFormatSelected = writable<string>(ConversionOptions.imageTypeSelected);
export let showOverwriteDialog = writable<string | undefined>(undefined);
export let currentStorageMethod = writable<string>(Settings.storageMethod);
export let showScreensaver = writable<boolean>(false);
export let fileUrls = writable<FileUrls[]>([]);
export let changedFileSave = writable<boolean>(Settings.fileSaver.keepInMemory);