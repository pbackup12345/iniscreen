// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, clipboard, ipcRenderer } = require("electron");

// As an example, here we use the exposeInMainWorld API to expose the browsers
// and node versions to the main window.
// They'll be accessible at "window.versions".

contextBridge.exposeInMainWorld("myApi", {
  clipText: () => clipboard.readText(),
  clipImage: () => clipboard.readImage().toDataURL(),
  clipClear: () => clipboard.clear(),
  hide: (data) =>
    ipcRenderer.send("hidemain", {
      data,
    }),
  pinMe: () => ipcRenderer.send("pinclipboard", {}),
  hideShowMain: (data) =>
    ipcRenderer.send("hideshowmain", {
      data,
    }),
  showMain: (data) =>
    ipcRenderer.send("showmain", {
      data,
    }),
  shotNowClipboard: () => ipcRenderer.send("shotnowclip", {}),
});
