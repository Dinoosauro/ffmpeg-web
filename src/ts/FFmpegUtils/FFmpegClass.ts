import type { FFmpegVersions, FfmpegConsole, FfmpegUrls } from "../../interfaces/ffmpeg";
import { conversionFailedDate, conversionProgress, conversionText, currentConversionValue, showOverwriteDialog } from "../Writables";
import type { IpcRendererEvent } from "electron";
import FFmpegFileNameHandler from "./FFmpegHandleFileName";
import handleFileStringForOS from "../HandleFileString";
import Settings from "../TabOptions/Settings";
/**
 * An array that contains the number of seconds of each ffmpeg conversion
 */
const totalSecondsFetched: number[] = [];
/**
 * Update the console by passing a string
 * @param operation the ID of the operation to update
 * @param str the string to add in the console
 */
function updateConsole({ operation, str }: FfmpegConsole) {
    if (typeof str !== "string") return;
    if (!conversionText[operation]) conversionText[operation] = []; // Create a placeholder container
    if (conversionText[operation].length > 300) conversionText[operation].splice(0, 1);
    conversionText[operation].push(str);
    /**
     * Convert a FFmpeg video duration string to the number of seconds
     * @param getDuration the hh:MM:ss.ff string
     * @returns the total number of seconds of that string
     */
    function getSecondsFromFfmpeg(getDuration: string) {
        getDuration = getDuration.substring(0, getDuration.indexOf("."));
        let [hour, minute, second] = getDuration.split(":");
        return (+hour * 3600) + (+minute * 60) + +second;
    }
    if (str.indexOf("Duration: ") !== -1) { // Update the total length of the file
        totalSecondsFetched[operation] = getSecondsFromFfmpeg(str.substring(str.indexOf("Duration: ") + "Duration: ".length));
    } else if (totalSecondsFetched[operation] && str.indexOf("time=") !== -1) { // Found the time ffmpeg has encoded. Calculate the ratio, and then trigger the "setProcess" event. 
        conversionProgress[operation] = getSecondsFromFfmpeg(str.substring(str.indexOf("time=") + "time=".length)) / totalSecondsFetched[operation];
    }
    document.dispatchEvent(new CustomEvent("consoleUpdate", { detail: { str, operation, progress: conversionProgress[operation] } }));
}
if (typeof window.nativeOperations !== "undefined") { // Setup Electron messages
    window.nativeOperations.on("ConsoleMsg", (event, { str, operation }) => {
        updateConsole({ str, operation });
        if (str.trim().endsWith("Overwrite? [y/N]")) { // Ask the user if they want to overwrite
            let file = conversionText[operation].join("").substring(0, str.lastIndexOf("already exists"));
            file = file.substring(file.lastIndexOf("file ") + 5);
            showOverwriteDialog.set(file); // Set the value as the name of the file to replace. The overwrite dialog will be automatically shown
        }
        document.getElementById("addContent")?.scrollTo({ top: document.getElementById("addContent")?.scrollHeight, behavior: "smooth" });
    });
    window.nativeOperations.on("ConsoleError", () => conversionFailedDate.set(Date.now()));
}

