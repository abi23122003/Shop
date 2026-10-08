import { useMemo, useState } from "react";
import { Alert, Box, Button, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import ReportSummaryCards from "../modules/reports/components/ReportSummaryCards";
import ReportTable from "../modules/reports/components/ReportTable";
import { useReports } from "../modules/reports/hooks/useReports";
import { useSettings } from "../modules/settings/hooks/useSettings";
import { getDateRange } from "../utils/dateUtils";

export default function ReportsPage() {
  const { settings } = useSettings();
  const [dateFilter, setDateFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [rangeError, setRangeError] = useState("");
  const range = useMemo(
    () => dateFilter === "custom"
      ? { from: customFrom, to: customTo }
      : getDateRange(dateFilter),
    [dateFilter, customFrom, customTo],
  );
  const validRange = !range.from || !range.to || range.from <= range.to;
  const { type, setType, reportRows, profit, loading, error, lastUpdated, refresh, config, reportOptions } =
    useReports(settings.defaultReportType, validRange ? range.from : "", validRange ? range.to : "");
  function applyCustomRange() {
    if (!customFrom || !customTo || customFrom > customTo) {
      setRangeError("Choose a valid custom date range.");
      return;
    }
    setRangeError("");
    setDateFilter("custom");
  }

  return <Stack spacing={3}><Box><Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}><Box sx={{ minWidth: 0 }}><Typography variant="h4">Reports</Typography><Typography color="text.secondary">View live business summaries from your shop data.</Typography></Box><Button startIcon={<RefreshOutlinedIcon />} variant="outlined" onClick={refresh} disabled={loading} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>Refresh</Button></Stack>{lastUpdated && <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>Last updated {lastUpdated.toLocaleString()}</Typography>}</Box><ReportSummaryCards loading={loading} profit={profit} /><Stack spacing={1}><Typography variant="subtitle2">Date range</Typography><ToggleButtonGroup exclusive value={dateFilter} onChange={(_, value) => value && setDateFilter(value)} size="small" sx={{ flexWrap: "wrap" }}><ToggleButton value="all">All time</ToggleButton><ToggleButton value="today">Today</ToggleButton><ToggleButton value="yesterday">Yesterday</ToggleButton><ToggleButton value="week">This week</ToggleButton><ToggleButton value="month">This month</ToggleButton><ToggleButton value="custom">Custom</ToggleButton></ToggleButtonGroup>{dateFilter === "custom" && <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><TextField label="From" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="To" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><Button variant="outlined" onClick={applyCustomRange}>Apply</Button></Stack>}{rangeError && <Alert severity="warning">{rangeError}</Alert>}</Stack><TextField label="Report type" select value={type} onChange={(event) => setType(event.target.value)} sx={{ maxWidth: { xs: "100%", sm: 320 } }}>{reportOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>{error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={refresh}>Retry</Button>}>{error}</Alert>}<ReportTable columns={config.columns} rows={reportRows} loading={loading} compact={settings.compactTables} /></Stack>;
}
