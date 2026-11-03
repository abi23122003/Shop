import { useCallback, useEffect, useMemo, useState } from "react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import api from "../services/api";
import { getApiErrorMessage } from "../services/apiErrors";
import { formatDateOnly } from "../utils/dateUtils";

const money = (value) => `Rs ${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const blankCustomer = { customerName: "", phone: "", email: "", address: "", creditLimit: "" };
const SMALL_LIMIT = 1000;
const messageFor = (error, fallback) => getApiErrorMessage(error, fallback);
const amountOf = (value) => Number(value ?? 0);

function initials(name = "") {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "?";
}

function normalizeHistory(data) {
  if (Array.isArray(data)) return data;
  return [];
}

function blurActiveElement() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

function customerType(customer) {
  const limit = amountOf(customer.creditLimit);
  if (!customer.creditEnabled || limit === 0) return "instant";
  if (limit <= SMALL_LIMIT) return "sometimes";
  return "credit";
}

function CustomerTypeTag({ customer }) {
  const type = customerType(customer);
  const tags = { credit: ["Credit", "primary"], sometimes: ["Sometimes pays", "warning"], instant: ["Pays instantly", "success"] };
  const [label, color] = tags[type];
  return <Chip label={label} color={color} size="small" />;
}

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [credits, setCredits] = useState([]);
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState("");
  const [customerDialog, setCustomerDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [customerForm, setCustomerForm] = useState(blankCustomer);
  const [formCustomerType, setFormCustomerType] = useState("instant");
  const [customerError, setCustomerError] = useState("");
  const [customerSaving, setCustomerSaving] = useState(false);
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [purchase, setPurchase] = useState({ productId: "", quantity: 1 });
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [customerResponse, salesResponse, productResponse, creditResponse] = await Promise.all([
        api.get("/customers"), api.get("/sales"), api.get("/products"), api.get("/credits"),
      ]);
      setCustomers(Array.isArray(customerResponse.data) ? customerResponse.data : []);
      setSales(Array.isArray(salesResponse.data) ? salesResponse.data : []);
      setProducts(Array.isArray(productResponse.data) ? productResponse.data : []);
      setCredits(Array.isArray(creditResponse.data) ? creditResponse.data : []);
      setLoadError("");
    } catch (error) {
      setLoadError(messageFor(error, "Could not load credit customers."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const customersWithCredit = useMemo(() => customers.filter((customer) => customer.active !== false).map((customer) => {
    const account = credits.find((entry) => Number(entry.customerId) === Number(customer.id));
    const customerSales = sales.filter((sale) => Number(sale.customerId) === Number(customer.id));
    const balance = amountOf(account?.balance);
    return { ...customer, credit: account, balance, customerSales };
  }), [customers, credits, sales]);

  const visibleCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customersWithCredit.filter((customer) => (!query || `${customer.customerName} ${customer.phone}`.toLowerCase().includes(query)) && (customerFilter === "all" || customerType(customer) === customerFilter));
  }, [customersWithCredit, customerFilter, search]);
  // Summary uses the same tab-and-search result as the customer list.
  const totalOwed = visibleCustomers.reduce((sum, customer) => sum + customer.balance, 0);
  const customerCounts = visibleCustomers.reduce((counts, customer) => {
    counts[customerType(customer)] += 1;
    return counts;
  }, { credit: 0, sometimes: 0, instant: 0 });
  const selectedCount = customerCounts[customerFilter];

  async function openLedger(customer) {
    blurActiveElement();
    setSelected(customer);
    setHistory([]);
    setLedgerError("");
    setLedgerLoading(true);
    try {
      const response = await api.get(`/credits/customer/${customer.id}/history`);
      setHistory(normalizeHistory(response.data));
    } catch (error) {
      setLedgerError(messageFor(error, "Could not load the customer ledger."));
    } finally {
      setLedgerLoading(false);
    }
  }

  function openCustomerForm(customer = null) {
    blurActiveElement();
    setEditing(customer);
    setFormCustomerType(customer ? customerType(customer) : "instant");
    setCustomerForm(customer ? {
      ...blankCustomer,
      customerName: customer.customerName ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
      creditLimit: customer.creditLimit == null ? "" : String(customer.creditLimit),
    } : { ...blankCustomer });
    setCustomerError("");
    setCustomerDialog(true);
  }

  function chooseCustomerType(type) {
    setFormCustomerType(type);
    setCustomerForm((current) => {
      if (type === "instant") return { ...current, creditLimit: "0" };
      if (type === "sometimes") {
        const limit = amountOf(current.creditLimit);
        return { ...current, creditLimit: String(limit > 0 && limit <= SMALL_LIMIT ? limit : SMALL_LIMIT) };
      }
      return current;
    });
    setCustomerError("");
  }

  async function saveCustomer(event) {
    event.preventDefault();
    const phone = customerForm.phone.replace(/\D/g, "");
    const limit = customerForm.creditLimit.trim() === "" ? 0 : Number(customerForm.creditLimit);
    if (!/^\d{10}$/.test(phone)) return setCustomerError("Phone number must contain exactly 10 digits.");
    if (!Number.isFinite(limit) || limit < 0) return setCustomerError("Credit limit must be zero or a positive amount.");
    if (formCustomerType === "credit" && limit <= 0) return setCustomerError("Credit customers need a credit limit greater than Rs 0.");
    if (formCustomerType === "sometimes" && (limit < 1 || limit > SMALL_LIMIT)) return setCustomerError(`Sometimes pays customers need a credit limit from Rs 1 to Rs ${SMALL_LIMIT}.`);
    setCustomerSaving(true);
    setCustomerError("");
    try {
      const payload = { customerName: customerForm.customerName, phone, email: customerForm.email, address: customerForm.address, creditLimit: formCustomerType === "instant" ? 0 : limit, creditEnabled: formCustomerType !== "instant", active: true };
      if (editing) await api.put(`/customers/${editing.id}`, payload);
      else await api.post("/customers", payload);
      setCustomerDialog(false);
      await load();
    } catch (error) {
      setCustomerError(messageFor(error, "Could not save this customer."));
    } finally {
      setCustomerSaving(false);
    }
  }

  const currentCredit = selected?.credit;
  const balance = amountOf(currentCredit?.balance ?? selected?.balance);
  const creditLimit = amountOf(selected?.creditLimit);
  const product = products.find((entry) => Number(entry.id) === Number(purchase.productId));
  const quantity = Number(purchase.quantity || 0);
  const purchaseTotal = product ? quantity * amountOf(product.sellingPrice) : 0;
  const newBalance = balance + purchaseTotal;
  const availableBefore = creditLimit > 0 ? Math.max(0, creditLimit - balance) : null;
  const exceedsLimit = creditLimit > 0 && newBalance > creditLimit;

  function beginPurchase() {
    blurActiveElement();
    setPurchase({ productId: "", quantity: 1 });
    setPurchaseError("");
    setPurchaseDialog(true);
  }

  async function savePurchase(event) {
    event.preventDefault();
    if (!selected || !product || !Number.isInteger(quantity) || quantity < 1 || quantity > amountOf(product.quantity)) {
      return setPurchaseError("Choose an in-stock product and enter a valid quantity.");
    }
    if (exceedsLimit) return setPurchaseError("This purchase exceeds the customer’s credit limit.");
    setPurchaseSaving(true);
    setPurchaseError("");
    try {
      await api.post("/sales", {
        saleDate: formatDateOnly(),
        customerId: selected.id,
        paymentMethod: "Credit",
        saleItems: [{ productId: product.id, quantity, sellingPrice: amountOf(product.sellingPrice), totalPrice: purchaseTotal }],
      });
      setPurchaseDialog(false);
      try {
        const [salesResponse, creditsResponse, historyResponse, productsResponse] = await Promise.all([
          api.get("/sales"), api.get("/credits"), api.get(`/credits/customer/${selected.id}/history`), api.get("/products"),
        ]);
        const refreshedSales = Array.isArray(salesResponse.data) ? salesResponse.data : [];
        const refreshedCredits = Array.isArray(creditsResponse.data) ? creditsResponse.data : [];
        setSales(refreshedSales);
        setCredits(refreshedCredits);
        setHistory(normalizeHistory(historyResponse.data));
        setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
        const refreshedAccount = refreshedCredits.find((entry) => Number(entry.customerId) === Number(selected.id));
        setSelected((previous) => previous ? {
          ...previous,
          balance: amountOf(refreshedAccount?.balance),
          credit: refreshedAccount,
          customerSales: refreshedSales.filter((sale) => Number(sale.customerId) === Number(selected.id)),
        } : previous);
        setLedgerError("");
      } catch (refreshError) {
        setLedgerError(messageFor(refreshError, "Purchase was saved, but the ledger could not be refreshed."));
      }
    } catch (error) {
      setPurchaseError(messageFor(error, "Could not add this credit purchase."));
    } finally {
      setPurchaseSaving(false);
    }
  }

  function beginPayment() {
    blurActiveElement();
    setPaymentAmount("");
    setPaymentError("");
    setPaymentDialog(true);
  }

  async function savePayment(event) {
    event.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return setPaymentError("Enter a payment amount greater than zero.");
    if (amount > balance) return setPaymentError("Payment cannot exceed the outstanding balance.");
    setPaymentSaving(true);
    setPaymentError("");
    try {
      await api.post("/credits/payment", { customerId: selected.id, amount, remarks: "Customer payment" });
      setPaymentDialog(false);
      await load();
      await openLedger({ ...selected, balance: balance - amount, credit: { ...selected.credit, balance: balance - amount } });
    } catch (error) {
      setPaymentError(messageFor(error, "Could not record this payment."));
    } finally {
      setPaymentSaving(false);
    }
  }

  async function removeCustomer() {
    if (!selected || !window.confirm("Remove this customer? Their history is kept.")) return;
    setLedgerError("");
    try {
      await api.delete(`/customers/${selected.id}`);
      setSelected(null);
      await load();
    } catch (error) {
      setLedgerError(error.response?.data?.message ?? messageFor(error, "Could not remove this customer."));
    }
  }

  const ledgerGroups = useMemo(() => {
    if (!selected) return [];
    const entries = [];
    selected.customerSales.forEach((sale) => {
      (sale.saleItems ?? []).forEach((item) => {
        const itemProduct = products.find((entry) => Number(entry.id) === Number(item.productId));
        entries.push({ date: sale.saleDate, kind: "purchase", id: `${sale.id}-${item.id ?? item.productId}`, label: `${itemProduct?.productName ?? `Product #${item.productId}`} x ${item.quantity} · ${sale.paymentMethod || "Cash"}${sale.status === "REVERSED" ? " · Reversed" : ""}`, amount: amountOf(item.totalPrice ?? amountOf(item.sellingPrice) * amountOf(item.quantity)), reversed: sale.status === "REVERSED" });
      });
    });
    history.filter((entry) => String(entry.type).toUpperCase() === "PAYMENT").forEach((entry) => {
      entries.push({ date: entry.transactionDate, kind: "payment", id: `payment-${entry.id}`, label: entry.remarks || "Payment received", amount: amountOf(entry.amount) });
    });
    const grouped = new Map();
    entries.forEach((entry) => {
      if (!grouped.has(entry.date)) grouped.set(entry.date, []);
      grouped.get(entry.date).push(entry);
    });
    return [...grouped.entries()].sort(([a], [b]) => String(b).localeCompare(String(a))).map(([date, items]) => ({
      date,
      items: items.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "purchase" ? -1 : 1)),
      purchaseTotal: items.filter((item) => item.kind === "purchase").reduce((sum, item) => sum + item.amount, 0),
    }));
  }, [selected, history, products]);

  return <Stack spacing={3}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
      <Box><Typography variant="h4">Customers</Typography><Typography color="text.secondary">Track customer purchases and payments in one ledger.</Typography></Box>
      <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => openCustomerForm()}>Add customer</Button>
    </Stack>
    {loadError && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void load()}>Retry</Button>}>{loadError}</Alert>}
    <Card><CardContent><Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
      {customerFilter === "all" ? <><Box><Typography color="text.secondary">You will get</Typography><Typography variant="h4" color="error.main">{money(totalOwed)}</Typography></Box><Stack direction="row" spacing={{ xs: 2, sm: 3 }}><Box><Typography color="text.secondary">Credit</Typography><Typography variant="h5" color="primary.main">{customerCounts.credit}</Typography></Box><Box><Typography color="text.secondary">Sometimes pays</Typography><Typography variant="h5" color="warning.main">{customerCounts.sometimes}</Typography></Box><Box><Typography color="text.secondary">Pays instantly</Typography><Typography variant="h5" color="success.main">{customerCounts.instant}</Typography></Box></Stack></> : <Box><Typography color="text.secondary">{customerFilter === "credit" ? "Credit" : customerFilter === "sometimes" ? "Sometimes pays" : "Pays instantly"} customers</Typography><Typography variant="h4" color="primary.main">{selectedCount}</Typography><Typography color="text.secondary">{money(customerFilter === "instant" ? 0 : totalOwed)} owed</Typography></Box>}
    </Stack></CardContent></Card>
    <TextField fullWidth label="Search name or phone" value={search} onChange={(event) => setSearch(event.target.value)} />
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>{[["all", "All"], ["credit", "Credit"], ["sometimes", "Sometimes pays"], ["instant", "Pays instantly"]].map(([value, label]) => <Box key={value} component="button" type="button" aria-pressed={customerFilter === value} onClick={() => setCustomerFilter(value)} sx={{ minHeight: 44, px: 2, border: 1, borderRadius: 5, borderColor: customerFilter === value ? "primary.main" : "divider", bgcolor: customerFilter === value ? "primary.main" : "background.paper", color: customerFilter === value ? "primary.contrastText" : "text.primary", cursor: "pointer", font: "inherit" }}>{label}</Box>)}</Stack>
    {loading ? <Box sx={{ display: "grid", placeItems: "center", minHeight: 160 }}><CircularProgress /></Box> : <>
      <Paper sx={{ display: { xs: "none", md: "block" }, overflowX: "auto" }}><Table><TableHead><TableRow><TableCell>Customer</TableCell><TableCell>Phone</TableCell><TableCell>Credit limit</TableCell><TableCell align="right">Balance</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>
        {visibleCustomers.map((customer) => <TableRow key={customer.id} hover><TableCell><Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}><Avatar>{initials(customer.customerName)}</Avatar><Stack spacing={0.5}><Typography fontWeight={650}>{customer.customerName}</Typography><CustomerTypeTag customer={customer} /></Stack></Stack></TableCell><TableCell>{customer.phone}</TableCell><TableCell>{customer.creditLimit > 0 ? money(customer.creditLimit) : "No limit"}</TableCell><TableCell align="right"><Typography color={customer.balance > 0 ? "error.main" : "success.main"} fontWeight={700}>{customer.balance > 0 ? money(customer.balance) : "Cleared"}</Typography></TableCell><TableCell align="right"><Button size="small" onClick={() => void openLedger(customer)}>View ledger</Button><Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => openCustomerForm(customer)}>Edit</Button></TableCell></TableRow>)}
        {!visibleCustomers.length && <TableRow><TableCell colSpan={5} align="center">{customersWithCredit.length ? "No customers match your search and filter." : "No customers yet. Add one to get started."}</TableCell></TableRow>}
      </TableBody></Table></Paper>
      <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>{visibleCustomers.map((customer, index) => <Paper key={customer.id} variant="outlined" sx={{ p: 2 }}><Stack spacing={1}><Typography variant="subtitle2">Customer #{index + 1}</Typography><Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}><Avatar>{initials(customer.customerName)}</Avatar><Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="h6">{customer.customerName}</Typography><Typography variant="body2" color="text.secondary">{customer.phone}</Typography><Box sx={{ mt: 0.5 }}><CustomerTypeTag customer={customer} /></Box></Box></Stack><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="body2" color="text.secondary">Balance</Typography><Typography fontWeight={700} color={customer.balance > 0 ? "error.main" : "success.main"}>{customer.balance > 0 ? money(customer.balance) : "Cleared"}</Typography></Stack><Typography variant="body2" color="text.secondary">Credit limit: {customer.creditLimit > 0 ? money(customer.creditLimit) : "No limit"}</Typography><Stack direction="row" spacing={1}><Button size="small" variant="outlined" onClick={() => void openLedger(customer)}>View ledger</Button><Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => openCustomerForm(customer)}>Edit</Button></Stack></Stack></Paper>)}{!visibleCustomers.length && <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>{customersWithCredit.length ? "No customers match your search and filter." : "No customers yet. Add one to get started."}</Paper>}</Stack>
    </>}

    <Dialog open={Boolean(selected) && !customerDialog && !purchaseDialog && !paymentDialog} onClose={() => setSelected(null)} fullWidth maxWidth="md">
      <DialogTitle><Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => setSelected(null)}>Back</Button><Typography variant="h6" component="span" sx={{ ml: 1 }}>{selected?.customerName} ledger</Typography></DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {ledgerError && <Alert severity="error">{ledgerError}</Alert>}
        <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={1}><Typography color="text.secondary">Current balance</Typography><Typography variant="h4" color={balance > 0 ? "error.main" : "success.main"}>{money(balance)}</Typography>{creditLimit > 0 ? <><LinearProgress variant="determinate" value={Math.min(100, balance / creditLimit * 100)} color={balance > creditLimit ? "error" : "primary"} /><Typography variant="body2" color="text.secondary">{money(balance)} of {money(creditLimit)} limit</Typography></> : <Typography variant="body2" color="text.secondary">No credit limit</Typography>}</Stack></Paper>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}><Button variant="outlined" startIcon={<MessageOutlinedIcon />} component="a" href={`https://wa.me/${String(selected?.phone ?? "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</Button><Button variant="outlined" startIcon={<CallOutlinedIcon />} component="a" href={`tel:${selected?.phone ?? ""}`}>Call</Button><Button variant="contained" onClick={beginPurchase}>Add purchase</Button><Button variant="outlined" onClick={beginPayment} disabled={balance <= 0}>Record payment</Button><Button variant="text" onClick={() => openCustomerForm(selected)}>Edit customer</Button><Button color="error" variant="text" onClick={() => void removeCustomer()}>Remove customer</Button></Stack>
        <Typography variant="h6">Ledger</Typography>
        {ledgerLoading ? <CircularProgress size={24} /> : ledgerGroups.length ? ledgerGroups.map((group) => <Paper key={group.date} variant="outlined" sx={{ p: 2 }}><Stack spacing={1}><Typography fontWeight={700}>{group.date}</Typography>{group.items.map((entry) => <Stack key={entry.id} direction="row" spacing={2} sx={{ justifyContent: "space-between" }}><Typography>{entry.label}</Typography><Typography color={entry.kind === "payment" ? "success.main" : "text.primary"}>{entry.kind === "payment" ? "−" : ""}{money(entry.amount)}</Typography></Stack>)}{group.purchaseTotal > 0 && <Stack direction="row" sx={{ justifyContent: "space-between", borderTop: 1, borderColor: "divider", pt: 1 }}><Typography fontWeight={650}>Day total</Typography><Typography fontWeight={650}>{money(group.purchaseTotal)}</Typography></Stack>}</Stack></Paper>) : <Typography color="text.secondary">No purchases or payments recorded yet.</Typography>}
      </Stack></DialogContent>
    </Dialog>

    <Dialog open={customerDialog} onClose={() => !customerSaving && setCustomerDialog(false)} fullWidth maxWidth="sm" slotProps={{ paper: { component: "form", onSubmit: saveCustomer } }}>
      <DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{customerError && <Alert severity="error">{customerError}</Alert>}<TextField autoFocus required label="Name" value={customerForm.customerName} onChange={(event) => setCustomerForm({ ...customerForm, customerName: event.target.value })} /><TextField required label="Phone" value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} /><TextField label="Email" type="email" value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} /><TextField label="Address" value={customerForm.address} onChange={(event) => setCustomerForm({ ...customerForm, address: event.target.value })} />
        <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
          <Typography component="legend" variant="body2" fontWeight={600}>Customer type</Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {[["instant", "Pays instantly"], ["credit", "Credit customer"], ["sometimes", "Sometimes pays"]].map(([value, label]) => <Box component="label" key={value} sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 44, cursor: "pointer" }}><input type="radio" name="customerType" value={value} checked={formCustomerType === value} onChange={() => chooseCustomerType(value)} />{label}</Box>)}
          </Stack>
        </Box>
        <TextField label="Credit limit (Rs)" type="number" value={customerForm.creditLimit} onChange={(event) => setCustomerForm({ ...customerForm, creditLimit: event.target.value })} helperText={formCustomerType === "sometimes" ? `Enter a limit from Rs 1 to Rs ${SMALL_LIMIT}.` : formCustomerType === "credit" ? "Enter a limit greater than Rs 0." : "Pays instantly customers have no credit limit."} error={Boolean(customerError && (formCustomerType === "credit" || formCustomerType === "sometimes"))} slotProps={{ htmlInput: { min: formCustomerType === "sometimes" ? 1 : 0, max: formCustomerType === "sometimes" ? SMALL_LIMIT : undefined, step: "0.01" } }} />
      </Stack></DialogContent><DialogActions><Button onClick={() => setCustomerDialog(false)}>Cancel</Button><Button type="submit" variant="contained" disabled={customerSaving}>{customerSaving ? "Saving…" : "Save customer"}</Button></DialogActions>
    </Dialog>

    <Dialog open={purchaseDialog} onClose={() => !purchaseSaving && setPurchaseDialog(false)} fullWidth maxWidth="sm" slotProps={{ paper: { component: "form", onSubmit: savePurchase } }}>
      <DialogTitle>Add credit purchase</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{purchaseError && <Alert severity="error">{purchaseError}</Alert>}<TextField autoFocus required select label="Product" value={purchase.productId} onChange={(event) => setPurchase({ ...purchase, productId: event.target.value })}><MenuItem value="">Choose a product</MenuItem>{products.filter((item) => item.active !== false && amountOf(item.quantity) > 0).map((item) => <MenuItem key={item.id} value={item.id}>{item.productName} — {money(item.sellingPrice)} ({item.quantity} available)</MenuItem>)}</TextField><TextField required label="Quantity" type="number" value={purchase.quantity} onChange={(event) => setPurchase({ ...purchase, quantity: event.target.value })} slotProps={{ htmlInput: { min: 1, max: product?.quantity ?? undefined } }} /><Typography>Unit price: {money(product?.sellingPrice)}</Typography><Typography>Purchase total: {money(purchaseTotal)}</Typography><Typography>New balance: {money(newBalance)}</Typography><Typography color={exceedsLimit ? "error.main" : "text.secondary"}>{creditLimit > 0 ? `${money(availableBefore)} available before saving${exceedsLimit ? `; purchase exceeds ${money(creditLimit)} limit` : ""}` : "Unlimited credit"}</Typography></Stack></DialogContent><DialogActions><Button onClick={() => setPurchaseDialog(false)}>Cancel</Button><Button type="submit" variant="contained" disabled={purchaseSaving || !product || exceedsLimit}>{purchaseSaving ? "Saving…" : "Save purchase"}</Button></DialogActions>
    </Dialog>

    <Dialog open={paymentDialog} onClose={() => !paymentSaving && setPaymentDialog(false)} fullWidth maxWidth="xs" slotProps={{ paper: { component: "form", onSubmit: savePayment } }}>
      <DialogTitle>Receive payment</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{paymentError && <Alert severity="error">{paymentError}</Alert>}<Typography>Outstanding balance: {money(balance)}</Typography><TextField autoFocus required label="Amount received (Rs)" type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} slotProps={{ htmlInput: { min: 0.01, max: balance, step: "0.01" } }} /></Stack></DialogContent><DialogActions><Button onClick={() => setPaymentDialog(false)}>Cancel</Button><Button type="submit" variant="contained" disabled={paymentSaving}>{paymentSaving ? "Saving…" : "Receive payment"}</Button></DialogActions>
    </Dialog>
  </Stack>;
}
