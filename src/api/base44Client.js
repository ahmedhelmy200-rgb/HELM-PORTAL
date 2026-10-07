import { supabase } from '@/integrations/supabase/client'
import { appParams } from '@/lib/app-params'
import { emitAppEvent } from '@/lib/app-events'

// نظام LRU Cache محسّن
class LRUCache {
  constructor(maxSize = 500) {
    this.maxSize = maxSize
    this.cache = new Map()
  }

  get(key) {
    if (!this.cache.has(key)) return null
    // نقل العنصر للنهاية (الأحدث)
    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    this.cache.set(key, value)
    
    // إذا تجاوزنا الحد الأقصى، احذف الأقدم
    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
  }

  clear() {
    this.cache.clear()
  }

  delete(key) {
    this.cache.delete(key)
  }

  deleteByPrefix(prefix) {
    for (const key of [...this.cache.keys()]) {
      if (key.includes(prefix)) {
        this.cache.delete(key)
      }
    }
  }
}

const actorCache = { value: null, at: 0 }
const lruQueryCache = new LRUCache(500) // محدود بـ 500 مدخل
const ACTOR_TTL = 30_000 // زيادة من 10s إلى 30s
const QUERY_TTL = 8000
const PENDING_CLIENT_ROLE = 'pending_client'
const BROKER_ROLE = 'broker'
const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024
const SIGNED_FILE_EXPIRES_IN = 60 * 60 * 24 * 7
const CLIENT_SCOPED_ENTITIES = new Set(['Case', 'Invoice', 'Document', 'Session', 'Task'])
const STAFF_ROLES = new Set(['admin', 'staff', 'lawyer', 'assistant', 'secretary'])
const BROKER_WRITABLE_ENTITIES = new Set(['Client', 'Case'])

const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
]

const entityTableMap = {
  Case: 'cases',
  Client: 'clients',
  Broker: 'brokers',
  ConnectionRequest: 'connection_requests',
  Conversation: 'conversations',
  Document: 'documents',
  Event: 'events',
  Expense: 'expenses',
  FounderProfile: 'founder_profiles',
  FutureDebt: 'future_debts',
  Invoice: 'invoices',
  LegalTemplate: 'legal_templates',
  Message: 'messages',
  Notification: 'notifications',
  OfficeSettings: 'office_settings',
  Session: 'sessions',
  Task: 'tasks',
}

const STORAGE_URL_FIELDS = ['file_url', 'logo_url', 'stamp_url', 'signature_url', 'photo_url', 'image_url']

