// Module to control the application lifecycle and the native browser window.
const {
  app,
  BrowserWindow,
  protocol,
  ipcMain,
  globalShortcut,
  screen,
  nativeImage,
  clipboard,
  Tray,
  Menu,
  dialog,
  nativeTheme,
  shell,
  desktopCapturer,
} = require("electron");

const electronLocalshortcut = require("electron-localshortcut");

const shortcuts = {};

let afterCut = null;

//const baseUrl = "http://192.168.0.102:8100";
const baseUrl = "https://app.ininotes.com";

const {
  hasScreenCapturePermission,
  openSystemPreferences,
} = require("mac-screen-capture-permissions");

function callBeforeQuitAndInstall() {
  try {
    if (tray) tray = null;
    app.removeAllListeners("window-all-closed");
    var browserWindows = BrowserWindow.getAllWindows();
    browserWindows.forEach(function (browserWindow) {
      browserWindow.removeAllListeners("close");
    });
  } catch (e) {
    console.log(e);
  }
}

nativeTheme.on("updated", () => {
  if (process.platform !== "darwin") {
    tray.setImage(
      nativeTheme.shouldUseDarkColors ? appIconWinWhite : appIconWinDark
    );
  }
});

const { autoUpdater } = require("electron-updater");

const Store = require("electron-store");

const store = new Store();

const path = require("path");
// const screenshotDesktop = require("screenshot-desktop");

const url = require("url");
const ProgressBar = require("electron-progressbar");

let progressBar;

let appWindow;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on(
    "second-instance",
    (event, commandLine, workingDirectory, additionalData) => {
      // Print out data received from the second instance.

      // Someone tried to run a second instance, we should focus our window.
      if (appWindow) {
        appWindow.show();
        if (appWindow.isMinimized()) appWindow.restore();
        appWindow.focus();
      }
    }
  );
}

autoUpdater.autoDownload = false;

autoUpdater.on("update-downloaded", () => {
  autoUpdater.logger.info("bihi");
  autoUpdater.logger.info(progressBar);
  if (progressBar && progressBar.close) {
    progressBar.close();
  }
  autoUpdater.logger.info("cihi");
  callBeforeQuitAndInstall();
  autoUpdater.quitAndInstall();
});

autoUpdater.on("update-available", () => {
  autoUpdater.logger.info("caha");
  appWindow.webContents.postMessage("updatenow", {});
});

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

autoUpdater.checkForUpdates();

setInterval(() => {
  autoUpdater.checkForUpdates();
}, 1000 * 60);

let screenShotterWindow;
let titlebar;
let cutterWindow;

let tray;
let helpWindow;

let myViewers = [];

let grandom = store.get("version") || 0;

let appIconMac = nativeImage.createFromPath(
  path.join(__dirname, "logo32Template@2x.png")
);

let appIconWinWhite = nativeImage.createFromPath(
  path.join(__dirname, "logotraywhite.png")
);

let appIconWinDark = nativeImage.createFromPath(
  path.join(__dirname, "logotraydark.png")
);

const getScreenShotPermision = () => {
  if (process.platform !== "darwin") {
    return true;
  }

  if (hasScreenCapturePermission()) {
    return true;
  }

  if (
    dialog.showMessageBox({
      title: `Permission for Screenshots...`,
      message: `IniNotes needs permission to take screenshots. Click OK and give permission to IniNotes.`,
      detail: `You will see a dialog. Click on the little lock in the lower left corner, then check IniNotes in the list, then click on the lock again.`,
      buttons: ["Cancel", "OK"],
    })
  ) {
    openSystemPreferences();
  }

  return false;
};

