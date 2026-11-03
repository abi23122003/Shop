import { useCallback, useEffect, useState } from "react";
import { getDashboard } from "../services/dashboardService";
import { getApiErrorMessage } from "../../../services/apiErrors";
import { useAutoRefresh } from "../../../hooks/useAutoRefresh";

export function useDashboard() {
  const [data, setData] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); setError(""); try { setData(await getDashboard()); } catch (requestError) { setError(getApiErrorMessage(requestError, "Dashboard data could not be loaded. Please try again.")); } finally { setLoading(false); } }, []);
  const refreshSilently = useCallback(async () => { try { setData(await getDashboard()); } catch {} }, []);
  useEffect(() => { const timer = setTimeout(refresh, 0); return () => clearTimeout(timer); }, [refresh]);
  useAutoRefresh(refreshSilently);
  return { data, error, loading, refresh };
}
