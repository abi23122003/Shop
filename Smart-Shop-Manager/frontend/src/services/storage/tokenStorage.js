const TOKEN_KEY = "smart_shop_access_token";

// Tokens are isolated in sessionStorage:
// - Note: Scripts running on the origin can access sessionStorage; it does not protect against XSS.
// - SessionStorage is discarded when the tab/window closes and does not persist on disk.
// - Tokens are isolated per tab rather than shared across the entire origin.
// In-memory reference is prioritized, with sessionStorage backing the active session.
let memoryToken = null;

export const tokenStorage = {
  get: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage unavailable or disabled
    }
    if (memoryToken) return memoryToken;
    try {
      memoryToken = sessionStorage.getItem(TOKEN_KEY);
      return memoryToken;
    } catch {
      return null;
    }
  },
  set: (token) => {
    memoryToken = token || null;
    try {
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Storage unavailable or disabled
    }
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage unavailable or disabled
    }
  },
  clear: () => {
    memoryToken = null;
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage unavailable or disabled
    }
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage unavailable or disabled
    }
  },
};

