import { createTheme } from "@mui/material/styles";

export const tokens = {
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

export default createTheme({
  palette: {
    primary: {
      main: tokens.primary,
      dark: tokens.primaryHover,
      light: "#EA580C",
      contrastText: tokens.surface,
      50: "#FFF7ED",
      100: "#FFEDD5",
    },
    secondary: {
      main: tokens.accent,
      dark: "#115E59",
      light: "#14B8A6",
      contrastText: tokens.surface,
    },
    accent: {
      main: tokens.accent,
      dark: "#115E59",
      contrastText: tokens.surface,
    },
    success: {
      main: tokens.success,
      dark: "#14532D",
      light: "#22C55E",
      contrastText: tokens.surface,
    },
    error: {
      main: tokens.danger,
      dark: "#912018",
      light: "#EF4444",
      contrastText: tokens.surface,
    },
    warning: {
      main: "#92400E",
      dark: "#78350F",
      light: "#F59E0B",
      contrastText: tokens.surface,
    },
    info: {
      main: tokens.accent,
      dark: "#115E59",
      contrastText: tokens.surface,
    },
    dashboard: {
      products: tokens.primary,
      categories: tokens.accent,
      customers: tokens.muted,
      sales: tokens.success,
    },
    background: {
      default: tokens.background,
      paper: tokens.surface,
    },
    text: {
      primary: tokens.text,
      secondary: tokens.muted,
    },
    divider: tokens.border,
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "Inter, Segoe UI, Roboto, Arial, sans-serif",
    h4: { fontWeight: 800, letterSpacing: "-0.02em", color: tokens.text },
    h5: { fontWeight: 700, letterSpacing: "-0.01em", color: tokens.text },
    h6: { fontWeight: 700, color: tokens.text },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.background,
          color: tokens.text,
          backgroundImage:
            "radial-gradient(circle at top left, rgba(194, 65, 12, 0.08), transparent 32%), radial-gradient(circle at bottom right, rgba(15, 118, 110, 0.06), transparent 24%)",
          backgroundAttachment: "fixed",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "linear-gradient(135deg, #1C1917 0%, #292524 60%, #C2410C 100%)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 12px 30px rgba(28, 25, 23, 0.18)",
          borderBottom: "1px solid rgba(231, 224, 213, 0.2)",
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          boxShadow: "0 18px 45px rgba(28, 25, 23, 0.06)",
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
            outlineColor: tokens.primary,
            outlineOffset: 2,
          },
        },
        containedPrimary: {
          backgroundColor: tokens.primary,
          color: tokens.surface,
          "&:hover": {
            backgroundColor: tokens.primaryHover,
          },
        },
        containedSuccess: {
          backgroundColor: tokens.success,
          color: tokens.surface,
          "&:hover": {
            backgroundColor: "#14532D",
          },
        },
        containedError: {
          backgroundColor: tokens.danger,
          color: tokens.surface,
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
            outlineColor: tokens.primary,
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
            outlineColor: tokens.primary,
            outlineOffset: 2,
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(194, 65, 12, 0.12)",
            color: tokens.primary,
            "&:hover": {
              backgroundColor: "rgba(194, 65, 12, 0.18)",
            },
          },
        },
      },
    },
  },
});
