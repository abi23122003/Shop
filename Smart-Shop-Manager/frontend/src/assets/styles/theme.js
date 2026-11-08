import { createTheme } from "@mui/material/styles";

export const lightTokens = {
  primary: "#C2410C",
  primaryHover: "#9A3412",
  accent: "#0F766E",
  background: "#FAF7F2",
  surface: "#FFFFFF",
  text: "#1C1917",
  muted: "#78716C",
  border: "#E7E0D5",
  success: "#166534",
  danger: "#B42318",
};

export const darkTokens = {
  primary: "#F97316",
  primaryHover: "#EA580C",
  accent: "#14B8A6",
  background: "#1C1917",
  surface: "#292524",
  text: "#FAFAF9",
  muted: "#A8A29E",
  border: "#44403C",
  success: "#166534",
  danger: "#B42318",
};

export const tokens = lightTokens;

export function getTheme(mode = "light") {
  const isDark = mode === "dark";
  const currentTokens = isDark ? darkTokens : lightTokens;

  return createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: {
        main: currentTokens.primary,
        dark: currentTokens.primaryHover,
        light: isDark ? "#FB923C" : "#EA580C",
        contrastText: isDark ? "#1C1917" : "#FFFFFF",
        50: isDark ? "rgba(249, 115, 22, 0.12)" : "#FFF7ED",
        100: isDark ? "rgba(249, 115, 22, 0.2)" : "#FFEDD5",
      },
      secondary: {
        main: currentTokens.accent,
        dark: isDark ? "#0F766E" : "#115E59",
        light: isDark ? "#2DD4BF" : "#14B8A6",
        contrastText: "#FFFFFF",
      },
      accent: {
        main: currentTokens.accent,
        dark: isDark ? "#0F766E" : "#115E59",
        contrastText: "#FFFFFF",
      },
      success: {
        main: currentTokens.success,
        dark: "#14532D",
        light: "#22C55E",
        contrastText: "#FFFFFF",
      },
      error: {
        main: currentTokens.danger,
        dark: "#912018",
        light: "#EF4444",
        contrastText: "#FFFFFF",
      },
      warning: {
        main: isDark ? "#F59E0B" : "#92400E",
        dark: "#78350F",
        light: "#FBBF24",
        contrastText: isDark ? "#1C1917" : "#FFFFFF",
      },
      info: {
        main: currentTokens.accent,
        dark: isDark ? "#0F766E" : "#115E59",
        contrastText: "#FFFFFF",
      },
      dashboard: {
        products: currentTokens.primary,
        categories: currentTokens.accent,
        customers: currentTokens.muted,
        sales: currentTokens.success,
      },
      background: {
        default: currentTokens.background,
        paper: currentTokens.surface,
      },
      text: {
        primary: currentTokens.text,
        secondary: currentTokens.muted,
      },
      divider: currentTokens.border,
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: "Inter, Segoe UI, Roboto, Arial, sans-serif",
      h4: { fontWeight: 800, letterSpacing: "-0.02em", color: currentTokens.text },
      h5: { fontWeight: 700, letterSpacing: "-0.01em", color: currentTokens.text },
      h6: { fontWeight: 700, color: currentTokens.text },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: currentTokens.background,
            color: currentTokens.text,
            backgroundImage: isDark
              ? "radial-gradient(circle at top left, rgba(249, 115, 22, 0.05), transparent 32%), radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.04), transparent 24%)"
              : "radial-gradient(circle at top left, rgba(194, 65, 12, 0.08), transparent 32%), radial-gradient(circle at bottom right, rgba(15, 118, 110, 0.06), transparent 24%)",
            backgroundAttachment: "fixed",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: isDark
              ? "linear-gradient(135deg, #1C1917 0%, #292524 60%, #44403C 100%)"
              : "linear-gradient(135deg, #1C1917 0%, #292524 60%, #C2410C 100%)",
            backdropFilter: "blur(14px)",
            boxShadow: isDark
              ? "0 12px 30px rgba(0, 0, 0, 0.4)"
              : "0 12px 30px rgba(28, 25, 23, 0.18)",
            borderBottom: `1px solid ${isDark ? "#44403C" : "rgba(231, 224, 213, 0.2)"}`,
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: currentTokens.surface,
            border: `1px solid ${currentTokens.border}`,
            boxShadow: isDark
              ? "0 18px 45px rgba(0, 0, 0, 0.3)"
              : "0 18px 45px rgba(28, 25, 23, 0.06)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            minHeight: 44,
            "&:focus-visible": {
              outline: "3px solid",
              outlineColor: currentTokens.primary,
              outlineOffset: 2,
            },
          },
          containedPrimary: {
            backgroundColor: currentTokens.primary,
            color: isDark ? "#1C1917" : "#FFFFFF",
            "&:hover": {
              backgroundColor: currentTokens.primaryHover,
            },
          },
          containedSuccess: {
            backgroundColor: currentTokens.success,
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "#14532D",
            },
          },
          containedError: {
            backgroundColor: currentTokens.danger,
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "#912018",
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 44,
            minHeight: 44,
            "&:focus-visible": {
              outline: "3px solid",
              outlineColor: currentTokens.primary,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            minHeight: 44,
            "&:focus-visible": {
              outline: "3px solid",
              outlineColor: currentTokens.primary,
              outlineOffset: 2,
            },
            "&.Mui-selected": {
              backgroundColor: isDark
                ? "rgba(249, 115, 22, 0.18)"
                : "rgba(194, 65, 12, 0.12)",
              color: currentTokens.primary,
              "&:hover": {
                backgroundColor: isDark
                  ? "rgba(249, 115, 22, 0.25)"
                  : "rgba(194, 65, 12, 0.18)",
              },
            },
          },
        },
      },
    },
  });
}

export default getTheme("light");
