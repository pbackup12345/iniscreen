// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron");

// As an example, here we use the exposeInMainWorld API to expose the browsers
// and node versions to the main window.
// They'll be accessible at "window.versions".

contextBridge.exposeInMainWorld("myApiHelper", {
  helpOpen: (data) =>
    ipcRenderer.send("hideme", {
      data,
    }),
  closeMe: () => ipcRenderer.send("closehelp", {}),
  onHelp: (fn) => {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on("showhelp", (event, ...args) => fn(...args));
  },
});