function normalizeEmail(value) { return String(value || '').trim().toLowerCase() }
function safePostgrestValue(value) { return String(value || '').replace(/\\/g, '\\\\').replace(/,/g, ' ').replace(/\(/g, ' ').replace(/\)/g, ' ').trim() }
function isMissingColumnError(error, columnName) { const message = String(error?.message || error || '').toLowerCase(); return message.includes(`'${columnName}'`) || message.includes(`"${columnName}"`) }
function isMissingStableScopeColumn(error) { return isMissingColumnError(error, 'client_id') || isMissingColumnError(error, 'user_id') }
function parseSort(sortArg) { if (!sortArg) return null; const ascending = !String(sortArg).startsWith('-'); const field = String(sortArg).replace(/^-/, ''); return { field, ascending } }
function friendlyError(error) {
  if (!error) return new Error('حدث خطأ غير معروف.')
  const message = String(error.message || error || '')
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) return new Error('تعذر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.')
  if (message.includes('Auth session missing') || message.includes('JWT')) return new Error('انتهت جلسة الدخول. أعد تسجيل الدخول.')
  if (message.includes('Bucket not found')) return new Error('حاوية التخزين غير موجودة في Supabase. شغّل ملف SQL الخاص بالمرحلة الأولى أو أنشئ حاوية جديدة.')
  return error instanceof Error ? error : new Error(message || 'حدث خطأ أثناء معالجة الطلب.')
}
async function safeRequest(work) { try { return await work() } catch (error) { throw friendlyError(error) } }
function validateUploadFile(file) { if (!file) throw new Error('لم يتم اختيار ملف.'); if (file.size > MAX_UPLOAD_SIZE_BYTES) throw new Error('حجم الملف أكبر من 15 ميغابايت.'); if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) throw new Error('نوع الملف غير مدعوم.'); return true }
function normalizeStorageBucket(value, fallback = 'uploads') { const raw = String(value || '').trim(); if (!raw) return fallback; const invalid = /^https?:\/\//i.test(raw) || raw.includes('/storage/'); return invalid ? fallback : raw }
function isBucketConfigError(error) { const message = String(error?.message || error || '').toLowerCase(); return message.includes('bucket not found') || message.includes('bucket name invalid') || message.includes('no bucket') }
function buildStorageRef(bucket, path) { if (!bucket || !path) return null; return `storage://${bucket}/${String(path).replace(/^\/+/, '')}` }
function parseStorageRef(value) {
  if (!value || typeof value !== 'string') return null
  const raw = value.trim()
  if (raw.startsWith('storage://')) {
    const withoutScheme = raw.replace(/^storage:\/\//, '')
    const firstSlash = withoutScheme.indexOf('/')
    if (firstSlash <= 0) return null
    return { bucket: withoutScheme.slice(0, firstSlash), path: decodeURIComponent(withoutScheme.slice(firstSlash + 1)), raw }
  }
  try {
    const url = new URL(raw)
    const patterns = ['/storage/v1/object/public/', '/storage/v1/object/sign/', '/storage/v1/object/authenticated/']
    const matched = patterns.find((pattern) => url.pathname.includes(pattern))
    if (!matched) return null
    const tail = url.pathname.split(matched)[1] || ''
    const parts = tail.split('/')
    if (parts.length < 2) return null
    const bucket = parts.shift()
    const path = decodeURIComponent(parts.join('/').split('?')[0])
    return { bucket, path, raw }
  } catch { return null }
}
async function getSignedFileUrl(bucket, path, expiresIn = SIGNED_FILE_EXPIRES_IN) { if (!bucket || !path) return null; const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn); if (error) throw error; return data?.signedUrl || null }
async function resolveStorageValue(value) { const parsed = parseStorageRef(value); if (!parsed) return { raw: value, signedUrl: value, bucket: null, path: null }; const signedUrl = await getSignedFileUrl(parsed.bucket, parsed.path); return { raw: value, signedUrl, bucket: parsed.bucket, path: parsed.path } }
async function hydrateRecordUrls(record) { if (!record || typeof record !== 'object') return record; const cloned = { ...record }; for (const field of STORAGE_URL_FIELDS) { if (!cloned[field]) continue; const resolved = await resolveStorageValue(cloned[field]); cloned[field] = resolved.signedUrl } return cloned }
async function hydrateRows(rows) { if (!Array.isArray(rows)) return []; return Promise.all(rows.map(hydrateRecordUrls)) }
async function findBrokerForActor(email, profile) {
  try {
    const fullName = profile?.full_name || profile?.name || ''
    const parts = [`email.eq.${safePostgrestValue(email)}`]
    if (fullName) parts.push(`full_name.eq.${safePostgrestValue(fullName)}`)
    const { data, error } = await supabase.from('brokers').select('*').or(parts.join(',')).limit(1)
    if (error) return null
    return data?.[0] || null
  } catch { return null }
}
async function currentActor() {
  const now = Date.now()
  if (actorCache.value && now - actorCache.at < ACTOR_TTL) return actorCache.value
  const { data: authData, error } = await supabase.auth.getUser()
  if (error || !authData?.user) {
    actorCache.value = { email: null, role: 'guest', client: null, broker: null, profile: null, user: null, isPendingClient: false }
    actorCache.at = now
    return actorCache.value
  }
  const email = normalizeEmail(authData.user.email)
  const [{ data: profileRows }, { data: clientRows }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('email', email).limit(1),
    supabase.from('clients').select('*').eq('email', email).limit(1),
  ])
  const profile = profileRows?.[0] || null
  const client = clientRows?.[0] || null
  const isStaff = !!(profile?.role && STAFF_ROLES.has(profile.role))
  const isBrokerProfile = normalizeEmail(profile?.role) === BROKER_ROLE
  const broker = isBrokerProfile ? await findBrokerForActor(email, profile) : null
  const isBroker = isBrokerProfile || !!broker
  const isPendingClient = !isStaff && !isBroker && !client
  const role = isStaff ? profile.role : (isBroker ? BROKER_ROLE : (client ? 'client' : PENDING_CLIENT_ROLE))
  actorCache.value = { email, role, client, broker, profile, user: authData.user, isPendingClient }
  actorCache.at = now
  return actorCache.value
}
function cacheKey(table, mode, criteria, sortArg, limitValue, actor) { return JSON.stringify({ table, mode, criteria, sortArg, limitValue, email: actor?.email, role: actor?.role, clientId: actor?.client?.id }) }
function getCached(key) { if (!QUERY_TTL) return null; const item = lruQueryCache.get(key); if (!item) return null; if (Date.now() - item.at > QUERY_TTL) { lruQueryCache.delete(key); return null } return item.value }
function setCached(key, value) { if (!QUERY_TTL) return value; lruQueryCache.set(key, { at: Date.now(), value }); return value }
function stripVirtualFields(payload) { if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload; return Object.fromEntries(Object.entries(payload).filter(([key]) => !key.startsWith('_'))) }
function stripStableClientFields(payload) { if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload; const { client_id, user_id, ...rest } = payload; return rest }
function clearEntityCache(table = null) { actorCache.at = 0; if (!table) { lruQueryCache.clear(); emitAppEvent('app:data-changed', { table: null }); return } lruQueryCache.deleteByPrefix(table); emitAppEvent('app:data-changed', { table }) }
function applyBrokerScope(query, entityName, actor) {
  const brokerName = actor?.broker?.full_name || actor?.profile?.full_name || actor?.email || '__none__'
  const brokerId = actor?.broker?.id || null
  if (entityName === 'Broker') {
    if (brokerId) return query.eq('id', brokerId)
    return query.eq('email', actor.email)
  }
  if (entityName === 'Client' || entityName === 'Case') {
    if (brokerId) return query.or(`broker_id.eq.${brokerId},broker_name.eq.${safePostgrestValue(brokerName)}`)
    return query.eq('broker_name', brokerName)
  }
  if (entityName === 'Notification') return query.or(`user_email.eq.${safePostgrestValue(actor.email)},user_id.eq.${actor.user?.id || '__none__'}`)
  if (entityName === 'OfficeSettings') return query.limit(1)
  return query.eq('id', '__forbidden__')
}
function applyActorRestrictions(query, entityName, actor, options = {}) {
  if (!actor?.email) return query
  if (actor.role === PENDING_CLIENT_ROLE) {
    switch (entityName) {
      case 'Client': return query.eq('email', actor.email)
      case 'OfficeSettings': return query.limit(1)
      default: return query.eq('id', '__forbidden__')
    }
  }
  if (actor.role === BROKER_ROLE) return applyBrokerScope(query, entityName, actor)
  if (actor.role !== 'client') return query
  const clientName = actor.client?.full_name || '__none__'
  const clientId = actor.client?.id || null
  const forceLegacy = !!options.forceLegacyClientName
  switch (entityName) {
    case 'Client': return query.eq('email', actor.email)
    case 'Case':
    case 'Invoice':
    case 'Document':
    case 'Session':
    case 'Task':
      if (clientId && !forceLegacy) return query.or(`client_id.eq.${clientId},client_name.eq.${safePostgrestValue(clientName)}`)
      return query.eq('client_name', clientName)
    case 'Notification': return query.or(`user_email.eq.${safePostgrestValue(actor.email)},user_id.eq.${actor.user?.id || '__none__'}`)
    case 'OfficeSettings': return query.limit(1)
    case 'ConnectionRequest': return query.or(`from_email.eq.${safePostgrestValue(actor.email)},to_email.eq.${safePostgrestValue(actor.email)}`)
    default: return query.eq('created_by', actor.email)
  }
}
function applyCriteria(query, criteria = {}) { let next = query; Object.entries(criteria || {}).forEach(([key, value]) => { if (value === undefined || value === null || value === '') return; if (Array.isArray(value)) next = next.in(key, value); else next = next.eq(key, value) }); return next }
function shouldRetryLegacyClientName(error, entityName, actor) { return actor?.role === 'client' && CLIENT_SCOPED_ENTITIES.has(entityName) && actor?.client?.full_name && (isMissingColumnError(error, 'client_id') || isMissingColumnError(error, 'user_id')) }
async function runClientScopedRead({ table, entityName, actor, sortArg, limitValue, criteria = null, paged = false, page = 1, pageSize = 20 }) {
  const build = (forceLegacyClientName = false) => {
    let query = paged ? supabase.from(table).select('*', { count: 'exact' }) : supabase.from(table).select('*')
    query = applyActorRestrictions(query, entityName, actor, { forceLegacyClientName })
    if (criteria) query = applyCriteria(query, criteria)
    const sort = parseSort(sortArg)
    if (sort) query = query.order(sort.field, { ascending: sort.ascending })
    if (paged) { const fromIndex = (page - 1) * pageSize; const toIndex = fromIndex + pageSize - 1; query = query.range(fromIndex, toIndex) }
    else if (limitValue) query = query.limit(limitValue)
    return query
  }
  let result = await build(false)
  if (result.error && shouldRetryLegacyClientName(result.error, entityName, actor)) {
    console.warn(`[base44] Falling back to legacy client_name scope for ${entityName}:`, result.error.message)
    result = await build(true)
  }
  return result
}
async function retryWriteWithoutStableClientFields({ table, payload, write }) { const first = await write(payload); if (!first.error || !isMissingStableScopeColumn(first.error)) return first; console.warn(`[base44] Retrying write without stable fields:`, first.error.message); return write(stripStableClientFields(payload)) }
function brokerScopedPayload(payload, actor) {
  const broker = actor?.broker || {}
  const brokerName = broker.full_name || actor?.profile?.full_name || payload?.broker_name || ''
  return { ...payload, broker_id: broker.id || payload?.broker_id || null, broker_name: brokerName, broker_commission_percent: payload?.broker_commission_percent ?? broker.default_commission_percent ?? null }
}
async function sanitizeWritePayload(entityName, payload, actor) {
  if (actor.role === PENDING_CLIENT_ROLE) throw new Error('أكمل تسجيلك كموكّل أولاً قبل استخدام النظام.')
  if (actor.role === BROKER_ROLE) {
    if (!BROKER_WRITABLE_ENTITIES.has(entityName)) throw new Error('صلاحية البروكر لا تشمل الحسابات المالية أو هذا القسم.')
    return brokerScopedPayload(payload, actor)
  }
  if (actor.role !== 'client') return payload
  if (!['Document', 'Notification', 'ConnectionRequest'].includes(entityName)) throw new Error('هذا الإجراء غير متاح في بوابة الموكّل.')
  if (entityName === 'Document') return { ...payload, client_id: actor.client?.id || payload.client_id || null, client_name: actor.client?.full_name || payload.client_name, created_by: actor.email }
  if (entityName === 'Notification') return { ...payload, user_id: actor.user?.id || payload.user_id || null, user_email: payload.user_email || actor.email, created_by: actor.email }
  return { ...payload, from_email: payload.from_email || actor.email, from_name: payload.from_name || actor.client?.full_name || actor.profile?.full_name }
}
function createEntity(entityName) {
  const table = entityTableMap[entityName]
  return {
    async list(sortArg = '-created_date', limitValue = 1000) {
      return safeRequest(async () => { const actor = await currentActor(); const key = cacheKey(table, 'list', null, sortArg, limitValue, actor); const cached = getCached(key); if (cached) return cached; const result = await runClientScopedRead({ table, entityName, actor, sortArg, limitValue }); const data = result.data ? await hydrateRows(result.data) : []; return setCached(key, data) })
    },
    async listPage(sortArg = '-created_date', options = {}) {
      return safeRequest(async () => { const actor = await currentActor(); const page = Math.max(1, Number(options.page || 1)); const pageSize = Math.max(1, Math.min(100, Number(options.pageSize || 20))); const key = cacheKey(table, 'listPage', null, sortArg, pageSize, actor) + `:${page}`; const cached = getCached(key); if (cached) return cached; const result = await runClientScopedRead({ table, entityName, actor, sortArg, paged: true, page, pageSize }); const data = result.data ? await hydrateRows(result.data) : []; const pageData = { data, count: result.count, page, pageSize }; return setCached(key, pageData) })
    },
    async filter(criteria = {}, sortArg = null, limitValue = 1000) {
      return safeRequest(async () => { const actor = await currentActor(); const key = cacheKey(table, 'filter', criteria, sortArg, limitValue, actor); const cached = getCached(key); if (cached) return cached; const result = await runClientScopedRead({ table, entityName, actor, sortArg, limitValue, criteria }); const data = result.data ? await hydrateRows(result.data) : []; return setCached(key, data) })
    },
    async filterPage(criteria = {}, sortArg = null, options = {}) {
      return safeRequest(async () => { const actor = await currentActor(); const page = Math.max(1, Number(options.page || 1)); const pageSize = Math.max(1, Math.min(100, Number(options.pageSize || 20))); const key = cacheKey(table, 'filterPage', criteria, sortArg, pageSize, actor) + `:${page}`; const cached = getCached(key); if (cached) return cached; const result = await runClientScopedRead({ table, entityName, actor, sortArg, limitValue: null, criteria, paged: true, page, pageSize }); const data = result.data ? await hydrateRows(result.data) : []; const pageData = { data, count: result.count, page, pageSize }; return setCached(key, pageData) })
    },
    async create(payload) {
      return safeRequest(async () => { const actor = await currentActor(); const cleanPayload = stripVirtualFields(await sanitizeWritePayload(entityName, payload, actor)); const row = { ...cleanPayload, created_date: new Date().toISOString() }; const { data, error } = await supabase.from(table).insert([row]).select(); clearEntityCache(table); if (error) throw error; return data?.[0] })
    },
    async bulkCreate(payloads = []) {
      return safeRequest(async () => { if (!Array.isArray(payloads) || payloads.length === 0) return []; const actor = await currentActor(); const rows = []; for (const payload of payloads) { const cleanPayload = stripVirtualFields(await sanitizeWritePayload(entityName, payload, actor)); rows.push({ ...cleanPayload, created_date: new Date().toISOString() }) } const { data, error } = await supabase.from(table).insert(rows).select(); clearEntityCache(table); if (error) throw error; return data || [] })
    },
    async update(id, payload) {
      return safeRequest(async () => { const actor = await currentActor(); if ((actor.role === PENDING_CLIENT_ROLE) || (actor.role === 'client' && entityName !== 'Document')) throw new Error('هذا الإجراء غير متاح في بوابة الموكّل.'); const cleanPayload = stripVirtualFields(payload); const result = await retryWriteWithoutStableClientFields({ table, payload: cleanPayload, write: (p) => supabase.from(table).update(p).eq('id', id).select() }); clearEntityCache(table); if (result.error) throw result.error; return result.data?.[0] })
    },
    async upsert(payload) {
      return safeRequest(async () => { const actor = await currentActor(); const cleanPayload = stripVirtualFields(await sanitizeWritePayload(entityName, payload, actor)); const { data, error } = await supabase.from(table).upsert([cleanPayload], { onConflict: 'id' }).select(); clearEntityCache(table); if (error) throw error; return data?.[0] })
    },
    async bulkUpsert(payloads = []) {
      return safeRequest(async () => { if (!Array.isArray(payloads) || payloads.length === 0) return []; const actor = await currentActor(); const rows = []; for (const payload of payloads) { rows.push(stripVirtualFields(await sanitizeWritePayload(entityName, payload, actor))) } const { data, error } = await supabase.from(table).upsert(rows, { onConflict: 'id' }).select(); clearEntityCache(table); if (error) throw error; return data || [] })
    },
    async delete(id) {
      return safeRequest(async () => { const actor = await currentActor(); if ((actor.role === PENDING_CLIENT_ROLE) || (actor.role === BROKER_ROLE) || (actor.role === 'client' && entityName !== 'Document')) throw new Error('لا توجد صلاحية لحذف هذا العنصر.'); const { error } = await supabase.from(table).delete().eq('id', id); clearEntityCache(table); if (error) throw error })
    },
  }
}
const auth = {
  async me() {
    return safeRequest(async () => {
      const actor = await currentActor()
      if (!actor?.email) throw new Error('Not authenticated')
      const profile = actor.profile
      return { ...profile, id: actor.user.id, email: actor.email, full_name: profile?.full_name || actor.broker?.full_name || actor.client?.full_name || actor.user.user_metadata?.full_name || actor.email, role: actor.role, is_operations_manager: profile?.is_operations_manager || false }
    })
  },
  async logout(redirectTo = null) { await supabase.auth.signOut(); if (redirectTo) window.location.href = redirectTo; else window.location.href = window.location.origin },
  async redirectToLogin(returnTo = window.location.origin) { const redirectTo = import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_SUPABASE_GOOGLE_REDIRECT_URL || returnTo || window.location.origin; window.location.href = redirectTo },
  async registerClientProfile(payload = {}, attachments = []) {
    return safeRequest(async () => { const actor = await currentActor(); if (!actor?.email) throw new Error('يجب تسجيل الدخول أولاً.'); if (actor.role !== PENDING_CLIENT_ROLE && actor.role !== 'client') throw new Error('غير مصرح.'); clearEntityCache(); return { ok: true } })
  },
}
const integrations = { Core: { async UploadFile({ file, bucket = appParams.storageBucket || 'uploads', folder = 'uploads' }) { return safeRequest(async () => { validateUploadFile(file); const safeBucket = normalizeStorageBucket(bucket); const filePath = `${folder.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${file.name}`; const { data, error } = await supabase.storage.from(safeBucket).upload(filePath, file, { cacheControl: '3600', upsert: false }); if (isBucketConfigError(error)) throw new Error(`خطأ في إعدادات التخزين: تحقق من اسم الحاوية "${safeBucket}" في Supabase.`); if (error) throw error; return { bucket: safeBucket, path: filePath, url: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${safeBucket}/${filePath}` } }) } } }
export const base44 = { auth, entities: Object.fromEntries(Object.keys(entityTableMap).map((name) => [name, createEntity(name)])), integrations, realtime: { subscribe() { const channel = supabase.channel('realtime:*'); channel.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => { clearEntityCache(); emitAppEvent('app:realtime-change', payload) }).subscribe(); return () => channel.unsubscribe() } }, __clearCache: () => clearEntityCache() }
export { supabase }
