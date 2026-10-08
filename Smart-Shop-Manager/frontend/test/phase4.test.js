import assert from "node:assert/strict";
import test from "node:test";
import { getApiErrorMessage } from "../src/services/apiErrors.js";
import { buildSalePayload, validateSaleForm } from "../src/modules/sales/saleWorkflow.js";
import { formatDateOnly, isDateOnlyInRange, parseDateOnly } from "../src/utils/dateUtils.js";
import { getDateRange } from "../src/utils/dateUtils.js";

test("date-only formatting preserves the local calendar date", () => {
  const date = new Date(2026, 9, 4, 23, 30);
  assert.equal(formatDateOnly(date), "2026-10-04");
  assert.equal(formatDateOnly(parseDateOnly("2026-10-04")), "2026-10-04");
});

test("custom date ranges include both selected boundary days", () => {
  assert.equal(isDateOnlyInRange("2026-10-01", "2026-10-01", "2026-10-07"), true);
  assert.equal(isDateOnlyInRange("2026-10-07", "2026-10-01", "2026-10-07"), true);
  assert.equal(isDateOnlyInRange("2026-10-08", "2026-10-01", "2026-10-07"), false);
});

test("report presets produce local inclusive ranges", () => {
  const reference = new Date(2026, 9, 7, 23, 30);
  assert.deepEqual(getDateRange("today", reference), { from: "2026-10-07", to: "2026-10-07" });
  assert.deepEqual(getDateRange("yesterday", reference), { from: "2026-10-06", to: "2026-10-06" });
  assert.deepEqual(getDateRange("week", reference), { from: "2026-10-05", to: "2026-10-07" });
  assert.deepEqual(getDateRange("month", reference), { from: "2026-10-01", to: "2026-10-07" });
});

test("walk-in cash payload omits customer and credit requires a registered customer", () => {
  const form = {
    saleDate: "2026-10-04",
    customerId: "",
    paymentMethod: "Cash",
    saleItems: [{ productId: 2, quantity: 2, sellingPrice: 12.5 }],
  };
  assert.equal(validateSaleForm(form, undefined), "");
  assert.equal(buildSalePayload(form).customerId, undefined);
  assert.equal(buildSalePayload(form).saleItems[0].totalPrice, 25);
  assert.match(
    validateSaleForm({ ...form, paymentMethod: "Credit" }, undefined),
    /registered credit-enabled customer/,
  );
});

test("API errors use safe user-facing messages for all required statuses", () => {
  for (const status of [400, 403, 404, 409, 422, 500]) {
    const message = getApiErrorMessage({
      response: { status, data: { message: "SQL exception and secret" } },
    });
    assert.doesNotMatch(message, /SQL|secret|exception/i);
  }
  assert.equal(
    getApiErrorMessage({ response: { status: 401 } }),
    "Your session expired. Please sign in again.",
  );
  assert.match(
    getApiErrorMessage({ request: {} }),
    /server did not respond/i,
  );
});