function createHelpWindow() {
  const disp = screen.getPrimaryDisplay();

  helpWindow = new BrowserWindow({
    width: 500,
    height: Math.max(800, disp.bounds.height - 300),
    x: disp.bounds.width - 550,
    y: 24,
    minWidth: 400,

    // Set the path of an additional "preload" script that can be used to
    // communicate between node-land and browser-land.
    frame: false,
    skipTaskbar: true,
    maximizable: false,
    acceptFirstMouse: true,

    fullscreenable: false,
    minimizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preloadhelper.js"),
    },
  });

  const pos = JSON.parse(store.get("help") || "{}");

  if (Array.isArray(pos)) {
    helpWindow.setPosition(pos[0], pos[1]);
    helpWindow.setSize(pos[2], pos[3]);
  }

  // cutterWindow.webContents.openDevTools();

  // In production, set the initial browser path to the local bundle generated
  // by the Create React App build process.
  // In development, set it to localhost to allow live/hot-reloading.
  const appURL = baseUrl + "/help/help?i=" + grandom;

  helpWindow.loadURL(appURL);
  // cutterWindow.loadURL(appURL);

  // Automatically open Chrome's DevTools in development mode.
  if (!app.isPackaged) {
    // cutterWindow.webContents.openDevTools();
  }

  helpWindow.on("close", function (e) {
    e.preventDefault();
    const place = JSON.stringify([
      ...helpWindow.getPosition(),
      ...helpWindow.getSize(),
    ]);

    store.set("help", place);
    helpWindow.hide();
  });
}

