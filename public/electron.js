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
} = require("electron");
const {
  hasScreenCapturePermission,
  openSystemPreferences,
} = require("mac-screen-capture-permissions");

const Store = require("electron-store");

const store = new Store();

const path = require("path");
const screenshotDesktop = require("screenshot-desktop");

const url = require("url");

let screenShotterWindow;
let titlebar;
let cutterWindow;
let appWindow;
let tray;
let helpWindow;

let myViewers = [];

let grandom = store.get("version") || 0;

let appIcon = nativeImage.createFromPath(
  path.join(__dirname, "logo32Template@2x.png")
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
    width: 400,
    height: Math.max(800, disp.bounds.height - 300),
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
  const appURL = "https://app.ininotes.com/help/help?i=" + grandom;

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
    height: Math.max(800, disp.bounds.height - 100),
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

  const pos = JSON.parse(store.get("cutter") || "{}");

  if (Array.isArray(pos)) {
    cutterWindow.setPosition(pos[0], pos[1]);
    cutterWindow.setSize(pos[2], pos[3]);
  }

  cutterWindow.webContents.openDevTools();

  // In production, set the initial browser path to the local bundle generated
  // by the Create React App build process.
  // In development, set it to localhost to allow live/hot-reloading.
  const appURL = "https://app.ininotes.com";

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
    width: 900,
    height: 700,
    x: 70,
    y: 70,
    frame: false,
    acceptFirstMouse: true,
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
  viewerWindow.on("ready-to-show", () => {});

  //viewerWindow.webContents.openDevTools();

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

    updateContextMenu();
  });

  viewerWindow.loadURL(
    "https://app.ininotes.com/app/beditor?id=" + url + "%2f&a=" + grandom
  );

  return viewerWindow;
}

function createAppWindow() {
  // const disp = screen.getPrimaryDisplay();

  appWindow = new BrowserWindow({
    width: 750,
    height: 700,
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

  appWindow.webContents.openDevTools();

  // In production, set the initial browser path to the local bundle generated
  // by the Create React App build process.
  // In development, set it to localhost to allow live/hot-reloading.
  const appURL = "https://app.ininotes.com/app/library?a=" + grandom;

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
    appWindow.hide();
  });

  appWindow.on("hide", function (e) {
    tray.displayBalloon({
      icon: nativeImage.createFromPath(path.join(__dirname, "icon.png")),
      iconType: "custom",
      title: "IniNotes...",
      content: "You can always open IniNotes by clicking on its icon here.",
    });

    const place = JSON.stringify([
      ...appWindow.getPosition(),
      ...appWindow.getSize(),
    ]);

    store.set("app", place);

    setTimeout(() => {
      tray.removeBalloon();
    }, 7000);
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
  });

  ipcMain.on("hideapp", () => {
    appWindow.hide();
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

  ipcMain.on("minimizeme", (event) => {
    const myWindow = BrowserWindow.getAllWindows().find(
      (item) => item.webContents.id === event.sender.id
    );
    myWindow.minimize();
  });

  ipcMain.on("tryclosing", () => {
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
      myViewers.forEach((item) => {
        const myWindow = allWindows.find(
          (window) => window.webContents.id === item.id
        );

        console.log(item.id);
        myWindow.close();
      });

      appWindow.show();
      appWindow.focus();
      appWindow.webContents.postMessage("logout", {});
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

    const image = nativeImage.createFromDataURL(data);
    clipboard.writeImage(image);

    //eslint-disable-next-line

    screenShotterWindow.hide();
    cutterWindow.show();
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
    updateContextMenu();
  });

  ipcMain.on("versioning", (event, data) => {
    const version = data.version;

    const oldVersion = store.get("version");

    store.set("version", version);
    grandom = version;

    if (version !== oldVersion && oldVersion) {
      const appURL = "https://app.ininotes.com/help/help?i=" + grandom;

      helpWindow.loadURL(appURL);

      const appURLCutter = "https://app.ininotes.com/app/clipper/?a=" + grandom;

      cutterWindow.loadURL(appURLCutter);

      myViewers.forEach((webItem) => {
        const myWindow = BrowserWindow.getAllWindows().find(
          (item) => item.webContents.id === webItem.id
        );

        myWindow.loadURL(
          "https://app.ininotes.com/app/beditor?id=" +
            webItem.url +
            "%2f&a=" +
            grandom
        );
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
    img = await screenshotDesktop();

    if (!Buffer.isBuffer(img)) {
      return;
    }
  } catch (e) {
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
      accelerator: "CommandOrControl+F2",
      click: () => {
        showCutter();
      },
    },
    {
      label: "Clipboard",
      type: "normal",
      accelerator: "F2",
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

    BrowserWindow.getAllWindows().forEach((window) =>
      window.removeAllListeners()
    );
  });

  tray = new Tray(appIcon);

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

  globalShortcut.register("CommandOrControl+F2", async () => {
    if (screenShotterWindow.isVisible()) {
      return;
    }
    await showCutter();
  });

  globalShortcut.register("F2", async () => {
    if (screenShotterWindow.isVisible()) {
      return;
    }
    cutterWindow.show();
  });

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
  "https://app.ininotes.com",
  "https://docs.google.com",
  "https://drive.google.com",
];
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (!allowedNavigationDestinations.includes(parsedUrl.origin)) {
      event.preventDefault();
    }
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
