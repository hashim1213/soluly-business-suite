import { app, BrowserWindow, shell, ipcMain, nativeImage, IpcMainInvokeEvent, Tray, Menu } from 'electron';
import { join } from 'path';
import Store from 'electron-store';
import { createMenu } from './menu';

// Check if running in development mode
const isDev = !app.isPackaged;

// Track if app is quitting to prevent "Object has been destroyed" errors
let isQuitting = false;

// Handle uncaught exceptions FIRST (especially "Object has been destroyed" during shutdown)
process.on('uncaughtException', (error) => {
  // Ignore "Object has been destroyed" errors - they happen during shutdown
  if (isQuitting || error.message?.includes('Object has been destroyed')) {
    return;
  }
  console.error('Uncaught exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  // Ignore errors during shutdown
  if (isQuitting) return;
  // Ignore "Object has been destroyed" errors in promises
  if (reason instanceof Error && reason.message?.includes('Object has been destroyed')) {
    return;
  }
  console.error('Unhandled rejection:', reason);
});

// Helper to safely handle IPC events
function isSenderValid(event: IpcMainInvokeEvent): boolean {
  if (isQuitting) return false;
  try {
    return event.sender && !event.sender.isDestroyed();
  } catch {
    return false;
  }
}

// Initialize electron store for persistent storage
const store = new Store();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let timerState = {
  isRunning: false,
  elapsed: '00:00:00',
  description: '',
};

// Get the app icon path
function getIconPath(): string {
  if (isDev) {
    return join(__dirname, '../../public/logo.png');
  }
  return join(__dirname, '../renderer/logo.png');
}

// Check if window is valid
function isWindowValid(win: BrowserWindow | null): win is BrowserWindow {
  if (isQuitting) return false;
  try {
    return win !== null && !win.isDestroyed();
  } catch {
    return false;
  }
}

function createWindow(): void {
  // Load app icon
  let icon: Electron.NativeImage | undefined;
  try {
    icon = nativeImage.createFromPath(getIconPath());
  } catch {
    // Icon loading failed, continue without it
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: 'default',
    title: 'Soluly',
    icon: icon,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Set dock icon on macOS
  if (process.platform === 'darwin' && app.dock && icon) {
    try {
      app.dock.setIcon(icon);
    } catch {
      // Ignore dock icon errors
    }
  }

  const win = mainWindow;

  // Show window when ready
  win.once('ready-to-show', () => {
    if (isWindowValid(win)) {
      win.show();
    }
  });

  // Clean up reference when window is closed
  win.once('closed', () => {
    mainWindow = null;
    // On non-macOS, closing window means quitting
    if (process.platform !== 'darwin') {
      isQuitting = true;
    }
  });

  // Handle external links
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load the app
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Create menu bar tray
function createTray(): void {
  if (tray) return;

  // Load and resize icon for menu bar (16x16 for macOS)
  let trayIcon: Electron.NativeImage;
  try {
    const iconPath = getIconPath();
    const originalIcon = nativeImage.createFromPath(iconPath);
    // Resize to 16x16 for menu bar
    trayIcon = originalIcon.resize({ width: 16, height: 16 });
    // Mark as template so it adapts to light/dark menu bar
    trayIcon.setTemplateImage(true);
  } catch {
    // Fallback to empty icon if loading fails
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Soluly');

  // On macOS, we can show text in the menu bar next to the icon
  if (process.platform === 'darwin') {
    tray.setTitle('');
  }

  // Click on tray icon opens/focuses the app
  tray.on('click', () => {
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

function updateTrayMenu(): void {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: timerState.isRunning ? `⏱ ${timerState.elapsed}` : 'Timer stopped',
      enabled: false,
    },
    ...(timerState.description ? [{
      label: timerState.description.substring(0, 30) + (timerState.description.length > 30 ? '...' : ''),
      enabled: false,
    }] : []),
    { type: 'separator' as const },
    {
      label: timerState.isRunning ? '⏸ Pause' : '▶ Start',
      click: () => {
        if (isWindowValid(mainWindow)) {
          mainWindow.webContents.send('tray-timer-action', timerState.isRunning ? 'pause' : 'start');
        }
      },
    },
    {
      label: '⏹ Stop & Save',
      enabled: timerState.isRunning || timerState.elapsed !== '00:00:00',
      click: () => {
        if (isWindowValid(mainWindow)) {
          mainWindow.webContents.send('tray-timer-action', 'stop');
        }
      },
    },
    { type: 'separator' as const },
    {
      label: 'Open Soluly',
      click: () => {
        if (isWindowValid(mainWindow)) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function updateTrayTimer(state: { isRunning: boolean; elapsed: string; description: string }): void {
  timerState = state;

  if (!tray) return;

  // On macOS, show timer in menu bar when running
  if (process.platform === 'darwin') {
    if (state.isRunning) {
      tray.setTitle(`⏱ ${state.elapsed}`);
    } else if (state.elapsed !== '00:00:00') {
      tray.setTitle(`⏸ ${state.elapsed}`);
    } else {
      tray.setTitle('');
    }
  }

  updateTrayMenu();
}

// Register custom protocol for OAuth callbacks
function registerProtocol(): void {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('soluly', process.execPath, [process.argv[1]]);
    }
  } else {
    app.setAsDefaultProtocolClient('soluly');
  }
}

// Handle protocol URLs (OAuth callbacks, deep links)
function handleProtocolUrl(url: string): void {
  if (!isWindowValid(mainWindow)) return;

  // Forward OAuth callback to renderer
  if (url.includes('auth/gmail/callback')) {
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      if (code && isWindowValid(mainWindow)) {
        mainWindow.webContents.send('oauth-callback', { provider: 'gmail', code });
      }
    } catch {
      // Invalid URL, ignore
    }
  }

  // Bring window to front
  if (isWindowValid(mainWindow)) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
}

// IPC handlers for electron-store
ipcMain.handle('store:get', (event, key: string) => {
  try {
    if (!isSenderValid(event)) return null;
    return store.get(key);
  } catch {
    return null;
  }
});

ipcMain.handle('store:set', (event, key: string, value: unknown) => {
  try {
    if (!isSenderValid(event)) return;
    store.set(key, value);
  } catch {
    // Ignore errors during shutdown
  }
});

ipcMain.handle('store:delete', (event, key: string) => {
  try {
    if (!isSenderValid(event)) return;
    store.delete(key);
  } catch {
    // Ignore errors during shutdown
  }
});

ipcMain.handle('store:clear', (event) => {
  try {
    if (!isSenderValid(event)) return;
    store.clear();
  } catch {
    // Ignore errors during shutdown
  }
});

// Tray timer IPC handlers
ipcMain.handle('tray:updateTimer', (event, state: { isRunning: boolean; elapsed: string; description: string }) => {
  try {
    if (!isSenderValid(event)) return;
    updateTrayTimer(state);
  } catch {
    // Ignore errors
  }
});

// Handle protocol on Windows/Linux (second instance)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    // Find the URL in command line args
    const url = commandLine.find((arg) => arg.startsWith('soluly://'));
    if (url) {
      handleProtocolUrl(url);
    }
    // Focus the main window
    if (isWindowValid(mainWindow)) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.soluly.app');
  }

  // Register protocol handler
  registerProtocol();

  // Create menu
  createMenu();

  // Create tray for menu bar timer (macOS)
  if (process.platform === 'darwin') {
    createTray();
  }

  // Create main window
  createWindow();

  // macOS: re-create window when dock icon clicked
  app.on('activate', () => {
    if (!isQuitting && BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle protocol on macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleProtocolUrl(url);
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Set quitting flag early
app.on('before-quit', () => {
  isQuitting = true;
});

// Clean up when quitting
app.on('will-quit', () => {
  isQuitting = true;
  // Destroy tray
  if (tray) {
    tray.destroy();
    tray = null;
  }
  // Remove IPC handlers to prevent "Object has been destroyed" errors
  try {
    ipcMain.removeHandler('store:get');
    ipcMain.removeHandler('store:set');
    ipcMain.removeHandler('store:delete');
    ipcMain.removeHandler('store:clear');
    ipcMain.removeHandler('tray:updateTimer');
  } catch {
    // Ignore errors during cleanup
  }
});