// Create the native browser window.
function createCutterWindow() {
  const disp = screen.getPrimaryDisplay();

  cutterWindow = new BrowserWindow({
    width: 500,
    height: Math.max(800, disp.bounds.height - 150),
    x: disp.bounds.width - 500,
    y: 24,
    maxWidth: 600,
    minWidth: 300,

    // Set the path of an additional "preload" script that can be used to
    // communicate between node-land and browser-land.
    frame: false,
    skipTaskbar: true,
    maximizable: false,
    acceptFirstMouse: true,

    fullscreenable: false,
    minimizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  electronLocalshortcut.register(cutterWindow, "Escape", () => {
    cutterWindow.hide();
  });

  const pos = JSON.parse(store.get("cutter") || "{}");

  if (Array.isArray(pos)) {
    cutterWindow.setPosition(pos[0], pos[1]);
    cutterWindow.setSize(pos[2], pos[3]);
  }

  // cutterWindow.webContents.openDevTools();

  // In production, set the initial browser path to the local bundle generated
  // by the Create React App build process.
  // In development, set it to localhost to allow live/hot-reloading.
  const appURL = baseUrl;

  cutterWindow.loadURL(appURL + "/app/clipper/?a=" + grandom);
  // cutterWindow.loadURL(appURL);

  // Automatically open Chrome's DevTools in development mode.
  if (!app.isPackaged) {
    // cutterWindow.webContents.openDevTools();
  }

  cutterWindow.on("close", function (e) {
    e.preventDefault();

    const place = JSON.stringify([
      ...cutterWindow.getPosition(),
      ...cutterWindow.getSize(),
    ]);

    store.set("cutter", place);
    cutterWindow.hide();
  });
}

function createViewerWindow(url) {
  const viewerWindow = new BrowserWindow({
    width: 700,
    height: 600,
    x: 70,
    y: 70,
    frame: false,
    // acceptFirstMouse: true,
    backgroundColor: "#333333",

    // Set the path of an additional "preload" script that can be used to
    // communicate between node-land and browser-land.
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preloadView.js"),
      sandbox: true,
    },
    resizable: true,
  });

  const pos = JSON.parse(store.get(encodeURIComponent(url)) || "{}");

  if (Array.isArray(pos)) {
    viewerWindow.setPosition(pos[0], pos[1]);
    viewerWindow.setSize(pos[2], pos[3]);
  }

  viewerWindow.show();
  viewerWindow.focus();

  // viewerWindow.webContents.openDevTools();

  viewerWindow.on("close", (e) => {
    const thisSender = myViewers.find(
      (item) => item.id === viewerWindow.webContents.id
    );

    if (thisSender && thisSender.isChanged) {
      e.preventDefault();
      viewerWindow.webContents.postMessage("closeasksave", {});
      return;
    }

    myViewers = myViewers.filter(
      (item) => item.id !== viewerWindow.webContents.id
    );

    appWindow.webContents.postMessage("changeunsaved", { unsaved: myViewers });

    viewerWindow.removeAllListeners();
    viewerWindow.webContents.removeAllListeners();
    viewerWindow.close();

    console.log(thisSender);

    updateContextMenu();
  });

  viewerWindow.loadURL(baseUrl + "/app/beditor?id=" + url + "%2f&a=" + grandom);

  return viewerWindow;
}

function createAppWindow() {
  // const disp = screen.getPrimaryDisplay();

  appWindow = new BrowserWindow({
    width: 750,
    height: 700,
    maxWidth: 750,
    minWidth: 320,
    x: 24,
    y: 24,
    frame: false,
    acceptFirstMouse: true,
    backgroundColor: "#333333",

    // Set the path of an additional "preload" script that can be used to
    // communicate between node-land and browser-land.
    show: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preloadmain.js"),
      sandbox: true,
    },
    resizable: true,
  });

  const pos = JSON.parse(store.get("app") || "{}");

  if (Array.isArray(pos)) {
    appWindow.setPosition(pos[0], pos[1]);
    appWindow.setSize(pos[2], pos[3]);
  }

  // appWindow.webContents.session.clearCache();

  //appWindow.on("ready-to-show", () => {
  appWindow.show();
  //});

  // appWindow.webContents.openDevTools();

  // In production, set the initial browser path to the local bundle generated
  // by the Create React App build process.
  // In development, set it to localhost to allow live/hot-reloading.
  const appURL = baseUrl + "/app/library?a=" + grandom;

  appWindow.loadURL(appURL);
  // cutterWindow.loadURL(appURL);

  // Automatically open Chrome's DevTools in development mode.
  if (!app.isPackaged) {
    // cutterWindow.webContents.openDevTools();
  }

  // ipcMain.on("printit", () => {
  //   console.log("this is it");
  //   appWindow.webContents.print({}, () => {
  //     console.log("ha");
  //   });
  // });

  appWindow.on("close", function (e) {
    e.preventDefault();
    appWindow.minimize();
  });

  appWindow.on("hide", function (e) {
    if (!tray) {
      return;
    }

    if (!store.get("notfirst")) {
      tray.displayBalloon({
        icon: nativeImage.createFromPath(path.join(__dirname, "icon.png")),
        iconType: "custom",
        title: "IniNotes...",
        content: "You can always open IniNotes by clicking on its icon here.",
      });

      setTimeout(() => {
        if (tray) {
          tray.removeBalloon();
        }
      }, 20000);

      store.set("notfirst", true);
    }

    const place = JSON.stringify([
      ...appWindow.getPosition(),
      ...appWindow.getSize(),
    ]);

    store.set("app", place);
  });
}

