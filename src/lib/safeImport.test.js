import { beforeEach, describe, expect, it, vi } from 'vitest'

const database = {}
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: table => ({
      select: () => ({ range: async (from, to) => ({ data: (database[table] || []).slice(from, to + 1), error: null }) }),
      insert: async row => { database[table].push(row); return { error: null } },
    }),
  },
}))
import { prepareSafeImport, applySafeImport } from './safeImport'

beforeEach(() => {
  for (const table of ['clients', 'cases', 'tasks', 'documents', 'invoices', 'expenses']) database[table] = []
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
    expect(database.clients[0].phone).toBeNull()
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

  it('does not overwrite an existing person with a conflicting identity', async () => {
    database.clients.push({ id: 'live', full_name: 'سارة خالد', id_number: '784-A', email: 'one@example.com' })
    const preview = await prepareSafeImport({
      clients: [{ id: 'different', full_name: 'سارة خالد', id_number: '784-B', email: 'two@example.com' }],
    })
    expect(preview.counts.clients.review).toBe(1)
    expect(preview.counts.clients.add).toBe(0)
  })
})
