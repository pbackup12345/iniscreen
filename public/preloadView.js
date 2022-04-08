// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron");

// As an example, here we use the exposeInMainWorld API to expose the browsers
// and node versions to the main window.
// They'll be accessible at "window.versions".

contextBridge.exposeInMainWorld("myApiView", {
  closeMe: (force = false) => ipcRenderer.send("closeview", { force: force }),
  pinMe: () => ipcRenderer.send("pinme", {}),
  openExternal: (url) => ipcRenderer.send("openext", { url: url }),
  minimizeMe: () => ipcRenderer.send("minimizeme", {}),
  shotNow: (code) => ipcRenderer.send("shotnow", { code: code }),
  changed: (isChanged) =>
    ipcRenderer.send("ischanged", { isChanged: isChanged }),
  showHelp: (code) => ipcRenderer.send("showhelptopic", { code: code }),
  onCloseAskSave: (fn) => {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on("closeasksave", (event, ...args) => fn(...args));
  },
  onPictureShot: (fn) => {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on("pictureshot", (event, ...args) => fn(...args));
  },
});
