import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, Platform } from "react-native";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppMode = "light" | "dark";

export type ThemePalette = {
  background: string; surface: string; surfaceAlt: string; text: string;
  muted: string; border: string; primary: string; primaryStrong: string;
  onPrimary: string; accent: string; softGreen: string; hero: string;
  danger: string; shadow: string;
};

const palettes: Record<AppMode, ThemePalette> = {
  light: {
    background: "#F4F7F3", surface: "#FFFFFF", surfaceAlt: "#ECF3EE",
    text: "#102C27", muted: "#667A75", border: "#DEE9E2",
    primary: "#127C64", primaryStrong: "#0D4035", onPrimary: "#FFFFFF",
    accent: "#C39346", softGreen: "#E2F4E9", hero: "#103F35",
    danger: "#B84747", shadow: "#183D31",
  },
  dark: {
    background: "#081A17", surface: "#102923", surfaceAlt: "#19382E",
    text: "#F1F7F1", muted: "#A3B9B0", border: "#28493D",
    primary: "#48D3A3", primaryStrong: "#0E382F", onPrimary: "#071C16",
    accent: "#E4BB73", softGreen: "#1A4839", hero: "#153E32",
    danger: "#F28F83", shadow: "#000000",
  },
};

const THEME_KEY = "wildsentinel_appearance_v1";
const ThemeContext = createContext<{
  mode: AppMode; dark: boolean; colors: ThemePalette; toggle: () => void;
  setMode: (mode: AppMode) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("light");
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (alive && (stored === "light" || stored === "dark")) setModeState(stored);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (Platform.OS !== "web") Appearance.setColorScheme(mode);
  }, [mode]);
  const setMode = (value: AppMode) => {
    setModeState(value);
    void AsyncStorage.setItem(THEME_KEY, value).catch(() => {});
  };
  const value = useMemo(() => ({
    mode, dark: mode === "dark", colors: palettes[mode],
    toggle: () => setMode(mode === "dark" ? "light" : "dark"), setMode,
  }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used inside ThemeProvider");
  return context;
}
