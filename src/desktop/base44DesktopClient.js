import { base44 as cloudBase44 } from '../api/base44Client.js'
import { desktopDb, emitSyncStatus, isDesktopRuntime } from './bridge.js'

const NETWORK_ERROR_MARKERS = [
  'failed to fetch',
  'networkerror',
  'network request failed',
  'load failed',
  'تعذر الاتصال',
  'offline',
]

const desktop = isDesktopRuntime()
let syncInFlight = null
let bootstrapped = false

function online() {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

function isNetworkError(error) {
  if (!online()) return true
  const message = String(error?.message || error || '').toLowerCase()
  return NETWORK_ERROR_MARKERS.some((marker) => message.includes(marker))
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeRecord(payload = {}, id = null) {
  const now = new Date().toISOString()
  return {
    ...payload,
    id: id || payload.id || makeId(),
    created_date: payload.created_date || now,
    updated_date: now,
  }
}

function compareValues(a, b) {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1
  const aDate = Date.parse(a)
  const bDate = Date.parse(b)
  if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) return aDate - bDate
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'ar')
}

function sortRows(rows, sortArg = '-created_date') {
  if (!sortArg) return [...rows]
  const descending = String(sortArg).startsWith('-')
  const field = String(sortArg).replace(/^-/, '')
  return [...rows].sort((left, right) => {
    const value = compareValues(left?.[field], right?.[field])
    return descending ? -value : value
  })
}

function matchesCriteria(row, criteria = {}) {
  return Object.entries(criteria || {}).every(([key, expected]) => {
    if (expected === undefined || expected === null || expected === '') return true
    const actual = row?.[key]
    if (Array.isArray(expected)) {
      if (Array.isArray(actual)) return expected.every((item) => actual.includes(item))
      return expected.includes(actual)
    }
    return actual === expected
  })
}

async function cachedRows(entityName, criteria = null, sortArg = '-created_date', limitValue = 1000) {
  const rows = await desktopDb.cacheList(entityName)
  const filtered = criteria ? rows.filter((row) => matchesCriteria(row, criteria)) : rows
  const sorted = sortRows(filtered, sortArg)
  return limitValue ? sorted.slice(0, Number(limitValue)) : sorted
}

async function cacheCloudRows(entityName, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return
  const validRows = rows.filter((row) => row?.id)
  if (validRows.length) await desktopDb.cacheUpsertMany(entityName, validRows, false)
}

async function syncPendingOperations() {
  if (!desktop || !online()) return { processed: 0, pending: 0 }
  if (syncInFlight) return syncInFlight

  syncInFlight = (async () => {
    emitSyncStatus({ phase: 'syncing', online: true })
    const entries = await desktopDb.outboxList(200)
    let processed = 0

    for (const entry of entries) {
      const entity = cloudBase44.entities?.[entry.entity]
      if (!entity) {
        await desktopDb.outboxFailed(entry.id, `Unknown entity: ${entry.entity}`)
        continue
      }

      try {
        if (entry.operation === 'delete') {
          await entity.delete(entry.recordId)
        } else {
          const synced = await entity.upsert({ ...entry.payload, id: entry.recordId })
          if (synced?.id) await desktopDb.cacheUpsert(entry.entity, synced.id, synced, false)
        }
        await desktopDb.cacheMarkClean(entry.entity, entry.recordId)
        await desktopDb.outboxDone(entry.id)
        processed += 1
      } catch (error) {
        await desktopDb.outboxFailed(entry.id, error?.message || String(error))
        if (isNetworkError(error)) break
      }
    }

    const status = await desktopDb.status()
    await desktopDb.metaSet('last_sync_at', new Date().toISOString())
    emitSyncStatus({
      phase: status.pendingOperations ? 'pending' : 'synced',
      online: online(),
      processed,
      pending: status.pendingOperations,
      databasePath: status.databasePath,
    })
    return { processed, pending: status.pendingOperations }
  })()

  try {
    return await syncInFlight
  } finally {
    syncInFlight = null
  }
}

async function readOnlineFirst(entityName, cloudWork, fallbackWork) {
  if (!desktop) return cloudWork()
  if (!online()) {
    emitSyncStatus({ phase: 'offline', online: false })
    return fallbackWork()
  }

  try {
    await syncPendingOperations()
    return await cloudWork()
  } catch (error) {
    if (!isNetworkError(error)) throw error
    emitSyncStatus({ phase: 'offline', online: false, error: error?.message || String(error) })
    return fallbackWork()
  }
}

async function writeOfflineFirst({ entityName, operation, record, cloudWork }) {
  if (!desktop) return cloudWork()

  if (online()) {
    try {
      await syncPendingOperations()
      const result = await cloudWork()
      if (operation === 'delete') await desktopDb.cacheDelete(entityName, record.id)
      else if (result?.id) await desktopDb.cacheUpsert(entityName, result.id, result, false)
      emitSyncStatus({ phase: 'synced', online: true })
      return result
    } catch (error) {
      if (!isNetworkError(error)) throw error
    }
  }

  if (operation === 'delete') {
    await desktopDb.cacheDelete(entityName, record.id)
  } else {
    await desktopDb.cacheUpsert(entityName, record.id, record, true)
  }
  await desktopDb.enqueue(operation, entityName, record.id, record)
  const status = await desktopDb.status()
  emitSyncStatus({ phase: 'pending', online: online(), pending: status.pendingOperations })
  return operation === 'delete' ? true : record
}

