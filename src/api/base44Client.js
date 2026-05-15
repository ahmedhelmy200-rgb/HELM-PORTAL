import { supabase } from '@/integrations/supabase/client'
import { appParams } from '@/lib/app-params'
import { emitAppEvent } from '@/lib/app-events'

const actorCache = { value: null, at: 0 }
const queryCache = new Map()
const ACTOR_TTL = 10_000
const QUERY_TTL = 8000
const PENDING_CLIENT_ROLE = 'pending_client'
const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024
const CLIENT_SCOPED_ENTITIES = new Set(['Case', 'Invoice', 'Document', 'Session', 'Task'])
const STAFF_ROLES = new Set(['admin', 'staff', 'lawyer', 'assistant', 'secretary'])

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

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function safePostgrestValue(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/,/g, ' ')
    .replace(/\(/g, ' ')
    .replace(/\)/g, ' ')
    .trim()
}

function isMissingColumnError(error, columnName) {
  const message = String(error?.message || error || '').toLowerCase()
  return message.includes(`'${columnName}'`) ||
    message.includes(`"${columnName}"`) ||
    message.includes(`column ${columnName}`) ||
    message.includes(`${columnName} column`) ||
    (message.includes(columnName) && message.includes('does not exist'))
}

function isMissingStableScopeColumn(error) {
  return isMissingColumnError(error, 'client_id') || isMissingColumnError(error, 'user_id')
}

function parseSort(sortArg) {
  if (!sortArg) return null
  const ascending = !String(sortArg).startsWith('-')
  const field = String(sortArg).replace(/^-/, '')
  return { field, ascending }
}

function friendlyError(error) {
  if (!error) return new Error('حدث خطأ غير معروف.')
  const message = String(error.message || error || '')
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return new Error('تعذر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.')
  }
  if (message.includes('Auth session missing') || message.includes('JWT')) {
    return new Error('انتهت جلسة الدخول. أعد تسجيل الدخول.')
  }
  if (message.includes('Bucket not found')) {
    return new Error('حاوية التخزين غير موجودة في Supabase. شغّل ملف SQL الخاص بالمرحلة الأولى أو أنشئ bucket باسم uploads من Supabase.')
  }
  return error instanceof Error ? error : new Error(message || 'حدث خطأ أثناء معالجة الطلب.')
}

async function safeRequest(work) {
  try {
    return await work()
  } catch (error) {
    throw friendlyError(error)
  }
}

function validateUploadFile(file) {
  if (!file) throw new Error('لم يتم اختيار ملف.')
  if (file.size > MAX_UPLOAD_SIZE_BYTES) throw new Error('حجم الملف أكبر من 15 ميجابايت، وهذا غير مسموح حاليًا.')
  const type = String(file.type || '').toLowerCase()
  const name = String(file.name || '').toLowerCase()
  const allowedByExtension = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|webp|txt)$/i.test(name)
  if (type && !ALLOWED_UPLOAD_TYPES.includes(type) && !allowedByExtension) {
    throw new Error('نوع الملف غير مدعوم. المسموح: PDF وWord وExcel وPowerPoint والصور والنصوص.')
  }
}

function buildStorageRef(bucket, path) {
  if (!bucket || !path) return null
  return `storage://${bucket}/${String(path).replace(/^\/+/, '')}`
}

function parseStorageRef(value) {
  if (!value || typeof value !== 'string') return null
  const raw = value.trim()
  if (raw.startsWith('storage://')) {
    const withoutScheme = raw.replace(/^storage:\/\//, '')
    const firstSlash = withoutScheme.indexOf('/')
    if (firstSlash <= 0) return null
    return {
      bucket: withoutScheme.slice(0, firstSlash),
      path: decodeURIComponent(withoutScheme.slice(firstSlash + 1)),
      raw,
    }
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
    const path = decodeURIComponent(parts.join('/'))
    return { bucket, path, raw }
  } catch {
    return null
  }
}

async function getSignedFileUrl(bucket, path, expiresIn = 3600) {
  if (!bucket || !path) return null
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error) {
    console.error('createSignedUrl error:', error)
    return null
  }
  return data?.signedUrl || null
}

