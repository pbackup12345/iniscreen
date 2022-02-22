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
} = require("electron");

const path = require("path");
const screenshotDesktop = require("screenshot-desktop");
const url = require("url");

let screenShotterWindow;
let titlebar;
let mainWindow;

// Create the native browser window.
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // Set the path of an additional "preload" script that can be used to
    // communicate between node-land and browser-land.
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // In production, set the initial browser path to the local bundle generated
  // by the Create React App build process.
  // In development, set it to localhost to allow live/hot-reloading.
  const appURL = "https://app.inishare.com";

  mainWindow.loadURL(appURL + "/app/clipper/?a=14");
  // mainWindow.loadURL(appURL);

  // Automatically open Chrome's DevTools in development mode.
  if (!app.isPackaged) {
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on("close", function (e) {
    e.preventDefault();
    mainWindow.hide();
  });
}

const createScreenShotWindow = () => {
  // alert(sc)
  // if (screenShotterWindow !== null) {
  //   return;
  // }
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
    frame: false,
    transparent: true,
    resizable: false,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preloadshot.js"),
    },
  });

  titlebar =
    screenShotterWindow.getSize()[1] - screenShotterWindow.getContentSize()[1];
  screenShotterWindow.hide();

  // screenShotterWindow.webContents.openDevTools();

  screenShotterWindow.setMenuBarVisibility(false);
  screenShotterWindow.loadURL(appURL);

  ipcMain.on("hideme", () => {
    screenShotterWindow.hide();
  });

  ipcMain.on("picture", async (event, data) => {
    //eslint-disable-next-line

    console.log(data);
    const image = nativeImage.createFromDataURL(data);
    clipboard.writeImage(image);

    console.log(clipboard.readImage().toDataURL());

    //eslint-disable-next-line

    screenShotterWindow.hide();
    mainWindow.show();
  });

  // screenShotterWindow.webContents.openDevTools();

  screenShotterWindow.on("close", function (e) {
    e.preventDefault();
    screenShotterWindow.hide();
  });

  screenShotterWindow.on("closed", function () {
    console.log("closing");
    screenShotterWindow = null;
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
app.whenReady().then(() => {
  createWindow();
  createScreenShotWindow();
  setupLocalFilesNormalizerProxy();

  const ret = globalShortcut.register("CommandOrControl+B", async () => {
    console.log("CommandOrControl+B is pressed");
    // Type "Hello World".

    const img = await screenshotDesktop();
    console.log(img);

    //@ts-ignore
    const allScreens = screen.getAllDisplays();

    const [x, y] = screenShotterWindow.getPosition();
    let [width, height] = screenShotterWindow.getSize();

    let fullWidth = 0;
    let fullHeight = 0;
    let left = 0;
    let top = 0;

    allScreens.forEach((screen) => {
      left = Math.min(left, screen.bounds.x * screen.scaleFactor);
      top = Math.min(top, screen.bounds.y * screen.scaleFactor);
      fullHeight = fullHeight + screen.size.height * screen.scaleFactor;
      fullWidth = fullWidth + screen.size.width * screen.scaleFactor;
      console.log(screen.size.width);
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
      screenShotterWindow.setOpacity(1);
    }, 100);
  });

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
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
const allowedNavigationDestinations = "https://my-electron-app.com";
app.on("web-contents-createds", (event, contents) => {
  contents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (!allowedNavigationDestinations.includes(parsedUrl.origin)) {
      event.preventDefault();
    }
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on("shotscreen", (event, arg) => {
  console.log(arg);
});
