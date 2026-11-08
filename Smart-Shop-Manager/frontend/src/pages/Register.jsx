import { useState } from "react";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import { getApiErrorMessage } from "../services/apiErrors";
import { paths } from "../routes/paths";
import { useThemeMode } from "../context/useThemeMode";

export default function Register() {
  const { mode, toggleTheme } = useThemeMode();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  function validate() {
    const errors = {};
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      errors.username = "Username is required";
    } else if (trimmedUsername.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (trimmedUsername.length > 50) {
      errors.username = "Username cannot exceed 50 characters";
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      errors.username = "Only letters, numbers, underscores, hyphens, and dots allowed";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await register(username.trim(), password, confirmPassword);
      setSuccessMessage(
        response.message ||
          "Registration successful! Your account is pending administrator approval before you can sign in."
      );
    } catch (requestError) {
      const resp = requestError.response;
      if (resp?.status === 400 || resp?.status === 409) {
        const msg = resp.data?.message || resp.data?.username || "Registration failed. Please check your details.";
        setError(msg);
      } else {
        setError(getApiErrorMessage(requestError, "Unable to complete registration. Please try again."));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: { xs: 2, sm: 3 },
        bgcolor: "background.default",
        position: "relative",
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          <IconButton
            onClick={toggleTheme}
            aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            {mode === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Paper
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 960,
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 24px 48px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px #44403C"
              : "0 24px 48px -12px rgba(28, 25, 23, 0.14), 0 0 0 1px #E7E0D5",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
        }}
      >
        {/* Branding side (Left panel) */}
        <Box
          sx={{
            p: { xs: 4, sm: 5, md: 6 },
            color: "common.white",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #C2410C 0%, #1C1917 100%)",
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 4 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "grid",
                  placeItems: "center",
                  backdropFilter: "blur(8px)",
                }}
              >
                <StorefrontIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "0.02em", lineHeight: 1.2 }}>
                  Sutharshan Stores
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", letterSpacing: "0.08em" }}>
                  RETAIL MANAGEMENT
                </Typography>
              </Box>
            </Stack>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.75rem", sm: "2.25rem" },
                lineHeight: 1.2,
                mb: 2,
                letterSpacing: "-0.02em",
              }}
            >
              Join your store team.
            </Typography>

            <Typography sx={{ color: "rgba(255, 255, 255, 0.75)", fontSize: "0.95rem", lineHeight: 1.6, mb: 4 }}>
              Create an account to manage inventory, track billing, and record sales. New accounts are verified by an administrator for security.
            </Typography>

            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <SecurityOutlinedIcon sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.85)" }}>
                  Encrypted passwords using BCrypt
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <VerifiedUserOutlinedIcon sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.85)" }}>
                  Administrator approval workflow
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <HowToRegOutlinedIcon sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.85)" }}>
                  Multi-user role-based access control
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", mt: 4 }}>
            © {new Date().getFullYear()} Smart Shop Manager
          </Typography>
        </Box>

        {/* Form side (Right panel) */}
        <Box
          sx={{
            p: { xs: 4, sm: 5, md: 6 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            bgcolor: "background.paper",
          }}
        >
          <Stack spacing={2.5} sx={{ width: "100%" }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: "1.6rem", sm: "1.9rem" }, color: "text.primary" }}>
                Create account
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: "0.95rem" }}>
                Sign up to join. An administrator will approve your access.
              </Typography>
            </Box>

            {successMessage ? (
              <Stack spacing={2.5} sx={{ mt: 1 }}>
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  {successMessage}
                </Alert>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() =>
                    navigate(paths.login, {
                      state: {
                        registeredUsername: username.trim(),
                        infoMessage: "Account created! You will be able to sign in once approved by the administrator.",
                      },
                    })
                  }
                  sx={{
                    py: 1.4,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(194, 65, 12, 0.25)",
                  }}
                >
                  Proceed to Sign In
                </Button>
              </Stack>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <TextField
                  label="Username"
                  id="username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (fieldErrors.username) {
                      setFieldErrors((prev) => ({ ...prev, username: "" }));
                    }
                  }}
                  error={Boolean(fieldErrors.username)}
                  helperText={fieldErrors.username || "Choose a unique username (3-50 chars)"}
                  autoFocus
                  fullWidth
                  disabled={isSubmitting}
                />

                <TextField
                  label="Password"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password || "At least 8 characters"}
                  fullWidth
                  disabled={isSubmitting}
                  sx={{ "& input::-ms-reveal, & input::-ms-clear": { display: "none" } }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? (
                              <VisibilityOffOutlinedIcon fontSize="small" />
                            ) : (
                              <VisibilityOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  label="Confirm Password"
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }
                  }}
                  error={Boolean(fieldErrors.confirmPassword)}
                  helperText={fieldErrors.confirmPassword || "Re-enter your password to confirm"}
                  fullWidth
                  disabled={isSubmitting}
                  sx={{ "& input::-ms-reveal, & input::-ms-clear": { display: "none" } }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOffOutlinedIcon fontSize="small" />
                            ) : (
                              <VisibilityOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    py: 1.4,
                    mt: 1,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(194, 65, 12, 0.25)",
                  }}
                >
                  {isSubmitting ? (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "center" }}>
                      <CircularProgress size={20} color="inherit" />
                      <span>Creating account…</span>
                    </Stack>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </>
            )}

            <Box sx={{ textAlign: "center", pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{" "}
                <Link
                  component={RouterLink}
                  to={paths.login}
                  sx={{
                    fontWeight: 600,
                    color: "primary.main",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
