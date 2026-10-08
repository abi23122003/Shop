export function formatDateOnly(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isDateOnlyInRange(value, from = "", to = "") {
  return (!from || value >= from) && (!to || value <= to);
}

export function getDateRange(filter, today = new Date()) {
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (filter === "all") return { from: "", to: "" };
  if (filter === "today") return { from: formatDateOnly(current), to: formatDateOnly(current) };
  if (filter === "yesterday") {
    current.setDate(current.getDate() - 1);
    return { from: formatDateOnly(current), to: formatDateOnly(current) };
  }
  if (filter === "week") {
    const start = new Date(current);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return { from: formatDateOnly(start), to: formatDateOnly(current) };
  }
  if (filter === "month") {
    return {
      from: formatDateOnly(new Date(current.getFullYear(), current.getMonth(), 1)),
      to: formatDateOnly(current),
    };
  }
  return { from: "", to: "" };
}