const createScreenShotWindow = () => {
  const appURL = app.isPackaged
    ? url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true,
      })
    : "http://localhost:3000";

  screenShotterWindow = new BrowserWindow({
    width: 3000,
    height: 2000,
    x: 0,
    y: 0,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    thickFrame: false,
    webPreferences: {
      preload: path.join(__dirname, "preloadshot.js"),
    },
  });

  titlebar =
    screenShotterWindow.getSize()[1] - screenShotterWindow.getContentSize()[1];
  screenShotterWindow.hide();

  //screenShotterWindow.webContents.openDevTools();

  screenShotterWindow.setMenuBarVisibility(false);
  screenShotterWindow.loadURL(appURL);

  ipcMain.on("hideme", () => {
    screenShotterWindow.hide();
    if (afterCut !== "clipboard") {
      const allWindows = BrowserWindow.getAllWindows();

      const myWindow = allWindows.find(
        (window) => window.webContents.id === afterCut
      );

      if (myWindow) {
        myWindow.show();
        myWindow.focus();
      }
    } else {
      cutterWindow.show();
    }
  });

  ipcMain.on("hideapp", () => {
    appWindow.minimize();
  });

  ipcMain.on("showclip", () => {
    cutterWindow.show();
  });

  ipcMain.on("opacity", () => {
    screenShotterWindow.setOpacity(1);
  });

  ipcMain.on("hidemain", () => {
    cutterWindow.close();
  });

  ipcMain.on("downloadupdate", () => {
    autoUpdater.on(
      "download-progress",
      (event) => (progressBar.value = event.percent)
    );

    progressBar = new ProgressBar({
      indeterminate: false,
      text: "Downloading updates...",
      detail: "Wait...",
      maxValue: 100,
    });

    progressBar
      .on("completed", function () {
        console.info(`completed...`);
        progressBar.detail = "Task completed. Exiting...";
      })
      .on("aborted", function (value) {
        console.info(`aborted... ${value}`);
      });

    // BrowserWindow.getAllWindows().forEach((window) => window.hide());

    autoUpdater
      .downloadUpdate()
      .then(() => {
        autoUpdater.logger.info("aha");
      })
      .catch(() => {
        autoUpdater.logger.info("baha");
        autoUpdater.quitAndInstall();
      });
  });

  ipcMain.on("pinme", (event) => {
    const myWindow = BrowserWindow.getAllWindows().find(
      (item) => item.webContents.id === event.sender.id
    );
    if (myWindow.isAlwaysOnTop()) {
      myWindow.setAlwaysOnTop(false);
    } else {
      myWindow.setAlwaysOnTop(true);
    }
  });

  ipcMain.on("pinclipboard", (event) => {
    if (cutterWindow.isAlwaysOnTop()) {
      cutterWindow.setAlwaysOnTop(false);
    } else {
      cutterWindow.setAlwaysOnTop(true);
    }
  });

  ipcMain.on("openext", (event, data) => {
    shell.openExternal(data.url);
  });

  ipcMain.on("minimizeme", (event) => {
    const myWindow = BrowserWindow.getAllWindows().find(
      (item) => item.webContents.id === event.sender.id
    );
    myWindow.minimize();
  });

  ipcMain.on("shotnowclip", async (event, data) => {
    cutterWindow.minimize();
    afterCut = "clipboard";
    await showCutter();
  });

  ipcMain.on("shotnow", async (event, data) => {
    const myWindow = BrowserWindow.getAllWindows().find(
      (item) => item.webContents.id === event.sender.id
    );
    myWindow.minimize();
    afterCut = event.sender.id;
    await showCutter();
  });

  const tryClosing = () => {
    const changedViewers = myViewers.filter((item) => item.isChanged);

    const allWindows = BrowserWindow.getAllWindows();

    if (changedViewers.length) {
      changedViewers.forEach((viewer) => {
        const myWindow = allWindows.find(
          (window) => window.webContents.id === viewer.id
        );

        myWindow.show();

        myWindow.webContents.postMessage("closeasksave", {});
      });
    } else {
      return true;
    }
  };

  ipcMain.on("tryclosing", () => {
    if (tryClosing()) {
      const allWindows = BrowserWindow.getAllWindows();

      myViewers.forEach((item) => {
        const myWindow = allWindows.find(
          (window) => window.webContents.id === item.id
        );

        myWindow.close();
      });

      appWindow.show();
      appWindow.focus();
      appWindow.webContents.postMessage("logout", {});
    }
  });

  ipcMain.on("validateshortcuts", () => {
    const hotkeys = [
      "CommandOrControl+F2",
      "CommandOrControl+2",
      "CommandOrControl+K",
      "CommandOrControl+Shift+F2",
      "CommandOrControl+Shift+2",
      "CommandOrControl+Shift+K",
    ];

    const validHotkeys = [];

    hotkeys.forEach((key) => {
      let reg = globalShortcut.isRegistered(key);

      if (reg) {
        validHotkeys.push(key);
      } else {
        reg = globalShortcut.register(key, () => {});
        if (reg) {
          validHotkeys.push(key);
          globalShortcut.unregister(key);
        }
      }
    });

    appWindow.webContents.postMessage("validhotkeys", {
      validHotkeys: validHotkeys,
    });
  });

  ipcMain.on("setupshortcuts", (e, data) => {
    globalShortcut.unregisterAll();

    shortcuts.screenshotShortcut =
      data.screenshotShortcut || "CommandOrControl+Shift+F2";

    globalShortcut.register(
      data.screenshotShortcut || "CommandOrControl+Shift+F2",
      async () => {
        if (screenShotterWindow.isVisible()) {
          return;
        }
        afterCut = "clipboard";
        await showCutter();
      }
    );

    shortcuts.clipboardShortcut =
      data.clipboardShortcut || "CommandOrControl+F2";

    globalShortcut.register(
      data.clipboardShortcut || "CommandOrControl+F2",
      async () => {
        if (screenShotterWindow.isVisible()) {
          return;
        }
        cutterWindow.show();
      }
    );
    updateContextMenu();
  });

  ipcMain.on("tryrestart", () => {
    if (tryClosing()) {
      const allWindows = BrowserWindow.getAllWindows();

      myViewers.forEach((item) => {
        const myWindow = allWindows.find(
          (window) => window.webContents.id === item.id
        );

        myWindow.close();
      });

      // cutterWindow.hide();
      // helpWindow.hide();

      const appURL = baseUrl + "/help/help?i=" + grandom + Date.now();

      helpWindow.loadURL(appURL);

      const appURLCutter = baseUrl + "/app/clipper/?a=" + grandom + Date.now();

      cutterWindow.loadURL(appURLCutter);

      appWindow.show();
      appWindow.focus();
      appWindow.webContents.postMessage("restart", {});
    }
  });

  ipcMain.on("hideshowmain", () => {
    BrowserWindow.getAllWindows().forEach((item) => {
      if (item !== appWindow) {
        item.close();
      }
    });

    appWindow.show();
  });

  ipcMain.on("showmain", () => {
    appWindow.show();
  });

  ipcMain.on("showhelptopic", (event, data) => {
    helpWindow.webContents.postMessage("showhelp", {
      code: data.code,
    });
    setTimeout(() => {
      helpWindow.show();
    }, []);
  });

  ipcMain.on("picture", async (event, data) => {
    //eslint-disable-next-line
    if (afterCut === "clipboard") {
      const image = nativeImage.createFromDataURL(data);
      clipboard.writeImage(image);

      //eslint-disable-next-line

      screenShotterWindow.hide();
      cutterWindow.show();
    } else {
      const allWindows = BrowserWindow.getAllWindows();

      const myWindow = allWindows.find(
        (window) => window.webContents.id === afterCut
      );

      if (myWindow) {
        myWindow.show();
        myWindow.focus();
        myWindow.webContents.postMessage("pictureshot", data);
      }
    }
  });

  ipcMain.on("openurl", (event, data) => {
    const myContents = myViewers.find((window) => window.url === data.url);

    if (myContents) {
      const myWindow = BrowserWindow.getAllWindows().find(
        (item) => item.webContents.id === myContents.id
      );
      myWindow.show();
      return;
    }

    const newWindow = createViewerWindow(data.url);

    newWindow.title =
      decodeURIComponent(data.url).split("/")[3] || "Untitled Note";

    myViewers.push({
      id: newWindow.webContents.id,
      url: data.url,
      title: newWindow.title,
    });
    appWindow.webContents.postMessage("changeunsaved", { unsaved: myViewers });

    updateContextMenu();
  });

  ipcMain.on("versioning", (event, data) => {
    const version = data.version;

    const oldVersion = store.get("version");

    store.set("version", version);
    grandom = version;

    if (version !== oldVersion && oldVersion) {
      const appURL = baseUrl + "/help/help?i=" + grandom;

      helpWindow.loadURL(appURL);

      const appURLCutter = baseUrl + "/app/clipper/?a=" + grandom;

      cutterWindow.loadURL(appURLCutter);

      const allWindows = BrowserWindow.getAllWindows();

      myViewers = myViewers.map((item) => ({ ...item, isChanged: false }));

      myViewers.forEach((webItem) => {
        const myWindow = allWindows.find(
          (item) => item.webContents.id === webItem.id
        );

        myWindow.close();
      });
    }

    updateContextMenu();
  });

  ipcMain.on("showhelp", (event, data) => {
    createViewerWindow(data.url);
  });

  ipcMain.on("ischanged", (event, data) => {
    myViewers = myViewers.map((item) =>
      item.id === event.sender.id
        ? { ...item, isChanged: data.isChanged }
        : { ...item }
    );

    appWindow.webContents.postMessage("changeunsaved", { unsaved: myViewers });
  });

  ipcMain.on("closeview", (event, data) => {
    const myWindow = BrowserWindow.getAllWindows().find(
      (item) => item.webContents.id === event.sender.id
    );

    const myItem = myViewers.find((item) => item.id === event.sender.id);

    if (data.force) {
      myViewers = myViewers.map((item) =>
        item.id === event.sender.id
          ? { ...item, isChanged: false }
          : { ...item }
      );
    }
    const place = JSON.stringify([
      ...myWindow.getPosition(),
      ...myWindow.getSize(),
    ]);
    store.set(encodeURIComponent(myItem.url), place);

    myWindow.close();
  });

  ipcMain.on("closehelp", (event) => {
    helpWindow.close();
  });

  // screenShotterWindow.webContents.openDevTools();

  screenShotterWindow.on("close", function (e) {
    e.preventDefault();
    screenShotterWindow.hide();
  });
};

