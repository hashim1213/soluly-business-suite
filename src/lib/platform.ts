/**
 * Platform detection utilities for Electron/Web hybrid app
 */

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.electronAPI !== 'undefined' &&
         window.electronAPI.isElectron === true;
}

/**
 * Get the app base URL
 * Returns 'soluly://' for Electron, window.location.origin for web
 */
export function getAppBaseUrl(): string {
  if (isElectron()) {
    return 'soluly://';
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/**
 * Get the current platform
 */
export function getPlatform(): NodeJS.Platform | 'web' {
  if (isElectron() && window.electronAPI?.platform) {
    return window.electronAPI.platform;
  }
  return 'web';
}

/**
 * Check if running on macOS
 */
export function isMac(): boolean {
  return getPlatform() === 'darwin';
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return getPlatform() === 'win32';
}

/**
 * Check if running on Linux
 */
export function isLinux(): boolean {
  return getPlatform() === 'linux';
}

/**
 * Check if running in a desktop environment (Electron)
 */
export function isDesktop(): boolean {
  return isElectron();
}

/**
 * Check if running in a web browser
 */
export function isWeb(): boolean {
  return !isElectron();
}
