import { useContext } from "react";
import { ThemeModeContext } from "./themeContextValue";

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    return {
      mode: "light",
      toggleTheme: () => {},
      setMode: () => {},
    };
  }
  return context;
}