async function resolveStorageValue(value) {
  const parsed = parseStorageRef(value)
  if (!parsed) return { raw: value, signedUrl: value, bucket: null, path: null }
  const signedUrl = await getSignedFileUrl(parsed.bucket, parsed.path)
  return {
    raw: buildStorageRef(parsed.bucket, parsed.path),
    signedUrl: signedUrl || value,
    bucket: parsed.bucket,
    path: parsed.path,
  }
}

async function hydrateRecordUrls(record) {
  if (!record || typeof record !== 'object') return record
  const cloned = { ...record }
  for (const field of STORAGE_URL_FIELDS) {
    if (!cloned[field]) continue
    const resolved = await resolveStorageValue(cloned[field])
    cloned[`${field}_ref`] = resolved.raw || cloned[field]
    cloned[`${field}_bucket`] = resolved.bucket || null
    cloned[`${field}_path`] = resolved.path || null
    cloned[field] = resolved.signedUrl || cloned[field]
  }
  return cloned
}

async function hydrateRows(rows) {
  if (!Array.isArray(rows)) return []
  return Promise.all(rows.map(hydrateRecordUrls))
}

async function currentActor() {
  const now = Date.now()
  if (actorCache.value && now - actorCache.at < ACTOR_TTL) return actorCache.value

  const { data: authData, error } = await supabase.auth.getUser()
  if (error || !authData?.user) {
    actorCache.value = { email: null, role: 'guest', client: null, profile: null, user: null, isPendingClient: false }
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
  const isPendingClient = !isStaff && !client
  const role = isStaff ? profile.role : (client ? 'client' : PENDING_CLIENT_ROLE)

  actorCache.value = { email, role, client, profile, user: authData.user, isPendingClient }
  actorCache.at = now
  return actorCache.value
}

function cacheKey(table, mode, criteria, sortArg, limitValue, actor) {
  return JSON.stringify({ table, mode, criteria, sortArg, limitValue, email: actor?.email, role: actor?.role, clientId: actor?.client?.id })
}

function getCached(key) {
  if (!QUERY_TTL) return null
  const item = queryCache.get(key)
  if (!item) return null
  if (Date.now() - item.at > QUERY_TTL) {
    queryCache.delete(key)
    return null
  }
  return item.value
}

function setCached(key, value) {
  if (!QUERY_TTL) return value
  queryCache.set(key, { at: Date.now(), value })
  return value
}

function stripVirtualFields(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !/(?:_ref|_bucket|_path)$/.test(key) && key !== 'preview_url')
  )
}

function stripStableClientFields(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload
  const { client_id, user_id, ...rest } = payload
  return rest
}

function clearEntityCache(table = null) {
  actorCache.at = 0
  if (!table) {
    queryCache.clear()
    emitAppEvent('app:data-changed', { table: null })
    return
  }
  for (const key of [...queryCache.keys()]) {
    if (key.includes(`"table":"${table}"`)) queryCache.delete(key)
  }
  emitAppEvent('app:data-changed', { table })
}

function applyActorRestrictions(query, entityName, actor, options = {}) {
  if (!actor?.email) return query

  if (actor.role === PENDING_CLIENT_ROLE) {
    switch (entityName) {
      case 'Client':
        return query.eq('email', actor.email)
      case 'OfficeSettings':
        return query.limit(1)
      default:
        return query.eq('id', '__forbidden__')
    }
  }

  if (actor.role !== 'client') return query

  const clientName = actor.client?.full_name || '__none__'
  const clientId = actor.client?.id || null
  const forceLegacy = !!options.forceLegacyClientName

  switch (entityName) {
    case 'Client':
      return query.eq('email', actor.email)

    case 'Case':
    case 'Invoice':
    case 'Document':
    case 'Session':
    case 'Task':
      if (clientId && !forceLegacy) {
        return query.or(`client_id.eq.${clientId},client_name.eq.${safePostgrestValue(clientName)}`)
      }
      return query.eq('client_name', clientName)

    case 'Notification':
      return query.or(`user_email.eq.${safePostgrestValue(actor.email)},user_id.eq.${actor.user?.id || '__none__'}`)

    case 'OfficeSettings':
      return query.limit(1)

    case 'ConnectionRequest':
      return query.or(`from_email.eq.${safePostgrestValue(actor.email)},to_email.eq.${safePostgrestValue(actor.email)}`)

    default:
      return query.eq('created_by', actor.email)
  }
}

