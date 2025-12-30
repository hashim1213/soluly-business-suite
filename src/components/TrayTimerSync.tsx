import { useEffect, useState, useCallback } from "react";
import { isElectron } from "@/lib/platform";

interface SessionState {
  isRunning: boolean;
  startTime: number | null;
  pausedTime: number;
  projectId: string;
  description: string;
}

const STORAGE_KEY = "soluly_session_tracker";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getSessionFromStorage(): SessionState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { isRunning: false, startTime: null, pausedTime: 0, projectId: "", description: "" };
    }
  }
  return { isRunning: false, startTime: null, pausedTime: 0, projectId: "", description: "" };
}

function calculateElapsed(session: SessionState): number {
  if (!session.isRunning || !session.startTime) {
    return session.pausedTime;
  }
  return session.pausedTime + (Date.now() - session.startTime);
}

/**
 * This component syncs the session timer to the macOS menu bar tray.
 * It runs independently of the SessionTracker component so the tray
 * continues updating even when navigating away from the My Hours page.
 */
export function TrayTimerSync() {
  const [session, setSession] = useState<SessionState>(getSessionFromStorage);
  const [elapsed, setElapsed] = useState(() => calculateElapsed(getSessionFromStorage()));

  // Poll localStorage for changes (since storage events don't fire in the same tab)
  useEffect(() => {
    const checkStorage = () => {
      const current = getSessionFromStorage();
      setSession(current);
    };

    // Check immediately and then every 500ms
    checkStorage();
    const interval = setInterval(checkStorage, 500);
    return () => clearInterval(interval);
  }, []);

  // Update elapsed time every second when running
  useEffect(() => {
    if (!session.isRunning || !session.startTime) {
      setElapsed(session.pausedTime);
      return;
    }

    const updateElapsed = () => {
      setElapsed(session.pausedTime + (Date.now() - session.startTime!));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [session.isRunning, session.startTime, session.pausedTime]);

  // Sync to tray
  useEffect(() => {
    if (isElectron() && window.electronAPI) {
      window.electronAPI.updateTrayTimer({
        isRunning: session.isRunning,
        elapsed: formatDuration(elapsed),
        description: session.description,
      });
    }
  }, [session.isRunning, elapsed, session.description]);

  // Handle tray actions
  const handleStart = useCallback(() => {
    const current = getSessionFromStorage();
    const updated = {
      ...current,
      isRunning: true,
      startTime: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSession(updated);
  }, []);

  const handlePause = useCallback(() => {
    const current = getSessionFromStorage();
    const updated = {
      ...current,
      isRunning: false,
      pausedTime: current.pausedTime + (Date.now() - (current.startTime || Date.now())),
      startTime: null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSession(updated);
  }, []);

  const handleStop = useCallback(() => {
    // Just pause - the SessionTracker component will handle the save dialog
    // when the user returns to My Hours
    handlePause();
  }, [handlePause]);

  // Listen for tray timer actions
  useEffect(() => {
    if (isElectron() && window.electronAPI) {
      window.electronAPI.onTrayTimerAction((action) => {
        if (action === 'start') {
          handleStart();
        } else if (action === 'pause') {
          handlePause();
        } else if (action === 'stop') {
          handleStop();
        }
      });

      return () => {
        window.electronAPI.removeTrayTimerActionListener();
      };
    }
  }, [handleStart, handlePause, handleStop]);

  // This component doesn't render anything
  return null;
}
