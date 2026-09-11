import { describe, it, expect } from 'vitest'
import { getInvoiceTotals } from './invoiceMath'

describe('getInvoiceTotals', () => {
  it('يحسب الإجمالي والضريبة والمتبقي لفاتورة قياسية', () => {
    const totals = getInvoiceTotals({
      total_fees: 10000,
      discount: 0,
      vat_rate: 5,
      paid_amount: 2000,
    })
    expect(totals.subtotal).toBe(10000)
    expect(totals.vat).toBe(500)
    expect(totals.total).toBe(10500)
    expect(totals.paid).toBe(2000)
    expect(totals.remaining).toBe(8500)
  })

  it('يخصم الخصم قبل حساب الضريبة (وليس بعده)', () => {
    const totals = getInvoiceTotals({
      total_fees: 10000,
      discount: 2000,
      vat_rate: 5,
      paid_amount: 0,
    })
    expect(totals.subtotal).toBe(8000)
    expect(totals.vat).toBe(400)
    expect(totals.total).toBe(8400)
  })

  it('لا يُنتج مبلغًا متبقيًا سالبًا عند الدفع الزائد', () => {
    const totals = getInvoiceTotals({
      total_fees: 1000,
      discount: 0,
      vat_rate: 5,
      paid_amount: 5000,
    })
    expect(totals.remaining).toBe(0)
    expect(totals.paid).toBe(5000)
  })

  it('لا يجعل الأتعاب سالبة عند خصم أكبر من الأتعاب', () => {
    const totals = getInvoiceTotals({ total_fees: 1000, discount: 5000 })
    expect(totals.subtotal).toBe(0)
    expect(totals.total).toBe(0)
  })

  it('يتعامل مع فاتورة فارغة بأصفار', () => {
    expect(getInvoiceTotals()).toEqual({
      subtotal: 0,
      vat: 0,
      total: 0,
      paid: 0,
      remaining: 0,
    })
    expect(getInvoiceTotals({})).toEqual({
      subtotal: 0,
      vat: 0,
      total: 0,
      paid: 0,
      remaining: 0,
    })
  })

  it('يفسّر القيم النصية القادمة من قاعدة البيانات كأرقام', () => {
    const totals = getInvoiceTotals({
      total_fees: '5000',
      discount: '500',
      vat_rate: '5',
      paid_amount: '1000',
    })
    expect(totals.subtotal).toBe(4500)
    expect(totals.vat).toBe(225)
    expect(totals.total).toBe(4725)
    expect(totals.remaining).toBe(3725)
  })

  it('يعتبر القيم غير الرقمية صفرًا بدل إنتاج NaN', () => {
    const totals = getInvoiceTotals({
      total_fees: 'غير محدد',
      vat_rate: null,
      paid_amount: undefined,
    })
    expect(Number.isNaN(totals.total)).toBe(false)
    expect(totals.total).toBe(0)
  })
})
