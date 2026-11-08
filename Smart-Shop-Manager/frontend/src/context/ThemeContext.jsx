import { useCallback, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getTheme } from "../assets/styles/theme";
import { loadSettings, saveSettings } from "../services/storage/settingsStorage";
import { ThemeModeContext } from "./themeContextValue";

export function ThemeModeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      const current = loadSettings();
      return current?.theme === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  const setMode = useCallback((nextMode) => {
    const validMode = nextMode === "dark" ? "dark" : "light";
    setModeState(validMode);
    try {
      const current = loadSettings();
      saveSettings({ ...current, theme: validMode });
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  const theme = useMemo(() => getTheme(mode), [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      setMode,
    }),
    [mode, toggleTheme, setMode]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
