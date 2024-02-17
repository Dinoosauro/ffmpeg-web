const { app, BrowserWindow, ipcMain, shell } = require('electron');
const childProcess = require("child_process");
const path = require("path");
const fs = require("fs");
let filesToKeep = []; // File names that must not be deleted
let filesReceived = []; // File names that have been passed from the webpage
let filesTouched = []; // Every file name that ffmpeg-web has created.
function getFilePath(path) {
    /*
        From "script.js":
            Electron provides a file path when a file is selected, and this is very useful to avoid copying files into a temp folder.
            However, this would create conflict if the user wants to use only safe characters for the file. Therefore, the typical "dividers" used by file systems to navigate will be replaced with a temp value, introduced by a dollar. The main rendered will then replace these values.
    */
    return path.replaceAll("$Slash", "/").replaceAll("$BackwardsSlash", "\\").replaceAll("$Dot", ":").replaceAll("$Dollar", "$");
}
function fileChange({ newItem, path, event }) { // A new file has been created or deleted. Send the notification to the Window so that it can be added/remove in the "Files created" section
    filesTouched.push(path); // Add it as a check, so that the application will open only files created by the script.
    event.reply("FSChange", { action: newItem ? "add" : "remove", value: path })
}
let currentProcess;
function createWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        icon: "assets/logo.png",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    })
    win.loadFile("index.html");
    ipcMain.on("StartProcess", (event, args) => { // Create a new child process for ffmpeg
        for (let i = 0; i < args.length; i++) { // Update the file path with the correct one for each input
            if (args[i] === "-i") {
                args[i + 1] = getFilePath(args[i + 1]);
                if (args[i + 1].indexOf(path.sep) === -1) args[i + 1] = path.resolve(__dirname, args[i + 1]); // Make sure each input has a full path
            }
        }
        args[args.length - 1] = getFilePath(args[args.length - 1]); // Get the correct file path for the output
        filesReceived.push(args[args.length - 1]);
        console.log(args);
        let process = childProcess.spawn("ffmpeg", args); // Create ffmpeg process
        currentProcess = process;
        fileChange({ newItem: true, path: path.resolve(__dirname, args[args.length - 1]), event: event }); // Trigger new file event
        function addData(str) { // Send the new data to the window, so that it can be displayed
            event.reply("ConsoleStatus", str);
        }
        process.on("close", () => { // Resolve the Promise initiated by the window
            event.reply("FinishedConversion", true);
        });
        process.stdout.on("data", (data) => { addData(data) });
        process.stderr.on("data", (data) => { addData(data) });
    })
    ipcMain.on("Overwrite", () => { // Ffmpeg has produced an "already existing" error, and the user wants to overwrite the current file
        if ((currentProcess ?? "") !== "") currentProcess.stdin.write("y\n");
    })
    ipcMain.on("ReadFinalFile", (event, fileName) => { // Read the output file, that normally would be downloaded
        fileName = getFilePath(fileName); // Get updated file path
        filesToKeep.push(fileName.substring(0, fileName.lastIndexOf(".tempa")));
        fs.rename(fileName, fileName.substring(0, fileName.lastIndexOf(".tempa")), (err) => { // Rename the file as the output name (without temp)
            if ((err ?? "") === "") { // No errors: delete the previous file from the DOM and create a new one with the correct name
                fileChange({ newItem: false, path: fileName, event: event });
                fileChange({ newItem: true, path: fileName.substring(0, fileName.lastIndexOf(".tempa")), event: event });
            } else console.warn(err);
        });
    })
    ipcMain.on("DeleteTempFile", (event, fileName) => { // Delete a file
        fileName = getFilePath(fileName);
        if (filesToKeep.indexOf(fileName) !== -1 || filesReceived.indexOf(fileName) === -1) return; // Check that the file has been received and that isn't to keep before deleting it
        fs.rm(fileName, (err) => { // Delete file
            (err ?? "") === "" ? fileChange({ newItem: false, path: path.resolve(__dirname, fileName), event: event }) : console.warn(err);
        });
    });
    ipcMain.on("WriteArrayFile", (event, content) => { // Write the file with all the content to merge
        filesReceived.push("array.txt");
        fs.writeFile("array.txt", getFilePath(content), () => {
            fileChange({ newItem: true, path: path.resolve(__dirname, "array.txt"), event: event });
            event.reply("WriteArrayCompleted", true);
        });
    });
    ipcMain.on("TempImage", (event, path) => { // Copy the album art selected when editing metadata as a temp file
        fs.copyFile(path, "temp.jpg", () => {
            event.reply("ImageCopied", true);
            fileChange({ newItem: true, path: path.join(__dirname, "temp.jpg"), event: event });
        })
    })
    ipcMain.on("ExternalOpen", (event, path) => { // Open a link, checking that is a valid GitHub link
        if (path.toLowerCase().startsWith("https://github.com/dinoosauro")) shell.openExternal(path);
    })
    ipcMain.on("ExternalOpenPath", (event, path) => { // Open a file, checking that was edited by the application
        if (filesTouched.indexOf(path) !== -1) shell.openPath(path)
    })
};
app.whenReady().then(() => createWindow());
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
});
