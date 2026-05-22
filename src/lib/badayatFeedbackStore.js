import { supabase } from '@/integrations/supabase/client'

export const BADAYAT_FEEDBACK_LOCAL_KEY = 'helm_badayat_feedback_v1'

function readLocal() {
  try { return JSON.parse(localStorage.getItem(BADAYAT_FEEDBACK_LOCAL_KEY) || '[]') || [] } catch { return [] }
}

function writeLocal(rows) {
  localStorage.setItem(BADAYAT_FEEDBACK_LOCAL_KEY, JSON.stringify(rows))
  return rows
}

function isMissingFeedbackSchema(error) {
  const msg = String(error?.message || error || '').toLowerCase()
  return msg.includes('badayat_feedback') || msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('relation')
}

export function getBadayatFeedbackUrl() {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/BadayatFeedback`
}

export function getBadayatFeedbackQrUrl() {
  const target = getBadayatFeedbackUrl()
  return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=10&data=${encodeURIComponent(target)}`
}

export async function submitBadayatFeedback(payload = {}) {
  const row = {
    id: payload.id || `fb-${Date.now()}`,
    type: payload.type || 'اقتراح',
    name: String(payload.name || '').trim() || 'غير محدد',
    phone: String(payload.phone || '').trim() || null,
    email: String(payload.email || '').trim() || null,
    branch: String(payload.branch || '').trim() || 'غير محدد',
    subject: String(payload.subject || '').trim() || 'بدون عنوان',
    message: String(payload.message || '').trim(),
    status: 'جديدة',
    created_at: new Date().toISOString(),
  }

  if (!row.message) throw new Error('اكتب نص الشكوى أو الاقتراح أولاً.')

  try {
    const { data, error } = await supabase.from('badayat_feedback').insert(row).select().single()
    if (error) {
      if (isMissingFeedbackSchema(error)) throw error
      throw error
    }
    return { item: data || row, source: 'supabase' }
  } catch (error) {
    const local = [row, ...readLocal()].slice(0, 300)
    writeLocal(local)
    console.warn('[BadayatFeedback] saved locally:', error?.message || error)
    return { item: row, source: 'local' }
  }
}

export async function loadBadayatFeedback() {
  const local = readLocal()
  try {
    const { data, error } = await supabase.from('badayat_feedback').select('*').order('created_at', { ascending: false }).limit(300)
    if (error) {
      if (isMissingFeedbackSchema(error)) return { items: local, source: 'local' }
      throw error
    }
    return { items: data?.length ? data : local, source: data?.length ? 'supabase' : 'local' }
  } catch (error) {
    console.warn('[BadayatFeedback] using local fallback:', error?.message || error)
    return { items: local, source: 'local' }
  }
}

export async function updateBadayatFeedbackStatus(id, status) {
  const local = readLocal().map((item) => item.id === id ? { ...item, status } : item)
  writeLocal(local)
  try {
    await supabase.from('badayat_feedback').update({ status }).eq('id', id)
  } catch {}
  return local
}
