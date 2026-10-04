import { getInvoiceTotals } from './invoiceMath'

const DAY_MS = 24 * 60 * 60 * 1000

export const AGING_BUCKETS = Object.freeze([
  { id: 'not_due', label: 'غير مستحقة', shortLabel: 'قادمة', color: '#3b82f6' },
  { id: 'days_1_30', label: 'متأخرة 1–30 يومًا', shortLabel: '1–30', color: '#f59e0b' },
  { id: 'days_31_60', label: 'متأخرة 31–60 يومًا', shortLabel: '31–60', color: '#f97316' },
  { id: 'days_61_90', label: 'متأخرة 61–90 يومًا', shortLabel: '61–90', color: '#ef4444' },
  { id: 'days_90_plus', label: 'متأخرة أكثر من 90 يومًا', shortLabel: '+90', color: '#be123c' },
  { id: 'undated', label: 'بدون تاريخ استحقاق', shortLabel: 'بلا تاريخ', color: '#64748b' },
])

function toUtcDay(value) {
  if (!value) return null
  const text = String(value)
  const plainDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (plainDate) {
    const [, year, month, day] = plainDate
    return Date.UTC(Number(year), Number(month) - 1, Number(day))
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getDaysOverdue(invoice, now = new Date()) {
  const dueDay = toUtcDay(invoice?.due_date)
  const today = toUtcDay(now)
  if (dueDay === null || today === null) return null
  return Math.floor((today - dueDay) / DAY_MS)
}

export function getAgingBucket(invoice, now = new Date()) {
  const { remaining } = getInvoiceTotals(invoice || {})
  if (remaining <= 0 || invoice?.status === 'مدفوعة' || invoice?.status === 'ملغاة') return 'settled'
  const days = getDaysOverdue(invoice, now)
  if (days === null) return 'undated'
  if (days <= 0) return 'not_due'
  if (days <= 30) return 'days_1_30'
  if (days <= 60) return 'days_31_60'
  if (days <= 90) return 'days_61_90'
  return 'days_90_plus'
}

export function getCollectionPriority(invoice, now = new Date()) {
  const daysOverdue = getDaysOverdue(invoice, now)
  if (daysOverdue === null || daysOverdue <= 0) return 'normal'
  if (daysOverdue > 90) return 'critical'
  if (daysOverdue > 60) return 'urgent'
  if (daysOverdue > 30 || invoice?.status === 'متأخرة') return 'high'
  return 'medium'
}

export function buildCollectionsSummary(invoices = [], now = new Date()) {
  const source = Array.isArray(invoices) ? invoices : []
  const outstanding = source.filter((invoice) => {
    const { remaining } = getInvoiceTotals(invoice)
    return remaining > 0 && invoice?.status !== 'ملغاة'
  })

  const totalBilled = source
    .filter((invoice) => invoice?.status !== 'ملغاة')
    .reduce((sum, invoice) => sum + getInvoiceTotals(invoice).total, 0)
  const totalPaid = source
    .filter((invoice) => invoice?.status !== 'ملغاة')
    .reduce((sum, invoice) => sum + getInvoiceTotals(invoice).paid, 0)
  const totalOutstanding = outstanding.reduce((sum, invoice) => sum + getInvoiceTotals(invoice).remaining, 0)
  const overdueInvoices = outstanding.filter((invoice) => (getDaysOverdue(invoice, now) || 0) > 0)
  const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + getInvoiceTotals(invoice).remaining, 0)
  const dueSoonInvoices = outstanding.filter((invoice) => {
    const days = getDaysOverdue(invoice, now)
    return days !== null && days <= 0 && days >= -7
  })
  const dueSoonAmount = dueSoonInvoices.reduce((sum, invoice) => sum + getInvoiceTotals(invoice).remaining, 0)

  const buckets = AGING_BUCKETS.map((definition) => {
    const rows = outstanding.filter((invoice) => getAgingBucket(invoice, now) === definition.id)
    const amount = rows.reduce((sum, invoice) => sum + getInvoiceTotals(invoice).remaining, 0)
    return {
      ...definition,
      count: rows.length,
      amount,
      percentage: totalOutstanding > 0 ? Math.round((amount / totalOutstanding) * 100) : 0,
    }
  })

  return {
    totalBilled,
    totalPaid,
    totalOutstanding,
    outstandingCount: outstanding.length,
    overdueAmount,
    overdueCount: overdueInvoices.length,
    dueSoonAmount,
    dueSoonCount: dueSoonInvoices.length,
    collectionRate: totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 0,
    buckets,
  }
}

export function compareCollectionPriority(first, second, now = new Date()) {
  const firstDays = getDaysOverdue(first, now) ?? -Infinity
  const secondDays = getDaysOverdue(second, now) ?? -Infinity
  if (firstDays !== secondDays) return secondDays - firstDays
  return getInvoiceTotals(second).remaining - getInvoiceTotals(first).remaining
}