function applyCriteria(query, criteria = {}) {
  let next = query
  Object.entries(criteria || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) next = next.contains(key, value)
    else next = next.eq(key, value)
  })
  return next
}

function shouldRetryLegacyClientName(error, entityName, actor) {
  return actor?.role === 'client' &&
    CLIENT_SCOPED_ENTITIES.has(entityName) &&
    actor?.client?.full_name &&
    (isMissingColumnError(error, 'client_id') || String(error?.message || '').includes('failed to parse logic tree'))
}

async function runClientScopedRead({ table, entityName, actor, sortArg, limitValue, criteria = null, paged = false, page = 1, pageSize = 20 }) {
  const build = (forceLegacyClientName = false) => {
    let query = paged
      ? supabase.from(table).select('*', { count: 'exact' })
      : supabase.from(table).select('*')
    query = applyActorRestrictions(query, entityName, actor, { forceLegacyClientName })
    if (criteria) query = applyCriteria(query, criteria)
    const sort = parseSort(sortArg)
    if (sort) query = query.order(sort.field, { ascending: sort.ascending })
    if (paged) {
      const fromIndex = (page - 1) * pageSize
      const toIndex = fromIndex + pageSize - 1
      query = query.range(fromIndex, toIndex)
    } else if (limitValue) {
      query = query.limit(limitValue)
    }
    return query
  }

  let result = await build(false)
  if (result.error && shouldRetryLegacyClientName(result.error, entityName, actor)) {
    console.warn(`[base44] Falling back to legacy client_name scope for ${entityName}:`, result.error.message)
    result = await build(true)
  }
  return result
}

async function retryWriteWithoutStableClientFields({ table, payload, write }) {
  const first = await write(payload)
  if (!first.error || !isMissingStableScopeColumn(first.error)) return first
  const fallbackPayload = Array.isArray(payload) ? payload.map(stripStableClientFields) : stripStableClientFields(payload)
  console.warn(`[base44] Falling back to legacy write for ${table}:`, first.error.message)
  return write(fallbackPayload)
}

async function sanitizeWritePayload(entityName, payload, actor) {
  if (actor.role === PENDING_CLIENT_ROLE) {
    throw new Error('أكمل تسجيلك كموكّل أولاً قبل استخدام النظام.')
  }
  if (actor.role !== 'client') return payload

  if (!['Document', 'Notification', 'ConnectionRequest'].includes(entityName)) {
    throw new Error('هذا الإجراء غير متاح في بوابة الموكّل.')
  }

  if (entityName === 'Document') {
    return {
      ...payload,
      client_id: actor.client?.id || payload.client_id || null,
      client_name: actor.client?.full_name || payload.client_name,
      created_by: actor.email,
      status: payload.status || 'مسودة',
    }
  }

  if (entityName === 'Notification') {
    return {
      ...payload,
      user_id: actor.user?.id || payload.user_id || null,
      user_email: payload.user_email || actor.email,
      created_by: actor.email,
    }
  }

  return {
    ...payload,
    from_email: payload.from_email || actor.email,
    from_name: payload.from_name || actor.client?.full_name || actor.profile?.full_name,
  }
}

