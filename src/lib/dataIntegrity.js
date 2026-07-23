const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g

export function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D+/g, '')
  if (!digits) return ''
  if (digits.startsWith('00971')) return digits.slice(2)
  if (digits.startsWith('971')) return digits
  if (digits.startsWith('0') && digits.length >= 9) return `971${digits.slice(1)}`
  return digits
}

export function normalizeIdNumber(value) {
  return String(value || '').replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase()
}

function asMoney(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0
}

export function clientIdentity(record = {}) {
  return {
    id: record.id || null,
    name: normalizeText(record.full_name),
    phone: normalizePhone(record.phone),
    email: normalizeEmail(record.email),
    idNumber: normalizeIdNumber(record.id_number),
  }
}

export function findClientDuplicates(candidate, records = [], ignoreId = null) {
  const current = clientIdentity(candidate)
  if (!current.name && !current.phone && !current.email && !current.idNumber) return []

  return records
    .filter((record) => record?.id !== ignoreId)
    .map((record) => {
      const other = clientIdentity(record)
      const matchedFields = []
      if (current.idNumber && current.idNumber === other.idNumber) matchedFields.push('رقم الهوية')
      if (current.email && current.email === other.email) matchedFields.push('البريد الإلكتروني')
      if (current.phone && current.phone === other.phone) matchedFields.push('رقم الهاتف')
      if (current.name && current.name === other.name) matchedFields.push('الاسم')
      const strongMatch = matchedFields.some((field) => field !== 'الاسم') || matchedFields.length >= 2
      return strongMatch ? { record, matchedFields } : null
    })
    .filter(Boolean)
}

export function buildClientDuplicateGroups(records = []) {
  const links = new Map()
  records.forEach((record) => {
    const keys = []
    const identity = clientIdentity(record)
    if (identity.idNumber) keys.push(`id:${identity.idNumber}`)
    if (identity.email) keys.push(`email:${identity.email}`)
    if (identity.phone) keys.push(`phone:${identity.phone}`)
    if (identity.name && (identity.email || identity.phone || identity.idNumber)) keys.push(`name:${identity.name}`)
    keys.forEach((key) => {
      if (!links.has(key)) links.set(key, [])
      links.get(key).push(record)
    })
  })

  const seen = new Set()
  const groups = []
  links.forEach((rows, key) => {
    const unique = [...new Map(rows.map((row) => [row.id, row])).values()]
    if (unique.length < 2) return
    const signature = unique.map((row) => row.id).sort().join('|')
    if (seen.has(signature)) return
    seen.add(signature)
    groups.push({ key, records: unique })
  })
  return groups.sort((a, b) => b.records.length - a.records.length)
}

export function invoiceIdentity(invoice = {}, totals = null) {
  const calculatedTotal = totals?.total ?? invoice.total_fees
  return {
    id: invoice.id || null,
    number: normalizeText(invoice.invoice_number),
    scope: normalizeText(invoice.portal_scope || invoice.business_unit || 'helm'),
    client: normalizeText(invoice.client_name),
    caseId: String(invoice.case_id || '').trim(),
    caseTitle: normalizeText(invoice.case_title),
    issueDate: String(invoice.issue_date || '').slice(0, 10),
    total: asMoney(calculatedTotal),
  }
}

export function findInvoiceDuplicates(candidate, records = [], ignoreId = null, getTotals = null) {
  const currentTotals = getTotals ? getTotals(candidate) : null
  const current = invoiceIdentity(candidate, currentTotals)
  return records
    .filter((record) => record?.id !== ignoreId)
    .map((record) => {
      const otherTotals = getTotals ? getTotals(record) : null
      const other = invoiceIdentity(record, otherTotals)
      const matchedFields = []
      if (current.number && current.number === other.number && current.scope === other.scope) matchedFields.push('رقم الفاتورة والقسم')
      const sameCase = current.caseId ? current.caseId === other.caseId : current.caseTitle && current.caseTitle === other.caseTitle
      if (current.client && current.client === other.client && sameCase && current.issueDate && current.issueDate === other.issueDate && current.total === other.total) {
        matchedFields.push('الموكل والقضية والتاريخ والمبلغ')
      }
      return matchedFields.length ? { record, matchedFields } : null
    })
    .filter(Boolean)
}

export function buildInvoiceDuplicateGroups(records = [], getTotals = null) {
  const groups = new Map()
  records.forEach((record) => {
    const identity = invoiceIdentity(record, getTotals ? getTotals(record) : null)
    const keys = []
    if (identity.number) keys.push(`number:${identity.scope}:${identity.number}`)
    const caseKey = identity.caseId || identity.caseTitle
    if (identity.client && caseKey && identity.issueDate) keys.push(`content:${identity.client}:${caseKey}:${identity.issueDate}:${identity.total}`)
    keys.forEach((key) => {
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(record)
    })
  })
  return [...groups.entries()]
    .map(([key, rows]) => ({ key, records: [...new Map(rows.map((row) => [row.id, row])).values()] }))
    .filter((group) => group.records.length > 1)
    .sort((a, b) => b.records.length - a.records.length)
}

export const CASE_RESULTS = [
  'غير محسومة',
  'حكم لصالح الموكل',
  'تسوية لصالح الموكل',
  'نجاح جزئي',
  'حكم ضد الموكل',
  'انتهت إجرائياً',
]

export function defaultCaseSuccessPercentage(result) {
  switch (result) {
    case 'حكم لصالح الموكل': return 100
    case 'تسوية لصالح الموكل': return 85
    case 'نجاح جزئي': return 50
    case 'حكم ضد الموكل': return 0
    default: return null
  }
}

export function caseSuccessStats(cases = []) {
  const decided = cases
    .map((item) => {
      const result = item.case_result || 'غير محسومة'
      const explicit = Number(item.success_percentage)
      const percentage = Number.isFinite(explicit) && item.success_percentage !== '' && item.success_percentage !== null
        ? Math.min(100, Math.max(0, explicit))
        : defaultCaseSuccessPercentage(result)
      return percentage === null ? null : { ...item, calculated_success_percentage: percentage }
    })
    .filter(Boolean)

  const sum = decided.reduce((total, item) => total + item.calculated_success_percentage, 0)
  const rate = decided.length ? Math.round((sum / decided.length) * 10) / 10 : null
  return {
    total: cases.length,
    active: cases.filter((item) => item.status === 'جارية').length,
    completed: cases.filter((item) => ['مكتملة', 'مغلقة'].includes(item.status)).length,
    decided: decided.length,
    unrated: Math.max(0, cases.length - decided.length),
    won: decided.filter((item) => item.calculated_success_percentage >= 75).length,
    partial: decided.filter((item) => item.calculated_success_percentage > 0 && item.calculated_success_percentage < 75).length,
    lost: decided.filter((item) => item.calculated_success_percentage === 0).length,
    rate,
    ratedCases: decided,
  }
}
