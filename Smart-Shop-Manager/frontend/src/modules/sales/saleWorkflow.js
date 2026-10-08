export function validateSaleForm(form, customer) {
  const creditEnabled =
    customer?.creditEnabled ?? Number(customer?.creditLimit ?? 0) > 0;

  if (!form.saleItems.length || form.saleItems.some((item) =>
    !item.productId || item.quantity <= 0 || item.sellingPrice < 0
  )) {
    return "Choose valid sale items.";
  }

  const productIds = form.saleItems.map((item) => String(item.productId));
  if (new Set(productIds).size !== productIds.length) {
    return "Each product can appear once per sale. Update its quantity on one line.";
  }

  if (form.paymentMethod === "Credit" && (!form.customerId || !creditEnabled)) {
    return "Only a registered credit-enabled customer can use Credit payment.";
  }

  return "";
}

export function buildSalePayload(form) {
  const payload = {
    ...form,
    saleItems: form.saleItems.map((item) => ({
      ...item,
      totalPrice: item.quantity * item.sellingPrice,
    })),
  };

  if (form.customerId) {
    payload.customerId = Number(form.customerId);
  } else {
    delete payload.customerId;
  }

  return payload;
}
