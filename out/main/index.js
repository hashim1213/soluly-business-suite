import { app, BrowserWindow, shell, Menu, ipcMain, nativeImage, Tray } from "electron";
import { join } from "path";
import Store from "electron-store";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
function createMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    // App menu (macOS only)
    ...isMac ? [
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" }
        ]
      }
    ] : [],
    // File menu
    {
      label: "File",
      submenu: [
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+N",
          click: () => {
          }
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" }
      ]
    },
    // Edit menu
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...isMac ? [
          { role: "pasteAndMatchStyle" },
          { role: "delete" },
          { role: "selectAll" }
        ] : [
          { role: "delete" },
          { type: "separator" },
          { role: "selectAll" }
        ]
      ]
    },
    // View menu
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        {
          label: "Toggle Developer Tools",
          accelerator: isMac ? "Alt+Command+I" : "Ctrl+Shift+I",
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow && !focusedWindow.isDestroyed()) {
              focusedWindow.webContents.toggleDevTools();
            }
          }
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    // Window menu
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...isMac ? [
          { type: "separator" },
          { role: "front" },
          { type: "separator" },
          { role: "window" }
        ] : [{ role: "close" }]
      ]
    },
    // Help menu
    {
      role: "help",
      submenu: [
        {
          label: "Soluly Website",
          click: async () => {
            await shell.openExternal("https://soluly.com");
          }
        },
        {
          label: "Documentation",
          click: async () => {
            await shell.openExternal("https://soluly.com/docs");
          }
        },
        { type: "separator" },
        {
          label: "Contact Support",
          click: async () => {
            await shell.openExternal("mailto:support@soluly.com");
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
const isDev = !app.isPackaged;
let isQuitting = false;
process.on("uncaughtException", (error) => {
  if (isQuitting || error.message?.includes("Object has been destroyed")) {
    return;
  }
  console.error("Uncaught exception:", error);
});
process.on("unhandledRejection", (reason) => {
  if (isQuitting) return;
  if (reason instanceof Error && reason.message?.includes("Object has been destroyed")) {
    return;
  }
  console.error("Unhandled rejection:", reason);
});
function isSenderValid(event) {
  if (isQuitting) return false;
  try {
    return event.sender && !event.sender.isDestroyed();
  } catch {
    return false;
  }
}
const store = new Store();
let mainWindow = null;
let tray = null;
let timerState = {
  isRunning: false,
  elapsed: "00:00:00",
  description: ""
};
function getIconPath() {
  if (isDev) {
    return join(__dirname, "../../public/logo.png");
  }
  return join(__dirname, "../renderer/logo.png");
}
function isWindowValid(win) {
  if (isQuitting) return false;
  try {
    return win !== null && !win.isDestroyed();
  } catch {
    return false;
  }
}
function createWindow() {
  let icon;
  try {
    icon = nativeImage.createFromPath(getIconPath());
  } catch {
  }
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: "default",
    title: "Soluly",
    icon,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.platform === "darwin" && app.dock && icon) {
    try {
      app.dock.setIcon(icon);
    } catch {
    }
  }
  const win = mainWindow;
  win.once("ready-to-show", () => {
    if (isWindowValid(win)) {
      win.show();
    }
  });
  win.once("closed", () => {
    mainWindow = null;
    if (process.platform !== "darwin") {
      isQuitting = true;
    }
  });
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}
function createTray() {
  if (tray) return;
  let trayIcon;
  try {
    const iconPath = getIconPath();
    const originalIcon = nativeImage.createFromPath(iconPath);
    trayIcon = originalIcon.resize({ width: 16, height: 16 });
    trayIcon.setTemplateImage(true);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon);
  tray.setToolTip("Soluly");
  if (process.platform === "darwin") {
    tray.setTitle("");
  }
  tray.on("click", () => {
    if (isWindowValid(mainWindow)) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
  updateTrayMenu();
}
function updateTrayMenu() {
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    {
      label: timerState.isRunning ? `⏱ ${timerState.elapsed}` : "Timer stopped",
      enabled: false
    },
    ...timerState.description ? [{
      label: timerState.description.substring(0, 30) + (timerState.description.length > 30 ? "..." : ""),
      enabled: false
    }] : [],
    { type: "separator" },
    {
      label: timerState.isRunning ? "⏸ Pause" : "▶ Start",
      click: () => {
        if (isWindowValid(mainWindow)) {
          mainWindow.webContents.send("tray-timer-action", timerState.isRunning ? "pause" : "start");
        }
      }
    },
    {
      label: "⏹ Stop & Save",
      enabled: timerState.isRunning || timerState.elapsed !== "00:00:00",
      click: () => {
        if (isWindowValid(mainWindow)) {
          mainWindow.webContents.send("tray-timer-action", "stop");
        }
      }
    },
    { type: "separator" },
    {
      label: "Open Soluly",
      click: () => {
        if (isWindowValid(mainWindow)) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
}
function updateTrayTimer(state) {
  timerState = state;
  if (!tray) return;
  if (process.platform === "darwin") {
    if (state.isRunning) {
      tray.setTitle(`⏱ ${state.elapsed}`);
    } else if (state.elapsed !== "00:00:00") {
      tray.setTitle(`⏸ ${state.elapsed}`);
    } else {
      tray.setTitle("");
    }
  }
  updateTrayMenu();
}
function registerProtocol() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("soluly", process.execPath, [process.argv[1]]);
    }
  } else {
    app.setAsDefaultProtocolClient("soluly");
  }
}
function handleProtocolUrl(url) {
  if (!isWindowValid(mainWindow)) return;
  if (url.includes("auth/gmail/callback")) {
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get("code");
      if (code && isWindowValid(mainWindow)) {
        mainWindow.webContents.send("oauth-callback", { provider: "gmail", code });
      }
    } catch {
    }
  }
  if (isWindowValid(mainWindow)) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
}
ipcMain.handle("store:get", (event, key) => {
  try {
    if (!isSenderValid(event)) return null;
    return store.get(key);
  } catch {
    return null;
  }
});
ipcMain.handle("store:set", (event, key, value) => {
  try {
    if (!isSenderValid(event)) return;
    store.set(key, value);
  } catch {
  }
});
ipcMain.handle("store:delete", (event, key) => {
  try {
    if (!isSenderValid(event)) return;
    store.delete(key);
  } catch {
  }
});
ipcMain.handle("store:clear", (event) => {
  try {
    if (!isSenderValid(event)) return;
    store.clear();
  } catch {
  }
});
ipcMain.handle("tray:updateTimer", (event, state) => {
  try {
    if (!isSenderValid(event)) return;
    updateTrayTimer(state);
  } catch {
  }
});
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith("soluly://"));
    if (url) {
      handleProtocolUrl(url);
    }
    if (isWindowValid(mainWindow)) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.soluly.app");
  }
  registerProtocol();
  createMenu();
  if (process.platform === "darwin") {
    createTray();
  }
  createWindow();
  app.on("activate", () => {
    if (!isQuitting && BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleProtocolUrl(url);
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", () => {
  isQuitting = true;
});
app.on("will-quit", () => {
  isQuitting = true;
  if (tray) {
    tray.destroy();
    tray = null;
  }
  try {
    ipcMain.removeHandler("store:get");
    ipcMain.removeHandler("store:set");
    ipcMain.removeHandler("store:delete");
    ipcMain.removeHandler("store:clear");
    ipcMain.removeHandler("tray:updateTimer");
  } catch {
  }
});
