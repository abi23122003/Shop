import axios from "axios";
import { tokenStorage } from "./storage/tokenStorage.js";
import { getApiErrorMessage } from "./apiErrors.js";

const api = axios.create({
  baseURL: (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("smart-shop-session-expired"));
      }
    }

    error.userMessage = getApiErrorMessage(error);
    return Promise.reject(error);
  },
);

export default api;
