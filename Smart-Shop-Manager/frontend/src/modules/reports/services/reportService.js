import api from "../../../services/api";

export async function getReport(type, from = "", to = "") {
  const params = from && to ? { from, to } : undefined;
  const { data } = await api.get(`/reports/${type}`, { params });
  return data;
}
