// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, clipboard, app, ipcRenderer } = require("electron");

// As an example, here we use the exposeInMainWorld API to expose the browsers
// and node versions to the main window.
// They'll be accessible at "window.versions".

contextBridge.exposeInMainWorld("myApi", {
  clipText: () => clipboard.readText(),
  clipImage: () => clipboard.readImage().toDataURL(),
  hide: (data) =>
    ipcRenderer.send("hidemain", {
      data,
    }),
  hideShowMain: (data) =>
    ipcRenderer.send("hideshowmain", {
      data,
    }),
});
