import { CircularProgress, Paper, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import EmptyState from "../../../components/common/EmptyState";

const money = (value) => `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function formatCell(value, format) {
  if (format === "currency") {
    return money(value);
  }

  return value ?? "—";
}

export default function ReportTable({ columns, rows, loading, compact = false }) {
  if (!loading && !rows.length) {
    return <EmptyState icon={<AssessmentOutlinedIcon color="action" />} title="No report data" message="There are no records to show for this report yet." />;
  }

  return <Paper sx={{ overflowX: "auto" }}><Table size={compact ? "small" : "medium"}><TableHead><TableRow>{columns.map(([, label]) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{loading ? <TableRow><TableCell colSpan={columns.length} align="center"><CircularProgress size={24} /></TableCell></TableRow> : rows.map((row, index) => <TableRow key={`${index}-${columns[0]?.[0] ?? "row"}`} hover>{columns.map(([key, , format]) => <TableCell key={key}>{formatCell(row[key], format)}</TableCell>)}</TableRow>)}{!loading && !rows.length && <TableRow><TableCell colSpan={columns.length} align="center">No report records found.</TableCell></TableRow>}</TableBody></Table></Paper>;
}
