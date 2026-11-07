const amountOf = (value) => Number(value ?? 0);

export function categorizeLedgerEntries(selected, history = [], products = []) {
  if (!selected) return [];
  const entries = [];
  (selected.customerSales ?? []).forEach((sale) => {
    (sale.saleItems ?? []).forEach((item) => {
      const itemProduct = (products ?? []).find((entry) => Number(entry.id) === Number(item.productId));
      entries.push({
        date: sale.saleDate,
        kind: "purchase",
        id: `${sale.id}-${item.id ?? item.productId}`,
        label: `${itemProduct?.productName ?? `Product #${item.productId}`} x ${item.quantity} · ${sale.paymentMethod || "Cash"}${sale.status === "REVERSED" ? " · Reversed" : ""}`,
        amount: amountOf(item.totalPrice ?? amountOf(item.sellingPrice) * amountOf(item.quantity)),
        reversed: sale.status === "REVERSED",
      });
    });
  });
  (history ?? [])
    .filter((entry) => String(entry.type).toUpperCase() === "PAYMENT")
    .forEach((entry) => {
      entries.push({
        date: entry.transactionDate,
        kind: "payment",
        id: `payment-${entry.id}`,
        label: entry.remarks || "Payment received",
        amount: amountOf(entry.amount),
      });
    });
  (history ?? [])
    .filter((entry) => String(entry.type).toUpperCase() === "REVERSAL")
    .forEach((entry) => {
      entries.push({
        date: entry.transactionDate,
        kind: "reversal",
        id: `reversal-${entry.id}`,
        label: entry.remarks || "Credit reversal",
        amount: Math.abs(amountOf(entry.amount)),
      });
    });
  (history ?? [])
    .filter((entry) => String(entry.type).toUpperCase() === "REFUND")
    .forEach((entry) => {
      entries.push({
        date: entry.transactionDate,
        kind: "refund",
        id: `refund-${entry.id}`,
        label: entry.remarks || "Refund issued",
        amount: amountOf(entry.amount),
      });
    });
  return entries;
}

export function groupLedgerEntries(entries = []) {
  const grouped = new Map();
  entries.forEach((entry) => {
    if (!grouped.has(entry.date)) grouped.set(entry.date, []);
    grouped.get(entry.date).push(entry);
  });
  return [...grouped.entries()]
    .sort(([a], [b]) => String(b).localeCompare(String(a)))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "purchase" ? -1 : 1)),
      purchaseTotal: items
        .filter((item) => item.kind === "purchase")
        .reduce((sum, item) => sum + item.amount, 0),
    }));
}

export function buildLedgerGroups(selected, history = [], products = []) {
  const entries = categorizeLedgerEntries(selected, history, products);
  return groupLedgerEntries(entries);
}

export function computeLedgerBalance(entries = []) {
  return entries.reduce((balance, entry) => {
    if (entry.kind === "purchase") return balance + entry.amount;
    if (entry.kind === "payment" || entry.kind === "reversal") return balance - entry.amount;
    if (entry.kind === "refund") return balance + entry.amount;
    return balance;
  }, 0);
}
