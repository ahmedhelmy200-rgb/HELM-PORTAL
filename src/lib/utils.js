import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from 'date-fns'

// ── Tailwind class merge ──────────────────────────────────────────────────────
export function cn(...inputs) { return twMerge(clsx(inputs)) }
export const isIframe = typeof window !== 'undefined' ? window.self !== window.top : false

// ── تنسيق التاريخ الآمن ──────────────────────────────────────────────────────
export function safeFmt(value, pattern, fallback = '—') {
  if (!value) return fallback
  try {
    const d = new Date(value)
    return isValid(d) ? format(d, pattern) : fallback
  } catch {
    return fallback
  }
}

// ── تنسيق المبالغ المالية ────────────────────────────────────────────────────
export function fmtMoney(n, opts = {}) {
  const { locale = 'ar', compact = true, currency = null } = opts
  if (!n && n !== 0) return compact ? '٠' : '0'
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  if (compact) {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}م`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}ك`
  }
  const formatted = num.toLocaleString(locale)
  return currency ? `${formatted} ${currency}` : formatted
}

// ── اختصار النص ──────────────────────────────────────────────────────────────
export function truncate(str, maxLength = 60) {
  if (!str) return ''
  return String(str).length > maxLength ? String(str).slice(0, maxLength) + '…' : String(str)
}

// ── الوقت بالعربية ───────────────────────────────────────────────────────────
export function timeAgoAr(dateValue) {
  if (!dateValue) return '—'
  try {
    const d = new Date(dateValue)
    if (!isValid(d)) return '—'
    const sec = Math.floor((Date.now() - d.getTime()) / 1000)
    if (sec < 60)      return 'الآن'
    if (sec < 3600)    return `منذ ${Math.floor(sec / 60)} دقيقة`
    if (sec < 86400)   return `منذ ${Math.floor(sec / 3600)} ساعة`
    if (sec < 2592000) return `منذ ${Math.floor(sec / 86400)} يوم`
    return safeFmt(dateValue, 'dd/MM/yyyy')
  } catch {
    return '—'
  }
}

// ── تنقية الهاتف ─────────────────────────────────────────────────────────────
export function cleanPhone(raw) {
  return String(raw || '').replace(/\D+/g, '')
}

// ── الأحرف الأولى من الاسم ───────────────────────────────────────────────────
export function initials(name = '') {
  return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '؟'
}
