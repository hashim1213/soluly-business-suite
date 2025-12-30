import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform detection
  isElectron: true,
  platform: process.platform,

  // Electron store operations
  getStoreValue: (key: string) => ipcRenderer.invoke('store:get', key),
  setStoreValue: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
  removeStoreValue: (key: string) => ipcRenderer.invoke('store:delete', key),
  clearStore: () => ipcRenderer.invoke('store:clear'),

  // Menu bar tray timer operations
  updateTrayTimer: (state: { isRunning: boolean; elapsed: string; description: string }) =>
    ipcRenderer.invoke('tray:updateTimer', state),
  onTrayTimerAction: (callback: (action: 'start' | 'pause' | 'stop') => void) => {
    ipcRenderer.on('tray-timer-action', (_event, action) => callback(action));
  },
  removeTrayTimerActionListener: () => {
    ipcRenderer.removeAllListeners('tray-timer-action');
  },

  // OAuth callback listener
  onOAuthCallback: (callback: (data: { provider: string; code: string }) => void) => {
    ipcRenderer.on('oauth-callback', (_event, data) => callback(data));
  },

  // Remove OAuth callback listener
  removeOAuthCallback: () => {
    ipcRenderer.removeAllListeners('oauth-callback');
  },
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      isElectron: boolean;
      platform: NodeJS.Platform;
      getStoreValue: (key: string) => Promise<unknown>;
      setStoreValue: (key: string, value: unknown) => Promise<void>;
      removeStoreValue: (key: string) => Promise<void>;
      clearStore: () => Promise<void>;
      updateTrayTimer: (state: { isRunning: boolean; elapsed: string; description: string }) => Promise<void>;
      onTrayTimerAction: (callback: (action: 'start' | 'pause' | 'stop') => void) => void;
      removeTrayTimerActionListener: () => void;
      onOAuthCallback: (callback: (data: { provider: string; code: string }) => void) => void;
      removeOAuthCallback: () => void;
    };
  }
}
