import api from "./api.js";

export async function getAllUsers() {
  const { data } = await api.get("/admin/users");
  return data;
}

export async function getPendingUsers() {
  const { data } = await api.get("/admin/users/pending");
  return data;
}

export async function approveUser(id) {
  const { data } = await api.put(`/admin/users/${id}/approve`);
  return data;
}

export async function deleteOrRejectUser(id) {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
}

export async function resetUserPassword(username, newPassword) {
  const { data } = await api.post(`/users/${encodeURIComponent(username)}/reset-password`, {
    newPassword,
  });
  return data;
}
