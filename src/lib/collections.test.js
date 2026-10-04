import { describe, expect, it } from 'vitest'
import {
  buildCollectionsSummary,
  compareCollectionPriority,
  getAgingBucket,
  getCollectionPriority,
  getDaysOverdue,
} from './collections'

const NOW = new Date('2026-10-04T12:00:00+04:00')

function invoice(overrides = {}) {
  return {
    id: 'invoice-1',
    total_fees: 1000,
    paid_amount: 0,
    discount: 0,
    vat_rate: 0,
    status: 'صادرة',
    due_date: '2026-10-01',
    ...overrides,
  }
}

describe('حساب أعمار الديون', () => {
  it('يحسب أيام التأخير بالتاريخ المحلي دون التأثر بالتوقيت', () => {
    expect(getDaysOverdue(invoice(), NOW)).toBe(3)
    expect(getDaysOverdue(invoice({ due_date: '2026-10-04' }), NOW)).toBe(0)
    expect(getDaysOverdue(invoice({ due_date: '2026-10-11' }), NOW)).toBe(-7)
  })

  it('يصنّف الفواتير في شرائح الأعمار الصحيحة', () => {
    expect(getAgingBucket(invoice({ due_date: '2026-10-11' }), NOW)).toBe('not_due')
    expect(getAgingBucket(invoice({ due_date: '2026-09-20' }), NOW)).toBe('days_1_30')
    expect(getAgingBucket(invoice({ due_date: '2026-08-20' }), NOW)).toBe('days_31_60')
    expect(getAgingBucket(invoice({ due_date: '2026-07-20' }), NOW)).toBe('days_61_90')
    expect(getAgingBucket(invoice({ due_date: '2026-06-01' }), NOW)).toBe('days_90_plus')
    expect(getAgingBucket(invoice({ due_date: null }), NOW)).toBe('undated')
  })

  it('يستبعد المدفوعة والملغاة من أعمار الديون', () => {
    expect(getAgingBucket(invoice({ paid_amount: 1000, status: 'مدفوعة' }), NOW)).toBe('settled')
    expect(getAgingBucket(invoice({ status: 'ملغاة' }), NOW)).toBe('settled')
  })

  it('يرفع أولوية المتابعة كلما زاد التأخير', () => {
    expect(getCollectionPriority(invoice({ due_date: '2026-10-11' }), NOW)).toBe('normal')
    expect(getCollectionPriority(invoice({ due_date: '2026-09-20' }), NOW)).toBe('medium')
    expect(getCollectionPriority(invoice({ due_date: '2026-08-20' }), NOW)).toBe('high')
    expect(getCollectionPriority(invoice({ due_date: '2026-07-20' }), NOW)).toBe('urgent')
    expect(getCollectionPriority(invoice({ due_date: '2026-06-01' }), NOW)).toBe('critical')
  })
})

describe('ملخص مركز التحصيل', () => {
  const rows = [
    invoice({ id: 'a', total_fees: 1000, paid_amount: 250, due_date: '2026-09-20' }),
    invoice({ id: 'b', total_fees: 2000, paid_amount: 500, due_date: '2026-10-08' }),
    invoice({ id: 'c', total_fees: 800, paid_amount: 800, status: 'مدفوعة' }),
    invoice({ id: 'd', total_fees: 500, paid_amount: 0, status: 'ملغاة' }),
  ]

  it('يحسب المبالغ والنسب ويستبعد الفواتير الملغاة', () => {
    const result = buildCollectionsSummary(rows, NOW)
    expect(result.totalBilled).toBe(3800)
    expect(result.totalPaid).toBe(1550)
    expect(result.totalOutstanding).toBe(2250)
    expect(result.outstandingCount).toBe(2)
    expect(result.overdueAmount).toBe(750)
    expect(result.overdueCount).toBe(1)
    expect(result.dueSoonAmount).toBe(1500)
    expect(result.collectionRate).toBe(41)
  })

  it('يرتب الأكثر تأخرًا ثم الأعلى قيمة', () => {
    const sorted = [rows[1], rows[0]].sort((a, b) => compareCollectionPriority(a, b, NOW))
    expect(sorted.map((row) => row.id)).toEqual(['a', 'b'])
  })
})