function createEntity(entityName) {
  const table = entityTableMap[entityName]
  return {
    async list(sortArg = '-created_date', limitValue = 1000) {
      return safeRequest(async () => {
        const actor = await currentActor()
        const key = cacheKey(table, 'list', null, sortArg, limitValue, actor)
        const cached = getCached(key)
        if (cached) return cached

        const { data, error } = await runClientScopedRead({ table, entityName, actor, sortArg, limitValue })
        if (error) throw error
        const hydrated = await hydrateRows(data || [])
        return setCached(key, hydrated)
      })
    },

    async listPage(sortArg = '-created_date', options = {}) {
      return safeRequest(async () => {
        const actor = await currentActor()
        const page = Math.max(1, Number(options.page || 1))
        const pageSize = Math.max(1, Math.min(100, Number(options.pageSize || 20)))
        const { data, error, count } = await runClientScopedRead({ table, entityName, actor, sortArg, paged: true, page, pageSize })
        if (error) throw error
        return { data: await hydrateRows(data || []), total: count || 0, page, pageSize }
      })
    },

    async filter(criteria = {}, sortArg = null, limitValue = 1000) {
      return safeRequest(async () => {
        const actor = await currentActor()
        const key = cacheKey(table, 'filter', criteria, sortArg, limitValue, actor)
        const cached = getCached(key)
        if (cached) return cached

        const { data, error } = await runClientScopedRead({ table, entityName, actor, sortArg, limitValue, criteria })
        if (error) throw error
        const hydrated = await hydrateRows(data || [])
        return setCached(key, hydrated)
      })
    },

    async filterPage(criteria = {}, sortArg = null, options = {}) {
      return safeRequest(async () => {
        const actor = await currentActor()
        const page = Math.max(1, Number(options.page || 1))
        const pageSize = Math.max(1, Math.min(100, Number(options.pageSize || 20)))
        const { data, error, count } = await runClientScopedRead({ table, entityName, actor, sortArg, criteria, paged: true, page, pageSize })
        if (error) throw error
        return { data: await hydrateRows(data || []), total: count || 0, page, pageSize }
      })
    },

    async create(payload) {
      return safeRequest(async () => {
        const actor = await currentActor()
        const cleanPayload = stripVirtualFields(await sanitizeWritePayload(entityName, payload, actor))
        const row = {
          ...cleanPayload,
          created_by: cleanPayload?.created_by || actor.email,
          updated_date: new Date().toISOString(),
        }
        const { data, error } = await retryWriteWithoutStableClientFields({
          table,
          payload: row,
          write: (nextPayload) => supabase.from(table).insert(nextPayload).select().single(),
        })
        if (error) throw error
        clearEntityCache(table)
        return hydrateRecordUrls(data)
      })
    },

    async bulkCreate(payloads = []) {
      return safeRequest(async () => {
        if (!Array.isArray(payloads) || payloads.length === 0) return []
        const actor = await currentActor()
        const rows = []
        for (const payload of payloads) {
          const cleanPayload = stripVirtualFields(await sanitizeWritePayload(entityName, payload, actor))
          rows.push({
            ...cleanPayload,
            created_by: cleanPayload?.created_by || actor.email,
            updated_date: new Date().toISOString(),
          })
        }
        const { data, error } = await retryWriteWithoutStableClientFields({
          table,
          payload: rows,
          write: (nextPayload) => supabase.from(table).insert(nextPayload).select(),
        })
        if (error) throw error
        clearEntityCache(table)
        return hydrateRows(data || [])
      })
    },

    async update(id, payload) {
      return safeRequest(async () => {
        const actor = await currentActor()
        if ((actor.role === PENDING_CLIENT_ROLE) || (actor.role === 'client' && entityName !== 'Document')) {
          throw new Error('هذا الإجراء غير متاح في بوابة الموكّل.')
        }
        const safePayload = stripVirtualFields(actor.role === 'client'
          ? {
              ...payload,
              client_id: actor.client?.id || payload.client_id || null,
              client_name: actor.client?.full_name || payload.client_name,
            }
          : payload)

        const { data, error } = await retryWriteWithoutStableClientFields({
          table,
          payload: { ...safePayload, updated_date: new Date().toISOString() },
          write: (nextPayload) => supabase.from(table).update(nextPayload).eq('id', id).select().single(),
        })
        if (error) throw error
        clearEntityCache(table)
        return hydrateRecordUrls(data)
      })
    },

    async upsert(payload) {
      return safeRequest(async () => {
        const actor = await currentActor()
        const cleanPayload = stripVirtualFields(await sanitizeWritePayload(entityName, payload, actor))
        const { data, error } = await retryWriteWithoutStableClientFields({
          table,
          payload: { ...cleanPayload, updated_date: new Date().toISOString() },
          write: (nextPayload) => supabase.from(table).upsert(nextPayload, { onConflict: 'id' }).select().single(),
        })
        if (error) throw error
        clearEntityCache(table)
        return hydrateRecordUrls(data)
      })
    },

    async bulkUpsert(payloads = []) {
      return safeRequest(async () => {
        if (!Array.isArray(payloads) || payloads.length === 0) return []
        const actor = await currentActor()
        const rows = []
        for (const payload of payloads) {
          const cleanPayload = stripVirtualFields(await sanitizeWritePayload(entityName, payload, actor))
          rows.push({ ...cleanPayload, updated_date: new Date().toISOString() })
        }
        const { data, error } = await retryWriteWithoutStableClientFields({
          table,
          payload: rows,
          write: (nextPayload) => supabase.from(table).upsert(nextPayload, { onConflict: 'id' }).select(),
        })
        if (error) throw error
        clearEntityCache(table)
        return hydrateRows(data || [])
      })
    },

    async delete(id) {
      return safeRequest(async () => {
        const actor = await currentActor()
        if ((actor.role === PENDING_CLIENT_ROLE) || (actor.role === 'client' && entityName !== 'Document')) {
          throw new Error('هذا الإجراء غير متاح في بوابة الموكّل.')
        }
        const { error } = await supabase.from(table).delete().eq('id', id)
        if (error) throw error
        clearEntityCache(table)
        return true
      })
    },
  }
}

