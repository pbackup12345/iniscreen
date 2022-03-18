// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron");

// As an example, here we use the exposeInMainWorld API to expose the browsers
// and node versions to the main window.
// They'll be accessible at "window.versions".

contextBridge.exposeInMainWorld("myApiMain", {
  opening: (url) => ipcRenderer.send("openurl", { url: url }),
  versioning: (version) => ipcRenderer.send("versioning", { version: version }),
  print: () => ipcRenderer.send("printit", {}),
  hideApp: () => ipcRenderer.send("hideapp", {}),
  showClipboard: () => ipcRenderer.send("showclip", {}),
  tryLogout: () => ipcRenderer.send("tryclosing", {}),
  showHelp: (code) => ipcRenderer.send("showhelptopic", { code: code }),
  onLogout: (fn) => {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on("logout", (event, ...args) => fn(...args));
  },
  onUpdate: (fn) => {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on("updatenow", (event, ...args) => fn(...args));
  },
});
