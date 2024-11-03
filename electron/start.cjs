const { app, BrowserWindow, ipcMain, session } = require("electron");
const { writeFileSync, readFileSync, existsSync, mkdir, mkdirSync } = require("original-fs");
const { spawn } = require("child_process");
const path = require("path");
const { fileURLToPath } = require('url');
const { rename, rm } = require("fs");
/**
 * The Electron Window
 * @type {BrowserWindow}
 */
let window;

(async () => {
    await app.whenReady();
    function newWin() {
        window = new BrowserWindow({
            width: 800,
            height: 600,
            autoHideMenuBar: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            }
        });
        window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            details.responseHeaders['Cross-Origin-Opener-Policy'] = ['same-origin'];
            details.responseHeaders['Cross-Origin-Embedder-Policy'] = ['require-corp'];
            callback({ responseHeaders: details.responseHeaders });
        });
        window.loadFile("dist/index.html");
    }
    newWin();
    app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
    app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && newWin());
    app.on("quit", () => { for (const process of processes) process.kill("SIGINT") }); // Kill all FFmpeg subprocesses
    if (!existsSync(path.join(__dirname, "userContent"))) mkdirSync(path.join(__dirname, "userContent")); // Create the userContent folder for file data
    app.setPath("userData", path.join(__dirname, "userContent"));
    session.defaultSession.setPermissionRequestHandler(
        (webContents, permission, callback, details) => {
            if (permission === "fullscreen") {
                callback(true);
            }
        }
    );
})()
ipcMain.handle(`WriteFile`, (event, { content, name }) => {
    writeFileSync(name, Buffer.from(content));
    return;
})
/**
 * The currently.running process
 * @type {import("child_process").ChildProcessWithoutNullStreams[]}
 */
let processes = [];
ipcMain.handle("FfmpegCommand", (event, { command, operation }) => { // Received a FFmpeg command to run
    return new Promise((resolve) => {
        console.log(command);
        const process = spawn("ffmpeg", command);
        processes.push(process);
        process.stdout.on("data", (data) => window.webContents.send("ConsoleMsg", { str: new TextDecoder("utf-8").decode(data), operation }));
        process.stderr.on("data", (data) => window.webContents.send("ConsoleMsg", { str: new TextDecoder("utf-8").decode(data), operation }));
        process.on("close", (code) => {
            (code ?? 0) !== 0 && window.webContents.send("ConsoleError");
            processes.splice(processes.indexOf(process), 1);
            resolve();
        });
    })
});
function handleFileStringForOS(str) {
    if (str.indexOf("/") !== -1) str = str.substring(str.lastIndexOf("/") + 1);
    if (str.indexOf("\\") !== -1) str = str.substring(str.lastIndexOf("\\") + 1);
    return str;
}
ipcMain.handle("MoveFile", async (event, { from, to }) => {
    console.log(`Moving file from: ${from} to ${to}`);
    await new Promise((res) => rename(from, to, () => res()));
});
ipcMain.handle("ReadFile", async (event, file) => {
    console.log(`Reading: ${file}`);
    return new Uint8Array(readFileSync(file));
})
ipcMain.handle("DeleteFile", async (event, file) => {
    if (handleFileStringForOS(file).startsWith("__FfmpegWebExclusive__")) {
        console.log(`Deleting: ${file}`);
        await new Promise((res) => rm(file, () => res()));
    }
})
ipcMain.on("Overwrite", () => {
    for (const process of processes) process.stdin.write("y\n");
})
ipcMain.on("FullscreenChange", (event, enable) => {
    window.isFocused() && window.setFullScreen(enable);
})