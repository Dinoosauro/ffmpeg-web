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
/**
 * Save, or move (if using native version), a file
 */
export default class FileSaver {
    #suggestedOutput: "handle" | "zip" | "link" = "link";
    #directoryHandle: FileSystemDirectoryHandle | undefined;
    #jsZip: JSZip | undefined;
    promise: Promise<void> | undefined;
    /**
     * Specify how the file should be saved. Note that you also need to await `this.promise` before starting using it.
     * @param suggested the suggested download method (`handle`, `zip`, `link`)
     * @param handle the FileSystemDirectoryHandle for FS operation
     */
    constructor(suggested?: "handle" | "zip" | string, handle?: FileSystemDirectoryHandle) {
        this.promise = new Promise(async (resolve) => {
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
    /**
     * Replace the unsafe characters of a string
     * @param str the unsanitized string
     * @param allowSlash if the / shouldn't be replaced
     * @returns the sanitized string
     */
    #sanitize = (str: string, allowSlash?: boolean) => {
        return str.replaceAll("<", "‹").replaceAll(">", "›").replaceAll(":", "∶").replaceAll("\"", "″").replaceAll("/", allowSlash ? "/" : "∕").replaceAll("\\", "∖").replaceAll("|", "¦").replaceAll("?", "¿").replaceAll("*", "")
    }
    /**
     * Write, or start downloading, a file
     * @param file the Uint8Array of the file to write
     * @param name the file name
     * @param forceLink if a link must be downloaded, even if the default settings is `handle` or `zip`
     */
    write = async (file: Uint8Array, name: string, forceLink?: boolean) => {
        function downloadLink() {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([file]));
            Settings.fileSaver.keepInMemory && fileUrls.update((val) => {
                val.push({ name, path: a.href });
                return [...val];
            })
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
    /**
     * Move a file from a directory to another (native-only)
     * @param copyFile the path of the file to copy
     * @param suggestedName the suggested name to the file
     * @param firstFilePath the path of the first file, that'll be used to get the directory where the file should be copied. If it's not provided, only the `copyFile` path will be used.
     */
    native = async (copyFile: string, suggestedName: string, firstFilePath?: string) => {
        if (firstFilePath) {
            if (firstFilePath.indexOf("\\") !== -1) firstFilePath = firstFilePath.substring(0, firstFilePath.lastIndexOf("\\") + 1);
            if (firstFilePath.indexOf("/") !== -1) firstFilePath = firstFilePath.substring(0, firstFilePath.lastIndexOf("/") + 1);
        }
        await window.nativeOperations.invoke("MoveFile", { from: copyFile, to: `${firstFilePath ?? ""}${suggestedName}` });
    }
    /**
     * Save the zip file
     */
    release = async () => {
        if (this.#suggestedOutput === "zip" && this.#jsZip) {
            const zip = await this.#jsZip.generateAsync({ type: "uint8array" });
            await this.write(zip, `FFmpegWeb-Zip-${Date.now()}.zip`, true);
        }
    }
}