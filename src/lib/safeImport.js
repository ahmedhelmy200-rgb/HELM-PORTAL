import { supabase } from '@/integrations/supabase/client'

// Imports are additive. An uncertain match is held for manual review.
const ORDER = ['clients', 'cases', 'tasks', 'documents', 'invoices', 'expenses']
const BUSINESS_KEY = {
  cases: row => [row.case_number, row.court, row.title].every(Boolean)
    ? [row.case_number, row.court, row.title].map(normalize).join('|') : '',
  invoices: row => row.invoice_number && normalize(row.invoice_number),
  documents: row => row.file_url && normalize(row.file_url),
  tasks: () => '',
  expenses: () => '',
}
const normalize = value => String(value ?? '').normalize('NFKC').trim().toLowerCase()
  .replace(/[\u064b-\u065f\u0670ـ]/g, '').replace(/[أإآٱ]/g, 'ا')
  .replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ')
const useful = value => { const s = normalize(value); return s && s !== '-' && s !== 'null' ? s : '' }
const digits = value => String(value ?? '').replace(/\D/g, '')
const phoneKey = value => {
  const s = digits(value)
  return s.length >= 9 ? (s.startsWith('971') ? s.slice(3) : s.replace(/^0/, '')) : ''
}
const identity = row => ({
  id: useful(row?.id_number),
  email: useful(row?.email),
  phone: phoneKey(row?.phone),
  name: useful(row?.full_name),
})
const hasConflict = (a, b) => ['id', 'email'].some(key => a[key] && b[key] && a[key] !== b[key])
const evidence = (a, b) => Boolean(
  (a.id && a.id === b.id) ||
  (a.email && a.email === b.email) ||
  (a.phone && a.phone === b.phone && a.name && a.name === b.name)
)
const generatedId = () => crypto.randomUUID()

async function listAll(table) {
  const result = []
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + 499)
    if (error) throw new Error(`${table}: ${error.message}`)
    result.push(...(data || []))
    if (!data || data.length < 500) return result
  }
}

function clientMatch(row, existing) {
  const target = identity(row)
  const matches = existing.filter(candidate => {
    const other = identity(candidate)
    return candidate.id === row.id || evidence(target, other) ||
      (target.name && target.name === other.name) ||
      (target.id && target.id === other.id) ||
      (target.email && target.email === other.email)
  })
  if (matches.length !== 1 || hasConflict(target, identity(matches[0])) || !evidence(target, identity(matches[0]))) {
    return { match: null, conflict: matches.length > 0 }
  }
  return { match: matches[0], conflict: false }
}

function resolveClient(row, sourceClients, aliases, clients) {
  const oldId = row.client_id && String(row.client_id)
  if (oldId && aliases.has(oldId)) return aliases.get(oldId)
  const name = useful(row.client_name)
  if (!name) return null
  const matching = sourceClients.filter(c => useful(c.full_name) === name)
  if (matching.length === 1 && aliases.has(String(matching[0].id))) return aliases.get(String(matching[0].id))
  const live = clients.filter(c => useful(c.full_name) === name)
  return live.length === 1 ? live[0].id : null
}

function cleanRow(row, table) {
  const data = { ...row }
  for (const key of ['created_by', 'created_by_id', 'updated_date', 'created_date', 'is_sample']) delete data[key]
  if (table === 'clients') {
    delete data.portal_password
    delete data.linked_cases
    delete data.portal_registered
  }
  return data
}