function wrapEntity(entityName, cloudEntity) {
  return {
    ...cloudEntity,

    async list(sortArg = '-created_date', limitValue = 1000) {
      return readOnlineFirst(
        entityName,
        async () => {
          const rows = await cloudEntity.list(sortArg, limitValue)
          await cacheCloudRows(entityName, rows)
          return rows
        },
        () => cachedRows(entityName, null, sortArg, limitValue),
      )
    },

    async listPage(sortArg = '-created_date', options = {}) {
      const page = Math.max(1, Number(options.page || 1))
      const pageSize = Math.max(1, Math.min(100, Number(options.pageSize || 20)))
      return readOnlineFirst(
        entityName,
        async () => {
          const result = await cloudEntity.listPage(sortArg, options)
          await cacheCloudRows(entityName, result?.data || [])
          return result
        },
        async () => {
          const all = await cachedRows(entityName, null, sortArg, 0)
          const from = (page - 1) * pageSize
          return { data: all.slice(from, from + pageSize), total: all.length, page, pageSize }
        },
      )
    },

    async filter(criteria = {}, sortArg = null, limitValue = 1000) {
      return readOnlineFirst(
        entityName,
        async () => {
          const rows = await cloudEntity.filter(criteria, sortArg, limitValue)
          await cacheCloudRows(entityName, rows)
          return rows
        },
        () => cachedRows(entityName, criteria, sortArg, limitValue),
      )
    },

    async filterPage(criteria = {}, sortArg = null, options = {}) {
      const page = Math.max(1, Number(options.page || 1))
      const pageSize = Math.max(1, Math.min(100, Number(options.pageSize || 20)))
      return readOnlineFirst(
        entityName,
        async () => {
          const result = await cloudEntity.filterPage(criteria, sortArg, options)
          await cacheCloudRows(entityName, result?.data || [])
          return result
        },
        async () => {
          const all = await cachedRows(entityName, criteria, sortArg, 0)
          const from = (page - 1) * pageSize
          return { data: all.slice(from, from + pageSize), total: all.length, page, pageSize }
        },
      )
    },

    async create(payload) {
      const record = normalizeRecord(payload)
      return writeOfflineFirst({
        entityName,
        operation: 'upsert',
        record,
        cloudWork: () => cloudEntity.create(record),
      })
    },

    async bulkCreate(payloads = []) {
      const output = []
      for (const payload of payloads || []) output.push(await this.create(payload))
      return output
    },

    async update(id, payload) {
      const existing = desktop ? await desktopDb.cacheGet(entityName, id).catch(() => null) : null
      const record = normalizeRecord({ ...(existing || {}), ...payload }, id)
      return writeOfflineFirst({
        entityName,
        operation: 'upsert',
        record,
        cloudWork: () => cloudEntity.update(id, payload),
      })
    },

    async upsert(payload) {
      const record = normalizeRecord(payload, payload?.id)
      return writeOfflineFirst({
        entityName,
        operation: 'upsert',
        record,
        cloudWork: () => cloudEntity.upsert(record),
      })
    },

    async bulkUpsert(payloads = []) {
      const output = []
      for (const payload of payloads || []) output.push(await this.upsert(payload))
      return output
    },

    async delete(id) {
      return writeOfflineFirst({
        entityName,
        operation: 'delete',
        record: { id },
        cloudWork: () => cloudEntity.delete(id),
      })
    },
  }
}

const wrappedEntities = Object.fromEntries(
  Object.entries(cloudBase44.entities || {}).map(([name, entity]) => [name, wrapEntity(name, entity)]),
)

const wrappedAuth = {
  ...cloudBase44.auth,
  async me() {
    if (!desktop) return cloudBase44.auth.me()
    if (online()) {
      try {
        const user = await cloudBase44.auth.me()
        await desktopDb.metaSet('last_authenticated_user', JSON.stringify(user))
        return user
      } catch (error) {
        if (!isNetworkError(error)) throw error
      }
    }
    const cached = await desktopDb.metaGet('last_authenticated_user')
    if (!cached) throw new Error('لا توجد جلسة دخول محفوظة على هذا الجهاز. اتصل بالإنترنت وسجّل الدخول مرة واحدة.')
    return JSON.parse(cached)
  },
}

export const base44 = {
  ...cloudBase44,
  auth: wrappedAuth,
  entities: wrappedEntities,
  desktop: {
    enabled: desktop,
    status: () => (desktop ? desktopDb.status() : Promise.resolve({ desktop: false })),
    syncNow: syncPendingOperations,
  },
}

export async function bootstrapDesktopSync() {
  if (!desktop || bootstrapped) return
  bootstrapped = true
  const status = await desktopDb.status()
  emitSyncStatus({
    phase: online() ? (status.pendingOperations ? 'pending' : 'ready') : 'offline',
    online: online(),
    pending: status.pendingOperations,
    databasePath: status.databasePath,
  })
  if (online()) syncPendingOperations().catch(() => {})
  window.addEventListener('online', () => syncPendingOperations().catch(() => {}))
  window.addEventListener('offline', () => emitSyncStatus({ phase: 'offline', online: false }))
  window.setInterval(() => {
    if (online()) syncPendingOperations().catch(() => {})
  }, 30_000)
}

if (desktop && typeof window !== 'undefined') {
  queueMicrotask(() => bootstrapDesktopSync().catch((error) => {
    emitSyncStatus({ phase: 'error', online: online(), error: error?.message || String(error) })
  }))
}
