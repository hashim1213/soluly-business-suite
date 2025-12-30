import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // Platform detection
  isElectron: true,
  platform: process.platform,
  // Electron store operations
  getStoreValue: (key) => ipcRenderer.invoke("store:get", key),
  setStoreValue: (key, value) => ipcRenderer.invoke("store:set", key, value),
  removeStoreValue: (key) => ipcRenderer.invoke("store:delete", key),
  clearStore: () => ipcRenderer.invoke("store:clear"),
  // Menu bar tray timer operations
  updateTrayTimer: (state) => ipcRenderer.invoke("tray:updateTimer", state),
  onTrayTimerAction: (callback) => {
    ipcRenderer.on("tray-timer-action", (_event, action) => callback(action));
  },
  removeTrayTimerActionListener: () => {
    ipcRenderer.removeAllListeners("tray-timer-action");
  },
  // OAuth callback listener
  onOAuthCallback: (callback) => {
    ipcRenderer.on("oauth-callback", (_event, data) => callback(data));
  },
  // Remove OAuth callback listener
  removeOAuthCallback: () => {
    ipcRenderer.removeAllListeners("oauth-callback");
  }
});
