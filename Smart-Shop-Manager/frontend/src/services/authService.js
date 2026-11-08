import api from "./api.js";

export async function login(username, password) {
  const { data } = await api.post("/auth/login", { username, password });
  return data;
}

export async function register(username, password, confirmPassword) {
  const { data } = await api.post("/auth/register", {
    username,
    password,
    confirmPassword,
  });
  return data;
}

export async function logout(token) {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    await api.post("/auth/logout", null, config);
  } catch {
    // Continue even if network/server is unreachable
  }
}
