/**
 * Cross-platform storage adapter
 * Uses electron-store in Electron, localStorage in web
 */

import { isElectron } from './platform';

/**
 * Storage interface that works in both Electron and web
 */
export const storage = {
  /**
   * Get a value from storage
   */
  getItem: async (key: string): Promise<string | null> => {
    if (isElectron() && window.electronAPI) {
      const value = await window.electronAPI.getStoreValue(key);
      return value as string | null;
    }
    return localStorage.getItem(key);
  },

  /**
   * Set a value in storage
   */
  setItem: async (key: string, value: string): Promise<void> => {
    if (isElectron() && window.electronAPI) {
      await window.electronAPI.setStoreValue(key, value);
      return;
    }
    localStorage.setItem(key, value);
  },

  /**
   * Remove a value from storage
   */
  removeItem: async (key: string): Promise<void> => {
    if (isElectron() && window.electronAPI) {
      await window.electronAPI.removeStoreValue(key);
      return;
    }
    localStorage.removeItem(key);
  },
};

/**
 * Synchronous storage interface for Supabase auth adapter
 * Falls back to localStorage in both Electron and web
 * (Supabase auth requires synchronous storage)
 */
export const syncStorage = {
  getItem: (key: string): string | null => {
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
};

/**
 * Custom storage adapter for Supabase that works in Electron
 * Uses localStorage which is available in Electron's renderer process
 */
export const supabaseStorageAdapter = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage might be full or disabled
      console.warn('Failed to save to localStorage:', key);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors when removing
    }
  },
};