export async function prepareSafeImport(backup) {
  if (!backup || typeof backup !== 'object' || !Array.isArray(backup.clients)) throw new Error('ملف الاستيراد غير صالح')
  for (const table of ORDER) if (backup[table] != null && !Array.isArray(backup[table])) throw new Error(`القسم ${table} غير صالح`)
  const live = Object.fromEntries(await Promise.all(ORDER.map(async table => [table, await listAll(table)])))
  const planned = Object.fromEntries(ORDER.map(key => [key, []]))
  const review = []
  const skipped = Object.fromEntries(ORDER.map(key => [key, 0]))
  const aliases = new Map()
  const clients = [...live.clients]
  for (const row of backup.clients) {
    if (!row || !useful(row.full_name)) { review.push({ table: 'clients', id: row?.id, reason: 'اسم الموكل مفقود' }); continue }
    const { match, conflict } = clientMatch(row, clients)
    if (conflict) { review.push({ table: 'clients', id: row.id, name: row.full_name, reason: 'هوية موكل متعارضة أو متعددة' }); continue }
    if (match) {
      aliases.set(String(row.id), match.id)
      skipped.clients++
      continue
    }
    const data = cleanRow(row, 'clients')
    data.id = data.id && !clients.some(c => c.id === data.id) ? data.id : generatedId()
    if (data.phone === '-') data.phone = null
    planned.clients.push(data)
    clients.push(data)
    aliases.set(String(row.id), data.id)
  }

  const caseAliases = new Map()
  for (const table of ORDER.slice(1)) {
    const seenIds = new Set(live[table].map(row => String(row.id)))
    const seenKeys = new Set(live[table].map(BUSINESS_KEY[table]).filter(Boolean))
    for (const row of backup[table] || []) {
      if (!row || !row.id) { review.push({ table, reason: 'معرّف السجل مفقود' }); continue }
      const oldId = String(row.id)
      const existing = live[table].find(item => String(item.id) === oldId)
      const key = BUSINESS_KEY[table](row)
      if (existing || seenIds.has(oldId) || (key && seenKeys.has(key))) {
        skipped[table]++
        if (table === 'cases') {
          const sameKey = key && live.cases.filter(item => BUSINESS_KEY.cases(item) === key)
          const target = existing || (sameKey && sameKey.length === 1 && sameKey[0])
          if (target) caseAliases.set(oldId, target.id)
        }
        continue
      }
      const clientId = resolveClient(row, backup.clients, aliases, clients)
      if (!clientId) { review.push({ table, id: oldId, name: row.client_name, reason: 'تعذر تحديد موكل واحد' }); continue }
      const data = cleanRow(row, table)
      data.client_id = clientId
      if (data.case_id) {
        const target = caseAliases.get(String(data.case_id)) ||
          planned.cases.find(c => String(c.id) === String(data.case_id))?.id ||
          live.cases.find(c => String(c.id) === String(data.case_id))?.id
        if (!target) { review.push({ table, id: oldId, reason: 'القضية المرتبطة غير محددة' }); continue }
        data.case_id = target
      }
      planned[table].push(data)
      seenIds.add(oldId)
      if (key) seenKeys.add(key)
      if (table === 'cases') caseAliases.set(oldId, oldId)
    }
  }
  return { planned, review, skipped, counts: Object.fromEntries(ORDER.map(key => [key, {
    incoming: (backup[key] || []).length, add: planned[key].length, existing: skipped[key],
    review: review.filter(item => item.table === key).length,
  }])) }
}

export async function applySafeImport(backup, expectedCounts) {
  // Re-read the live database before writing; the preview may have become stale.
  const plan = await prepareSafeImport(backup)
  if (JSON.stringify(plan.counts) !== JSON.stringify(expectedCounts)) throw new Error('تغيرت بيانات البوابة بعد المعاينة؛ أعد الفحص قبل الاستيراد')
  const inserted = Object.fromEntries(ORDER.map(key => [key, 0]))
  const errors = []
  for (const table of ORDER) {
    for (const row of plan.planned[table]) {
      const { error } = await supabase.from(table).insert(row)
      if (error) {
        errors.push({ table, id: row.id, reason: error.message })
      } else inserted[table]++
    }
    // A failed client or case must not cause related rows to be filed under a missing parent.
    if ((table === 'clients' || table === 'cases') && errors.some(item => item.table === table)) break
  }
  return { inserted, review: [...plan.review, ...errors], errors }
}
