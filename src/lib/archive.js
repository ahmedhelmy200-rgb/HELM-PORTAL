// ── نظام الأرشيف — حذف ناعم مع إمكانية الاسترجاع ──────────────────────────
// v2: يدعم Supabase + localStorage كـ fallback
import { supabase } from '@/integrations/supabase/client'

const ARCHIVE_KEY = 'helm_archive_v1'
const ARCHIVE_TABLE = 'archived_records'

let _supabaseArchiveEnabled = null

async function isSupabaseEnabled() {
  if (_supabaseArchiveEnabled !== null) return _supabaseArchiveEnabled
  try {
    const { error } = await supabase.from(ARCHIVE_TABLE).select('id').limit(1)
    _supabaseArchiveEnabled = !error
  } catch {
    _supabaseArchiveEnabled = false
  }
  return _supabaseArchiveEnabled
}

function readLocalArchive() {
  try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]') } catch { return [] }
}

function writeLocalArchive(items) {
  try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items)) } catch {}
}

function normalizeEntry(entry = {}) {
  const entityName = entry.entity_name || entry.entityName
  const recordId = entry.record_id || String(entry.record?.id || entry.record_data?.id || '')
  const record = entry.record_data || entry.record || {}
  const entityLabel = entry.entity_label || entry.entityLabel || ENTITY_LABELS[entityName] || entityName
  const archivedAt = entry.archived_at || entry.archivedAt || new Date().toISOString()

  return {
    ...entry,
    id: entry.id || `${entityName}_${recordId}_${Date.now()}`,
    entity_name: entityName,
    entityName,
    entity_label: entityLabel,
    entityLabel,
    record_id: recordId,
    record_data: record,
    record,
    archived_at: archivedAt,
    archivedAt,
    is_permanent: Boolean(entry.is_permanent),
  }
}

// أرشفة سجل
export async function archiveRecord(entityName, record, note = '') {
  const recordId = String(record?.id || '')
  const entry = {
    entity_name : entityName,
    entity_label: ENTITY_LABELS[entityName] || entityName,
    record_id   : recordId,
    record_data : { ...record },
    archived_at : new Date().toISOString(),
    note,
  }

  if (await isSupabaseEnabled()) {
    const { data: auth } = await supabase.auth.getUser()
    const email = auth?.user?.email || 'unknown'
    const { data, error } = await supabase
      .from(ARCHIVE_TABLE)
      .upsert({ ...entry, archived_by: email }, { onConflict: 'entity_name,record_id' })
      .select()
      .single()

    if (!error && data) return normalizeEntry(data)
  }

  const items = readLocalArchive().map(normalizeEntry)
  const localEntry = normalizeEntry({
    id: `${entityName}_${recordId}_${Date.now()}`,
    ...entry,
    archived_by: 'local',
  })
  const filtered = items.filter(i => !(i.entity_name === entityName && i.record_id === recordId))
  writeLocalArchive([localEntry, ...filtered].slice(0, 500))
  return localEntry
}

// جميع المحذوفات
export async function getArchive() {
  if (await isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from(ARCHIVE_TABLE)
      .select('*')
      .is('restored_at', null)
      .eq('is_permanent', false)
      .order('archived_at', { ascending: false })
      .limit(500)
    if (!error) return (data || []).map(normalizeEntry)
  }
  return readLocalArchive().map(normalizeEntry)
}

// محذوفات نوع معين
export async function getArchiveByEntity(entityName) {
  if (await isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from(ARCHIVE_TABLE)
      .select('*')
      .eq('entity_name', entityName)
      .is('restored_at', null)
      .eq('is_permanent', false)
      .order('archived_at', { ascending: false })
    if (!error) return (data || []).map(normalizeEntry)
  }
  return readLocalArchive().map(normalizeEntry).filter(i => i.entity_name === entityName)
}

// حذف نهائي من الأرشيف
export async function removeFromArchive(archiveId) {
  if (await isSupabaseEnabled()) {
    const { data: auth } = await supabase.auth.getUser()
    await supabase
      .from(ARCHIVE_TABLE)
      .update({
        is_permanent: true,
        deleted_at: new Date().toISOString(),
        deleted_by: auth?.user?.email || 'unknown',
      })
      .eq('id', archiveId)
    return
  }
  writeLocalArchive(readLocalArchive().filter(i => i.id !== archiveId))
}

// وضع علامة استرجاع على سجل مؤرشف
export async function markArchiveRestored(archiveId) {
  if (await isSupabaseEnabled()) {
    const { data: auth } = await supabase.auth.getUser()
    await supabase
      .from(ARCHIVE_TABLE)
      .update({ restored_at: new Date().toISOString(), restored_by: auth?.user?.email || 'unknown' })
      .eq('id', archiveId)
    return
  }
  writeLocalArchive(readLocalArchive().filter(i => i.id !== archiveId))
}

// مسح الأرشيف بالكامل
export async function clearArchive() {
  if (await isSupabaseEnabled()) {
    const { data: auth } = await supabase.auth.getUser()
    await supabase
      .from(ARCHIVE_TABLE)
      .update({
        is_permanent: true,
        deleted_at: new Date().toISOString(),
        deleted_by: auth?.user?.email || 'unknown',
      })
      .eq('is_permanent', false)
      .is('restored_at', null)
  }
  writeLocalArchive([])
}

// عداد سريع للقائمة الجانبية — يعتمد محليًا كي لا يعلّق الواجهة
export function getArchiveCount() {
  return readLocalArchive().length
}

// ترحيل localStorage → Supabase
export async function migrateLocalStorageToSupabase() {
  if (!(await isSupabaseEnabled())) return { migrated: 0, skipped: true }
  const local = readLocalArchive().map(normalizeEntry)
  if (!local.length) return { migrated: 0 }

  try {
    const { data: auth } = await supabase.auth.getUser()
    const email = auth?.user?.email || 'migrated'
    const rows = local
      .filter(i => i.entity_name && i.record_id)
      .map(i => ({
        entity_name : i.entity_name,
        entity_label: i.entity_label,
        record_id   : i.record_id,
        record_data : i.record_data || {},
        archived_by : email,
        archived_at : i.archived_at || new Date().toISOString(),
      }))

    if (!rows.length) return { migrated: 0 }

    const { error } = await supabase
      .from(ARCHIVE_TABLE)
      .upsert(rows, { onConflict: 'entity_name,record_id', ignoreDuplicates: true })

    if (!error) {
      writeLocalArchive([])
      return { migrated: rows.length }
    }
    return { migrated: 0, error }
  } catch (error) {
    console.warn('[Archive] Migration failed, keeping localStorage:', error)
    return { migrated: 0, error }
  }
}

export const ENTITY_LABELS = {
  Client      : 'موكّل',
  Case        : 'قضية',
  Session     : 'جلسة',
  Document    : 'مستند',
  Invoice     : 'فاتورة',
  Task        : 'مهمة',
  Expense     : 'مصروف',
  Notification: 'إشعار',
}