export default class ffmpeg {
    promise: Promise<void>;
    #resolvePromise!: (value: void | PromiseLike<void>) => void;
    load!: () => Promise<void>;
    writeFile!: (file: File, alsoOnOS?: boolean) => Promise<void>;
    readFile!: (name: string, alsoOnOS?: boolean) => Promise<Uint8Array | undefined>;
    exec!: (command: string[]) => Promise<void>;
    removeFile!: (file: File | string) => Promise<void>;
    exit!: () => void;
    native = false;
    operationId = 0;
    constructor(type: FFmpegVersions, urls?: FfmpegUrls) {
        this.promise = new Promise<void>((resolve) => { this.#resolvePromise = resolve })
        currentConversionValue.update((val) => { // New conversion ID
            this.operationId = val;
            return val + 1;
        });
        switch (type) {
            case "0.11.x":
                import("ffmpeg11").then(async (ffmpeg) => {
                    const obj = ffmpeg.createFFmpeg({
                        wasmPath: typeof window.isLocal !== "undefined" ? URL.createObjectURL(await (await fetch("./assets/ffmpeg11/ffmpeg-core.wasm")).blob()) : "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm",
                        workerPath: typeof window.isLocal !== "undefined" ? URL.createObjectURL(await (await fetch("./assets/ffmpeg11/ffmpeg-core.worker.js")).blob()) : "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js",
                        corePath: typeof window.isLocal !== "undefined" ? URL.createObjectURL(await (await fetch("./assets/ffmpeg11/ffmpeg-core.js")).blob()) : "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js"
                    });
                    this.load = async () => {
                        !obj.isLoaded() && await obj.load();
                    }
                    this.writeFile = async (file) => {
                        // Create, one path at a time, the directories necessary for the file
                        const namePath = FFmpegFileNameHandler(file).split("/");
                        const name = namePath.pop();
                        if (!name) throw new Error("Undefined name array!");
                        for (let i = 0; i < namePath.length; i++) obj.FS("mkdir", namePath.slice(0, i + 1).join("/"));
                        obj.FS("writeFile", FFmpegFileNameHandler(file), new Uint8Array(await file.arrayBuffer()));
                    };
                    this.readFile = async (name) => {
                        return obj.FS("readFile", name);
                    }
                    this.exec = async (command) => {
                        await obj.run(...command);
                    }
                    obj.setLogger(({ message }) => {
                        message === "Conversion failed!" && conversionFailedDate.set(Date.now());
                        updateConsole({ str: message, operation: this.operationId });
                        document.getElementById("addContent")?.scrollTo({ top: document.getElementById("addContent")?.scrollHeight, behavior: "smooth" })
                    });
                    this.removeFile = async (file) => {
                        obj.FS("unlink", typeof file === "string" ? file : FFmpegFileNameHandler(file));
                    }
                    this.exit = () => obj.exit();
                    obj.setProgress(({ ratio }) => conversionProgress[this.operationId] = ratio);
                    this.#resolvePromise();
                });
                break;
            case "0.12.x":
                import("ffmpeg12").then((ffmpeg) => {
                    const obj = new ffmpeg.FFmpeg();
                    this.load = async () => {
                        !obj.loaded && await obj.load({
                            coreURL: URL.createObjectURL(await (await fetch(typeof window.isLocal !== "undefined" ? `./assets/ffmpeg12/ffmpeg-core${Settings.useMultiThreaded ? "mt" : ""}.js` : `https://unpkg.com/@ffmpeg/core${Settings.useMultiThreaded ? "-mt" : ""}@0.12.6/dist/esm/ffmpeg-core.js`)).blob()),
                            wasmURL: URL.createObjectURL(await (await fetch(typeof window.isLocal !== "undefined" ? `./assets/ffmpeg12/ffmpeg-core${Settings.useMultiThreaded ? "mt" : ""}.wasm` : `https://unpkg.com/@ffmpeg/core${Settings.useMultiThreaded ? "-mt" : ""}@0.12.6/dist/esm/ffmpeg-core.wasm`)).blob()),
                            workerURL: URL.createObjectURL(await (await fetch(typeof window.isLocal !== "undefined" ? "./assets/ffmpeg12/ffmpeg-core.worker.js" : "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js")).blob())
                        });
                    }
                    this.writeFile = async (file) => {
                        // Create, one path at a time, the directories necessary for the file
                        const namePath = FFmpegFileNameHandler(file).split("/");
                        const name = namePath.pop();
                        if (!name) throw new Error("Undefined name array!");
                        for (let i = 0; i < namePath.length; i++) await obj.createDir(namePath.slice(0, i + 1).join("/"));
                        await obj.writeFile(FFmpegFileNameHandler(file), new Uint8Array(await file.arrayBuffer()));
                    }
                    this.readFile = async (name) => {
                        return await obj.readFile(name) as Uint8Array;
                    }
                    this.exec = (command) => {
                        return new Promise<void>(async (resolve, reject) => {
                            (await obj.exec(command)) === 0 ? resolve() : reject();
                        })
                    }
                    obj.on("log", ({ message }) => {
                        message === "Conversion failed!" && conversionFailedDate.set(Date.now());
                        updateConsole({ str: message, operation: this.operationId });
                        document.getElementById("addContent")?.scrollTo({ top: document.getElementById("addContent")?.scrollHeight, behavior: "smooth" })
                    });
                    this.removeFile = async (file) => {
                        await obj.deleteFile(typeof file === "string" ? file : FFmpegFileNameHandler(file));
                    }
                    this.exit = () => obj.terminate();
                    obj.on("progress", ({ progress }) => conversionProgress[this.operationId] = progress);
                    this.#resolvePromise();
                });
                break;
            case "native": {
                const ipcRenderer = window.nativeOperations;
                this.native = true;
                this.load = async () => { };
                this.writeFile = async (file) => {
                    if (!file.name.startsWith("__FfmpegWebExclusive__")) return;
                    await ipcRenderer.invoke(`WriteFile`, {
                        content: await file.arrayBuffer(),
                        name: FFmpegFileNameHandler(file)
                    });
                };
                this.readFile = async (name, alsoOnOS) => {
                    if (alsoOnOS) return await ipcRenderer.invoke("ReadFile", name);
                    return undefined;
                }
                this.exec = async (command) => {
                    await ipcRenderer.invoke(`FfmpegCommand`, { command, operation: this.operationId });
                }
                this.removeFile = async (file) => {
                    if (!handleFileStringForOS(file instanceof File ? FFmpegFileNameHandler(file) : file).startsWith("__FfmpegWebExclusive__")) return;
                    await ipcRenderer.invoke(`DeleteFile`, file instanceof File ? (file.webkitRelativePath || file.name) : file);
                }
                this.exit = () => { };
                this.#resolvePromise();
                break;
            }
        }
    }
}