const { contextBridge, ipcRenderer, shell } = require('electron')

contextBridge.exposeInMainWorld('comunication', {
    on(eventName, callback) {
        ipcRenderer.on(eventName, callback)
    },
    async send(eventName, ...params) {
        return await ipcRenderer.send(eventName, ...params)
    },
})
