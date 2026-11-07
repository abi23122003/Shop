import { useCallback, useEffect, useMemo, useState } from "react";
import { login as loginRequest, logout as logoutRequest } from "../services/authService";
import { tokenStorage } from "../services/storage/tokenStorage";
import { AuthContext } from "./authContextValue";

function usernameFromToken(token) {
  if (!token) return "";
  try {
    const payload = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payload?.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return paddedPayload ? JSON.parse(atob(paddedPayload)).sub ?? "" : "";
  } catch {
    return "";
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get());

  // Authenticate user, persist token in isolated session storage, and update auth state
  const login = useCallback(async (username, password) => {
    const response = await loginRequest(username, password);
    tokenStorage.set(response.token);
    setToken(response.token);
    return response;
  }, []);

  // Revoke token on server via POST /api/auth/logout and wipe local credentials
  const logout = useCallback(() => {
    const currentToken = token || tokenStorage.get();
    tokenStorage.clear();
    setToken(null);
    if (currentToken) {
      logoutRequest(currentToken).catch(() => {});
    }
  }, [token]);

  // Automatically clear session and state when API interceptor detects 401 Unauthorized
  useEffect(() => {
    function handleSessionExpired() {
      logout();
    }

    window.addEventListener("smart-shop-session-expired", handleSessionExpired);
    return () => window.removeEventListener("smart-shop-session-expired", handleSessionExpired);
  }, [logout]);

  const username = useMemo(() => usernameFromToken(token), [token]);
  const value = useMemo(() => ({ token, username, isAuthenticated: Boolean(token), login, logout }), [token, username, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