const showCutter = async () => {
  // Type "Hello World".

  if (!getScreenShotPermision()) {
    return;
  }

  let img;
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 3000, height: 3000 },
    });
    img = sources[0].thumbnail.toPNG(); // The image to display the screenshot

    // img = await screenshotDesktop();

    // if (!Buffer.isBuffer(img)) {
    // return;
    // }
  } catch (e) {
    console.log(e);
    return;
  }

  //@ts-ignore
  const allScreens = screen.getAllDisplays();

  const [x, y] = screenShotterWindow.getPosition();
  let [width, height] = screenShotterWindow.getSize();

  let fullWidth = 0;
  let fullHeight = 0;
  let left = 0;
  let top = 0;

  allScreens.forEach((screen) => {
    left = Math.min(left, screen.bounds.x);
    top = Math.min(top, screen.bounds.y);
    fullHeight = fullHeight + screen.size.height;
    fullWidth = fullWidth + screen.size.width;
  });

  if (x !== left || y !== top || fullHeight !== height || fullWidth !== width) {
    screenShotterWindow.setSize(Math.floor(fullWidth), Math.floor(fullHeight));

    screenShotterWindow.setPosition(Math.floor(left), Math.floor(top));
    // @ts-ignore
    width = Math.floor(fullWidth);

    // @ts-ignore
    height = Math.floor(fullHeight);
  }

  screenShotterWindow.webContents.postMessage("ping", {
    img: img,
    width: width,
    height: height,
    titlebar: titlebar,
  });
  screenShotterWindow.setOpacity(0);
  screenShotterWindow.show();
  setTimeout(() => {
    screenShotterWindow.setAlwaysOnTop(true, "pop-up-menu");
  }, 100);
};

