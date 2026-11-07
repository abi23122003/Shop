import api from "./api";

export async function login(username, password) {
  const { data } = await api.post("/auth/login", { username, password });
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

