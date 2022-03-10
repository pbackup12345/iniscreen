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
} = require("electron");

const path = require("path");
const screenshotDesktop = require("screenshot-desktop");

const url = require("url");

let screenShotterWindow;
let titlebar;
let cutterWindow;
let appWindow;
let tray;

let appIcon = nativeImage.createFromPath(
  path.join(__dirname, "logo32Template@2x.png")
);

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
    titleBarStyle: "customButtonsOnHover",

    fullscreenable: false,
    minimizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // cutterWindow.webContents.openDevTools();

  // In production, set the initial browser path to the local bundle generated
  // by the Create React App build process.
  // In development, set it to localhost to allow live/hot-reloading.
  const appURL = "https://app.ininotes.com";

  cutterWindow.loadURL(appURL + "/app/clipper/?a=435");
  // cutterWindow.loadURL(appURL);

  // Automatically open Chrome's DevTools in development mode.
  if (!app.isPackaged) {
    // cutterWindow.webContents.openDevTools();
  }

  cutterWindow.on("close", function (e) {
    e.preventDefault();
    cutterWindow.hide();
  });
}

function createAppWindow() {
  // const disp = screen.getPrimaryDisplay();

  appWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    x: 24,
    y: 24,
    frame: false,
    titleBarStyle: "customButtonsOnHover",

    // Set the path of an additional "preload" script that can be used to
    // communicate between node-land and browser-land.
    show: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preloadmain.js"),
      sandbox: true,
    },
    resizable: true,
  });

  //  appWindow.webContents.openDevTools();

  // In production, set the initial browser path to the local bundle generated
  // by the Create React App build process.
  // In development, set it to localhost to allow live/hot-reloading.
  const appURL = "https://app.ininotes.com?a=110";

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
    console.log("close");
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

    setTimeout(() => {
      tray.removeBalloon();
    }, 3000);
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

  ipcMain.on("opacity", () => {
    screenShotterWindow.setOpacity(1);
  });

  ipcMain.on("hidemain", () => {
    cutterWindow.hide();
  });

  ipcMain.on("hideshowmain", () => {
    cutterWindow.hide();
    appWindow.show();
  });

  ipcMain.on("showmain", () => {
    appWindow.show();
    cutterWindow.hide();
  });

  ipcMain.on("picture", async (event, data) => {
    //eslint-disable-next-line

    const image = nativeImage.createFromDataURL(data);
    clipboard.writeImage(image);

    //eslint-disable-next-line

    screenShotterWindow.hide();
    cutterWindow.show();
  });

  // screenShotterWindow.webContents.openDevTools();

  screenShotterWindow.on("close", function (e) {
    e.preventDefault();
    screenShotterWindow.hide();
  });
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
    console.log(e);
    cutterWindow.removeAllListeners();
    screenShotterWindow.removeAllListeners();
    appWindow.removeAllListeners();
  });

  tray = new Tray(appIcon);

  tray.on("click", function () {
    tray.popUpContextMenu();
  });

  tray.setToolTip("IniNotes. Click to start...");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "IniNotes",
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
    {
      label: "Quit",
      type: "normal",
      click: () => {
        console.log("buci");
        app.quit();
      },
    },
  ]);

  tray.setToolTip("This is my application.");
  tray.setContextMenu(contextMenu);

  createCutterWindow();
  createScreenShotWindow();
  createAppWindow();

  setupLocalFilesNormalizerProxy();

  const showCutter = async () => {
    console.log("CommandOrControl+F1 is pressed");
    // Type "Hello World".

    let img;
    try {
      img = await screenshotDesktop();

      console.log(typeof img);
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

    if (
      x !== left ||
      y !== top ||
      fullHeight !== height ||
      fullWidth !== width
    ) {
      screenShotterWindow.setSize(
        Math.floor(fullWidth),
        Math.floor(fullHeight)
      );

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
  console.log("hufi");
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