const auth = {
  async me() {
    return safeRequest(async () => {
      const actor = await currentActor()
      if (!actor?.email) throw new Error('Not authenticated')
      const profile = actor.profile
      return {
        ...profile,
        id: actor.user.id,
        email: actor.email,
        full_name:
          profile?.full_name ||
          actor.client?.full_name ||
          actor.user.user_metadata?.full_name ||
          actor.user.user_metadata?.name ||
          actor.email,
        role: actor.role,
        registration_status: actor.client ? 'registered' : 'pending',
        avatar_url: profile?.avatar_url || actor.user.user_metadata?.avatar_url || null,
        client_id: actor.client?.id || null,
        client_name: actor.client?.full_name || null,
      }
    })
  },

  async logout(redirectTo = null) {
    await supabase.auth.signOut()
    if (redirectTo) window.location.href = redirectTo
    else window.location.href = window.location.origin
  },

  async redirectToLogin(returnTo = window.location.origin) {
    const redirectTo = import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_SUPABASE_GOOGLE_REDIRECT_URL || returnTo || window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw error
  },

  async registerClientProfile(payload = {}, attachments = []) {
    return safeRequest(async () => {
      const actor = await currentActor()
      if (!actor?.email) throw new Error('يجب تسجيل الدخول أولاً.')
      if (actor.role !== PENDING_CLIENT_ROLE && actor.role !== 'client') throw new Error('هذا الإجراء مخصص لبوابة الموكّل فقط.')

      const normalizedEmail = normalizeEmail(actor.email)
      const cleanPayload = {
        full_name: payload.full_name,
        client_type: payload.client_type || 'فرد',
        id_number: payload.id_number || null,
        phone: payload.phone,
        email: normalizedEmail,
        address: payload.address || null,
        nationality: payload.nationality || null,
        notes: payload.notes || null,
        status: payload.status || 'قيد المراجعة',
        created_by: normalizedEmail,
        updated_date: new Date().toISOString(),
      }

      if (!cleanPayload.full_name || !cleanPayload.phone) {
        throw new Error('الاسم الكامل ورقم الهاتف مطلوبان.')
      }

      const { data: existingRows, error: existingError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', normalizedEmail)
        .limit(1)
      if (existingError) throw existingError

      let clientRecord = existingRows?.[0] || null
      if (clientRecord?.id) {
        const { data, error } = await supabase
          .from('clients')
          .update(cleanPayload)
          .eq('id', clientRecord.id)
          .select()
          .single()
        if (error) throw error
        clientRecord = data
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert(cleanPayload)
          .select()
          .single()
        if (error) throw error
        clientRecord = data
      }

      const uploadedDocs = []
      for (const file of (attachments || [])) {
        if (!file) continue
        const upload = await integrations.Core.UploadFile({ file, folder: `client-intake/${normalizedEmail}` })
        const docPayload = {
          title: `مرفق تسجيل موكّل - ${file.name}`,
          client_id: clientRecord.id || null,
          client_name: clientRecord.full_name,
          doc_type: 'مستند رسمي',
          file_url: upload.storage_ref || upload.file_url,
          file_name: file.name,
          file_type: file.type || null,
          status: 'مقدم',
          folder: 'مستندات التسجيل',
          notes: 'مرفق مرفوع من بوابة تسجيل الموكّل',
          created_by: normalizedEmail,
        }
        const { data, error } = await retryWriteWithoutStableClientFields({
          table: 'documents',
          payload: docPayload,
          write: (nextPayload) => supabase.from('documents').insert(nextPayload).select().single(),
        })
        if (error) throw error
        uploadedDocs.push(data)
      }

      clearEntityCache()
      return { client: clientRecord, documents: uploadedDocs }
    })
  },
}

const integrations = {
  Core: {
    async UploadFile({ file, bucket = appParams.storageBucket || 'uploads', folder = 'uploads' }) {
      return safeRequest(async () => {
        validateUploadFile(file)
        const safeName = `${Date.now()}-${String(file.name || 'upload').replace(/[^\w.()-]+/g, '-')}`
        const cleanFolder = String(folder || 'uploads').replace(/^\/+|\/+$/g, '') || 'uploads'
        const primaryPath = `${cleanFolder}/${safeName}`
        const fallbackPath = `uploads/${safeName}`
        const uploadOptions = {
          upsert: true,
          cacheControl: '3600',
          contentType: file.type || undefined,
        }

        let finalPath = primaryPath
        let { error } = await supabase.storage.from(bucket).upload(primaryPath, file, uploadOptions)

        if (error && primaryPath !== fallbackPath) {
          console.warn('Primary upload path failed, retrying with uploads/:', error)
          const retry = await supabase.storage.from(bucket).upload(fallbackPath, file, uploadOptions)
          error = retry.error
          finalPath = fallbackPath
        }

        if (error) {
          if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
            throw new Error(
              `لم يتم العثور على حاوية التخزين "${bucket}".\n` +
              'شغّل ملف supabase/migrations/010_portal_security_client_id_rls.sql أو أنشئ الحاوية يدويًا من Supabase Storage.'
            )
          }
          throw new Error(error.message || 'تعذر رفع الملف إلى التخزين.')
        }

        const storage_ref = buildStorageRef(bucket, finalPath)
        let file_url = await getSignedFileUrl(bucket, finalPath)
        if (!file_url) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(finalPath)
          file_url = data?.publicUrl || null
        }
        return { file_url, preview_url: file_url, storage_ref, path: finalPath, bucket }
      })
    },

    async ResolveFileUrl({ file_url }) {
      return safeRequest(async () => {
        if (!file_url) return { file_url: null, storage_ref: null }
        const resolved = await resolveStorageValue(file_url)
        return {
          file_url: resolved?.signedUrl || file_url,
          storage_ref: resolved?.raw || file_url,
          bucket: resolved?.bucket || null,
          path: resolved?.path || null,
        }
      })
    },

    async ExtractDataFromUploadedFile({ file_url, json_schema }) {
      return safeRequest(async () => {
        const fnName = appParams.ocrEdgeFunction || 'extract-ocr'
        const resolved = await resolveStorageValue(file_url)
        const targetFileUrl = resolved?.signedUrl || file_url
        const { data, error } = await supabase.functions.invoke(fnName, {
          body: { file_url: targetFileUrl, json_schema },
        })
        if (error) return { status: 'failed', error: error.message }
        return data || { status: 'failed', error: 'No OCR response returned.' }
      })
    },
  },
}

const realtimeChannels = new Map()

function subscribeRealtime(onChange, tables = Object.values(entityTableMap)) {
  const channelName = `helm-realtime-${Math.random().toString(36).slice(2)}`
  let channel = supabase.channel(channelName)
  for (const table of tables) {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      clearEntityCache(table)
      onChange?.({ table, payload })
    })
  }
  channel.subscribe()
  realtimeChannels.set(channelName, channel)
  return () => {
    const current = realtimeChannels.get(channelName)
    if (current) {
      supabase.removeChannel(current)
      realtimeChannels.delete(channelName)
    }
  }
}

export const base44 = {
  auth,
  integrations,
  entities: Object.fromEntries(Object.keys(entityTableMap).map((name) => [name, createEntity(name)])),
  realtime: { subscribe: subscribeRealtime },
  __clearCache: () => clearEntityCache(),
}
