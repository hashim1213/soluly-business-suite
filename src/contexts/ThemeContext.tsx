import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeStyle = "default" | "professional" | "modern" | "minimal" | "green" | "pink" | "pastel";

interface ThemeContextType {
  mode: ThemeMode;
  style: ThemeStyle;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = "soluly-theme-mode";
const THEME_STYLE_KEY = "soluly-theme-style";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function safeLocalStorage(key: string, defaultValue: string): string {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch {
    return defaultValue;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return safeLocalStorage(THEME_MODE_KEY, "light") as ThemeMode;
  });

  const [style, setStyleState] = useState<ThemeStyle>(() => {
    return safeLocalStorage(THEME_STYLE_KEY, "default") as ThemeStyle;
  });

  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">(() => {
    const savedMode = safeLocalStorage(THEME_MODE_KEY, "light") as ThemeMode;
    return savedMode === "system" ? getSystemTheme() : savedMode;
  });

  // Update resolved mode when mode changes or system preference changes
  useEffect(() => {
    const updateResolvedMode = () => {
      const newResolved = mode === "system" ? getSystemTheme() : mode;
      setResolvedMode(newResolved);
    };

    updateResolvedMode();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (mode === "system") {
        updateResolvedMode();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove("light", "dark");
    root.classList.remove("theme-default", "theme-professional", "theme-modern", "theme-minimal", "theme-green", "theme-pink", "theme-pastel");

    // Add current theme classes
    root.classList.add(resolvedMode);
    root.classList.add(`theme-${style}`);
  }, [resolvedMode, style]);

  const setMode = (newMode: ThemeMode) => {
    try {
      localStorage.setItem(THEME_MODE_KEY, newMode);
    } catch {
      // Ignore localStorage errors
    }
    setModeState(newMode);
  };

  const setStyle = (newStyle: ThemeStyle) => {
    try {
      localStorage.setItem(THEME_STYLE_KEY, newStyle);
    } catch {
      // Ignore localStorage errors
    }
    setStyleState(newStyle);
  };

  return (
    <ThemeContext.Provider value={{ mode, style, resolvedMode, setMode, setStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
