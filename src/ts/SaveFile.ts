import type { IpcRenderer } from "electron/renderer";
import type JSZip from "jszip";
import handleFileStringForOS from "./HandleFileString";
import Settings from "./TabOptions/Settings";
import { fileUrls } from "./Writables";
import { get } from "svelte/store";

interface DirectoryPicker {
    id?: string,
    mode?: string
}
interface SaveFilePicker extends BaseFilePicker {
    id?: string,
}
interface BaseFilePicker {
    suggestedName?: string,
    types?: {
        description: string,
        accept: {}
    }[]
}

declare global {
    interface Window {
        showDirectoryPicker: ({ id, mode }: DirectoryPicker) => Promise<FileSystemDirectoryHandle>,
        showSaveFilePicker: ({ id, suggestedName, types }: SaveFilePicker) => Promise<FileSystemFileHandle>
        nativeOperations: IpcRenderer,
        isLocal: boolean | undefined,
        ffmpegWebVersion: string
    }
}

export default class FileSaver {
    #suggestedOutput: "handle" | "zip" | "link" = "link";
    #directoryHandle: FileSystemDirectoryHandle | undefined;
    #jsZip: JSZip | undefined;
    promise: Promise<void> | undefined;
    constructor(suggested?: "handle" | "zip" | string, handle?: FileSystemDirectoryHandle) {
        this.promise = new Promise(async (resolve) => {
            console.log(suggested);
            this.#directoryHandle = handle;
            switch (suggested) {
                case "handle": {
                    this.#suggestedOutput = handle instanceof FileSystemDirectoryHandle ? "handle" : "link";
                    break;
                }
                case "zip": {
                    this.#suggestedOutput = "zip";
                    const jszip = await import("jszip");
                    this.#jsZip = new jszip.default();
                    break;
                }
                default:
                    this.#suggestedOutput = "link";
                    break;
            }
            resolve();
        })
    }
    #sanitize = (str: string, allowSlash?: boolean) => {
        return str.replaceAll("<", "‹").replaceAll(">", "›").replaceAll(":", "∶").replaceAll("\"", "″").replaceAll("/", allowSlash ? "/" : "∕").replaceAll("\\", "∖").replaceAll("|", "¦").replaceAll("?", "¿").replaceAll("*", "")
    }
    write = async (file: Uint8Array, name: string, forceLink?: boolean) => {
        function downloadLink() {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([file]));
            Settings.fileSaver.keepInMemory && fileUrls.update((val) => {
                val.push({ name, path: a.href });
                return [...val];
            })
            console.log(get(fileUrls));
            a.download = name;
            a.click();
            if (Settings.fileSaver.revokeObjectUrl) URL.revokeObjectURL(a.href);
        }
        if (forceLink) { downloadLink(); return };
        switch (this.#suggestedOutput) {
            case "link": {
                downloadLink();
                break;
            }
            case "zip": {
                if (!this.#jsZip) throw new Error("Zip file must be initialized. Please await this.promise");
                this.#jsZip.file(this.#sanitize(name, true), file, { createFolders: true });
                break;
            }
            case "handle": {
                if (!this.#directoryHandle) throw new Error("If user rejects the showDirectoryPicker request, the suggestedOutput must be changed to link or zip.")
                const fileSplit = name.split("/");
                const fileName = fileSplit.pop() ?? crypto.randomUUID();
                let tempHandle = this.#directoryHandle;
                for (let remainingPath of fileSplit) tempHandle = await tempHandle.getDirectoryHandle(remainingPath, { create: true });
                const systemFile = await tempHandle.getFileHandle(this.#sanitize(fileName), { create: true });
                const writable = await systemFile.createWritable();
                await writable.write(file);
                await writable.close();
                break;
            }
        }
    }
    native = async (copyFile: string, suggestedName: string, firstFilePath?: string) => {
        if (firstFilePath) {
            if (firstFilePath.indexOf("\\") !== -1) firstFilePath = firstFilePath.substring(0, firstFilePath.lastIndexOf("\\") + 1);
            if (firstFilePath.indexOf("/") !== -1) firstFilePath = firstFilePath.substring(0, firstFilePath.lastIndexOf("/") + 1);
        }
        await window.nativeOperations.invoke("MoveFile", { from: copyFile, to: `${firstFilePath ?? ""}${suggestedName}` });
    }
    release = async () => {
        if (this.#suggestedOutput === "zip" && this.#jsZip) {
            const zip = await this.#jsZip.generateAsync({ type: "uint8array" });
            await this.write(zip, `FFmpegWeb-Zip-${Date.now()}.zip`, true);
        }
    }
}