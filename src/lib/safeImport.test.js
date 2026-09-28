import { beforeEach, describe, expect, it, vi } from 'vitest'

const database = vi.hoisted(() => ({}))
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: table => ({
      select: () => ({ order: () => ({ range: async (from, to) => ({ data: (database[table] || []).slice(from, to + 1), error: null }) }) }),
      insert: async row => {
        if (table === 'clients' && row.phone == null) return { error: new Error('clients.phone may not be null') }
        if (table !== 'cases' && Object.hasOwn(row, 'client_id')) return { error: new Error(`${table}.client_id does not exist`) }
        database[table].push(row)
        return { error: null }
      },
    }),
  },
}))
import { prepareSafeImport, applySafeImport } from './safeImport'
import { BACKUP_SECTIONS } from './backup'

beforeEach(() => {
  for (const table of BACKUP_SECTIONS) database[table] = []
})

describe('safe import', () => {
  it('maps a stale case client id by the unique exported client name and is repeatable', async () => {
    const backup = {
      clients: [{ id: 'old-client', full_name: 'محمد علي', id_number: '784-1', phone: '-' }],
      cases: [{ id: 'case-1', title: 'دعوى', case_number: '12/2026', court: 'دبي', client_id: 'stale-client-id', client_name: 'محمد علي' }],
    }
    const preview = await prepareSafeImport(backup)
    expect(preview.counts.clients.add).toBe(1)
    expect(preview.counts.cases.add).toBe(1)
    await applySafeImport(backup, preview.counts)
    expect(database.cases[0].client_id).toBe('old-client')
    expect(database.clients[0].phone).toBe('-')
    const second = await prepareSafeImport(backup)
    expect(second.counts.clients.add).toBe(0)
    expect(second.counts.cases.add).toBe(0)
  })

  it('holds an uncertain same-name client and all related records for review', async () => {
    database.clients.push({ id: 'current', full_name: 'أحمد علي', phone: '-' })
    const backup = {
      clients: [{ id: 'exported', full_name: 'احمد علي', phone: '-' }],
      cases: [{ id: 'case-2', title: 'نزاع', client_name: 'احمد علي', client_id: 'exported' }],
    }
    const preview = await prepareSafeImport(backup)
    expect(preview.counts.clients.add).toBe(0)
    expect(preview.counts.clients.review).toBe(1)
    expect(preview.counts.cases.review).toBe(1)
  })

  it('attaches an invoice only when its stale case reference identifies one case', async () => {
    const backup = {
      clients: [{ id: 'person', full_name: 'منى سالم', id_number: '784-Z' }],
      cases: [{ id: 'case-a', title: 'مطالبة', case_number: '7', court: 'دبي', client_id: 'legacy', client_name: 'منى سالم' }],
      invoices: [{ id: 'bill', invoice_number: 'INV-1', client_name: 'منى سالم', case_id: 'stale-case', case_title: 'مطالبة' }],
    }
    const preview = await prepareSafeImport(backup)
    expect(preview.counts.invoices.add).toBe(1)
    expect(preview.planned.invoices[0].case_id).toBe('case-a')
    backup.cases.push({ id: 'case-b', title: 'مطالبة', case_number: '8', court: 'دبي', client_name: 'منى سالم' })
    const ambiguous = await prepareSafeImport(backup)
    expect(ambiguous.counts.invoices.review).toBe(1)
  })

  it('does not overwrite an existing person with a conflicting identity', async () => {
    database.clients.push({ id: 'live', full_name: 'سارة خالد', id_number: '784-A', email: 'one@example.com' })
    const preview = await prepareSafeImport({
      clients: [{ id: 'different', full_name: 'سارة خالد', id_number: '784-B', email: 'two@example.com' }],
    })
    expect(preview.counts.clients.review).toBe(1)
    expect(preview.counts.clients.add).toBe(0)
  })


  it('keeps unscoped tasks and expenses when no client is present', async () => {
    const backup = {
      tasks: [{ id: 'general-task', title: 'مهمة عامة' }],
      expenses: [{ id: 'office-expense', title: 'مصروف مكتبي' }],
    }
    const preview = await prepareSafeImport(backup)
    expect(preview.counts.tasks.add).toBe(1)
    expect(preview.counts.expenses.add).toBe(1)
    expect(preview.review).toEqual([])
    const result = await applySafeImport(backup, preview.counts)
    expect(result.inserted.tasks).toBe(1)
    expect(result.inserted.expenses).toBe(1)
    expect(database.tasks[0]).not.toHaveProperty('client_id')
    expect(database.expenses[0]).not.toHaveProperty('client_id')
  })

  it('plans and restores every section produced by a full backup', async () => {
    const backup = Object.fromEntries(BACKUP_SECTIONS.map(table => [table, []]))
    backup.clients = [{ id: 'client', full_name: 'موكل', id_number: '784-1', phone: '-' }]
    backup.cases = [{ id: 'case', title: 'دعوى', client_id: 'client', client_name: 'موكل' }]
    backup.sessions = [{ id: 'session', case_id: 'case' }]
    backup.conversations = [{ id: 'conversation', participants: [] }]
    backup.messages = [{ id: 'message', conversation_id: 'conversation' }]
    for (const table of BACKUP_SECTIONS) {
      if (backup[table].length === 0) backup[table] = [{ id: table }]
    }

    const preview = await prepareSafeImport(backup)
    expect(Object.keys(preview.counts)).toEqual(BACKUP_SECTIONS)
    for (const table of BACKUP_SECTIONS) expect(preview.counts[table].add).toBe(1)
    const result = await applySafeImport(backup, preview.counts)
    for (const table of BACKUP_SECTIONS) expect(result.inserted[table]).toBe(1)
    expect(result.errors).toEqual([])
  })

  it('treats invoice numbers as unique within their portal scope', async () => {
    database.invoices.push({ id: 'live-bill', invoice_number: 'INV-1', portal_scope: 'helm_portal' })
    const backup = {
      invoices: [{ id: 'other-bill', invoice_number: 'INV-1', business_unit: 'badayat_al_khair' }],
    }
    const preview = await prepareSafeImport(backup)
    expect(preview.counts.invoices.add).toBe(1)
    expect(preview.counts.invoices.existing).toBe(0)
  })

})