const updateContextMenu = () => {
  const windowMenu = myViewers.map((item) => ({
    label: item.title.replace("|", " - "),
    type: "normal",
    click: () => {
      const awindow = BrowserWindow.getAllWindows().find(
        (win) => win.webContents.id === item.id
      );

      if (awindow) {
        awindow.show();
        awindow.focus();
      }
    },
  }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "IniNotes (" + grandom + ")",
      type: "normal",
      click: () => {
        appWindow.show();
      },
    },
    {
      label: "Screenshot",
      type: "normal",
      accelerator: shortcuts.screenshotShortcut || "",
      click: () => {
        showCutter();
        afterCut = "clipboard";
      },
    },
    {
      label: "Clipboard",
      type: "normal",
      accelerator: shortcuts.clipboardShortcut || "",
      click: () => {
        cutterWindow.show();
      },
    },
    {
      type: "separator",
    },
    ...windowMenu,
    {
      type: "separator",
    },
    {
      label: "Quit",
      type: "normal",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
};

// Setup a local proxy to adjust the paths of requested files when loading
// them from the local production bundle (e.g.: local fonts, etc...).
function setupLocalFilesNormalizerProxy() {
  protocol.registerHttpProtocol(
    "file",
    (request, callback) => {
      const url = request.url.substr(8);
      callback({ path: path.normalize(`${__dirname}/${url}`) });
    },
    (error) => {
      if (error) console.error("Failed to register protocol");
    }
  );
}

// This method will be called when Electron has finished its initialization and
// is ready to create the browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // console.log("bring");
  // let appInsights = require("applicationinsights");
  // appInsights.setup("4e30c59b-b19c-4e89-939f-b69e83fc2466").start();
  // let client = appInsights.defaultClient;

  // client.trackEvent({ name: "app loaded" });

  // const unhandled = require("electron-unhandled");
  // unhandled({
  //   showDialog: false,
  //   logger: (error) => {
  //     client.trackException({ exception: error });
  //   },
  // });

  if (process.platform === "darwin") {
    const template = [
      {
        label: app.getName(),
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideothers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
          {
            label: "Redo",
            accelerator: "Shift+CmdOrCtrl+Z",
            selector: "redo:",
          },
          { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          {
            label: "Select All",
            accelerator: "CmdOrCtrl+A",
            selector: "selectAll:",
          },
        ],
      },
      {
        label: "View",
        submenu: [{ role: "togglefullscreen" }],
      },
      {
        role: "window",
        submenu: [{ role: "minimize" }, { role: "close" }],
      },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    Menu.setApplicationMenu(null);
  }

  app.on("before-quit", (e) => {
    const inComplete = myViewers.find((item) => item.isChanged);

    if (inComplete) {
      e.preventDefault();
      const myWindow = BrowserWindow.getAllWindows().find(
        (item) => item.webContents.id === inComplete.id
      );
      myWindow.show();
      myWindow.close();
      return;
    }

    if (progressBar && progressBar.close) {
      progressBar.close();
    }

    BrowserWindow.getAllWindows().forEach((window) =>
      window.removeAllListeners()
    );
  });

  if (process.platform === "darwin") {
    tray = new Tray(appIconMac);
  } else {
    tray = new Tray(
      nativeTheme.shouldUseDarkColors ? appIconWinWhite : appIconWinDark
    );
  }

  tray.on("click", function () {
    tray.popUpContextMenu();
  });

  tray.setToolTip("IniNotes. Click to start...");

  // tray.setToolTip("This is my application.");
  updateContextMenu();

  createCutterWindow();
  createScreenShotWindow();
  createAppWindow();
  createHelpWindow();

  setupLocalFilesNormalizerProxy();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    // if (BrowserWindow.getAllWindows().length === 0) {
    //   createCutterWindow();
    // }
  });
});

// Quit when all windows are closed, except on macOS.
// There, it's common for applications and their menu bar to stay active until
// the user quits  explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// If your app has no need to navigate or only needs to navigate to known pages,
// it is a good idea to limit navigation outright to that known scope,
// disallowing any other kinds of navigation.
const allowedNavigationDestinations = [
  baseUrl,
  "https://app.ininotes.com",
  "https://docs.google.com",
  "https://drive.google.com",
];
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (!allowedNavigationDestinations.includes(parsedUrl.origin)) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
