// تحويل آمن إلى رقم: أي قيمة غير رقمية (نص فارغ، "غير محدد"، null، NaN)
// تُعامل كصفر بدل أن تنشر NaN في كل الحسابات والواجهة والتقارير.
export function toAmount(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function getInvoiceTotals(invoice = {}) {
  const subtotal = Math.max(0, toAmount(invoice.total_fees) - toAmount(invoice.discount))
  const vat = subtotal * (toAmount(invoice.vat_rate) / 100)
  const total = subtotal + vat
  const paid = toAmount(invoice.paid_amount)
  const remaining = Math.max(0, total - paid)
  return { subtotal, vat, total, paid, remaining }
}
