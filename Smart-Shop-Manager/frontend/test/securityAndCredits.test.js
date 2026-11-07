import assert from "node:assert/strict";
import test from "node:test";
import { tokenStorage } from "../src/services/storage/tokenStorage.js";
import {
  buildLedgerGroups,
  categorizeLedgerEntries,
  computeLedgerBalance,
} from "../src/modules/credit/creditLedger.js";

test("tokenStorage sets, gets, and clears token in isolated storage without persisting in localStorage", () => {
  // Mock sessionStorage and localStorage in node test environment
  const sessionMap = new Map();
  const localMap = new Map();

  globalThis.sessionStorage = {
    getItem: (k) => sessionMap.get(k) ?? null,
    setItem: (k, v) => sessionMap.set(k, String(v)),
    removeItem: (k) => sessionMap.delete(k),
  };
  globalThis.localStorage = {
    getItem: (k) => localMap.get(k) ?? null,
    setItem: (k, v) => localMap.set(k, String(v)),
    removeItem: (k) => localMap.delete(k),
  };

  tokenStorage.set("test-jwt-token-12345");
  assert.equal(tokenStorage.get(), "test-jwt-token-12345");
  assert.equal(sessionMap.get("smart_shop_access_token"), "test-jwt-token-12345");
  assert.equal(localMap.has("smart_shop_access_token"), false);

  tokenStorage.clear();
  assert.equal(tokenStorage.get(), null);
  assert.equal(sessionMap.has("smart_shop_access_token"), false);
  assert.equal(localMap.has("smart_shop_access_token"), false);

  // Legacy token removal on read test
  localMap.set("smart_shop_access_token", "legacy-token-in-local-storage");
  assert.equal(localMap.has("smart_shop_access_token"), true);
  tokenStorage.get();
  assert.equal(localMap.has("smart_shop_access_token"), false);
});

test("ledger entry categorization recognizes purchases, payments, reversals, and refunds", () => {
  const selected = {
    id: 1,
    customerName: "Alice",
    customerSales: [
      {
        id: 101,
        saleDate: "2026-10-01",
        paymentMethod: "Credit",
        status: "COMPLETED",
        saleItems: [
          { id: 1, productId: 10, quantity: 2, sellingPrice: 50, totalPrice: 100 },
        ],
      },
    ],
  };
  const products = [{ id: 10, productName: "Widget", sellingPrice: 50 }];
  const history = [
    { id: 201, type: "PAYMENT", amount: 50, transactionDate: "2026-10-02", remarks: "Partial payment" },
    { id: 202, type: "REVERSAL", amount: -30, transactionDate: "2026-10-03", remarks: "Credit reversal" },
    { id: 203, type: "REFUND", amount: 20, transactionDate: "2026-10-04", remarks: "Refund issued" },
  ];

  const entries = categorizeLedgerEntries(selected, history, products);
  const kinds = entries.map((e) => e.kind);

  assert.ok(kinds.includes("purchase"));
  assert.ok(kinds.includes("payment"));
  assert.ok(kinds.includes("reversal"));
  assert.ok(kinds.includes("refund"));

  const purchaseEntry = entries.find((e) => e.kind === "purchase");
  assert.equal(purchaseEntry.amount, 100);
  assert.equal(purchaseEntry.label, "Widget x 2 · Credit");

  const paymentEntry = entries.find((e) => e.kind === "payment");
  assert.equal(paymentEntry.amount, 50);

  const reversalEntry = entries.find((e) => e.kind === "reversal");
  assert.equal(reversalEntry.amount, 30);

  const refundEntry = entries.find((e) => e.kind === "refund");
  assert.equal(refundEntry.amount, 20);

  // Validate balance logic against real categorized entries
  // Purchase (+100) - Payment (50) - Reversal (30) + Refund (20) = 40
  const balance = computeLedgerBalance(entries);
  assert.equal(balance, 40);

  // Validate ledger group ordering and date separation
  const groups = buildLedgerGroups(selected, history, products);
  assert.equal(groups.length, 4);
  assert.equal(groups[0].date, "2026-10-04");
  assert.equal(groups[3].date, "2026-10-01");
  assert.equal(groups[3].purchaseTotal, 100);
});
