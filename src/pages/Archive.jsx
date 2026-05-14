import React, { useState, useEffect, useCallback } from 'react'
import { base44 } from '@/api/base44Client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/helm/PageHeader'
import {
  Trash2, RotateCcw, Archive, Search, AlertTriangle,
  Briefcase, Users, CalendarDays, FileText, Receipt,
  CheckSquare, X, Loader2, Database,
} from 'lucide-react'
import { format, isValid } from 'date-fns'
import {
  getArchive, removeFromArchive, clearArchive, markArchiveRestored,
  migrateLocalStorageToSupabase, ENTITY_LABELS,
} from '@/lib/archive'
import { normalizeArabicText } from '@/lib/search'

const ENTITY_ICONS = {
  Client  : Users,
  Case    : Briefcase,
  Session : CalendarDays,
  Document: FileText,
  Invoice : Receipt,
  Task    : CheckSquare,
}

const ENTITY_RESTORE_FIELDS = {
  Client  : ['full_name','phone','email','client_type','nationality','address','notes','status','id_number'],
  Case    : ['title','client_name','case_number','case_type','status','court','judge','assigned_lawyer','priority','description','fees','paid_amount','opponent_name','opponent_lawyer','filing_date'],
  Session : ['case_title','case_id','case_number','client_name','session_date','court','hall','session_type','status','result','notes','next_session_date'],
  Document: ['title','client_name','case_id','case_title','doc_type','folder','status','notes','file_url','file_name'],
  Invoice : ['invoice_number','client_name','case_id','case_title','total_fees','paid_amount','discount','vat_rate','status','issue_date','due_date','notes','items'],
  Task    : ['title','client_name','case_id','case_title','status','priority','due_date','notes'],
}

function safeFmt(v, pat = 'dd/MM/yyyy HH:mm') {
  if (!v) return ''
  try { const d = new Date(v); return isValid(d) ? format(d, pat) : '' } catch { return '' }
}

function getRecord(entry) {
  return entry.record_data || entry.record || {}
}

function getEntityName(entry) {
  return entry.entity_name || entry.entityName
}

function getEntityLabel(entry) {
  const entityName = getEntityName(entry)
  return entry.entity_label || entry.entityLabel || ENTITY_LABELS[entityName] || entityName
}

function getDisplayName(entry) {
  const r = getRecord(entry)
  return r.full_name || r.title || r.invoice_number || r.case_title || '—'
}

function getSub(entry) {
  const r = getRecord(entry)
  const parts = [
    r.client_name, r.court, r.case_type, r.client_type,
    r.doc_type, r.status,
  ].filter(Boolean)
  return parts.slice(0, 2).join(' · ')
}

export default function ArchivePage() {
  const [items,     setItems]     = useState([])
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('الكل')
  const [loading,   setLoading]   = useState(true)
  const [restoring, setRestoring] = useState(null)
  const [deleting,  setDeleting]  = useState(null)
  const [migrated,  setMigrated]  = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getArchive()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Archive] reload failed:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const result = await migrateLocalStorageToSupabase()
        if (mounted && result?.migrated > 0) setMigrated(true)
      } catch {}
      if (mounted) await reload()
    })()
    return () => { mounted = false }
  }, [reload])

  const filtered = items.filter(entry => {
    const matchType = filter === 'الكل' || getEntityLabel(entry) === filter
    const matchSearch = !search || normalizeArabicText(
      `${getDisplayName(entry)} ${getSub(entry)}`
    ).includes(normalizeArabicText(search))
    return matchType && matchSearch
  })

  const entityTypes = [...new Set(items.map(e => getEntityLabel(e)))].filter(Boolean)

  const handleRestore = async (entry) => {
    setRestoring(entry.id)
    try {
      const entityName = getEntityName(entry)
      const fields     = ENTITY_RESTORE_FIELDS[entityName] || []
      const record     = getRecord(entry)

      const payload = {}
      for (const f of fields) {
        if (record[f] !== undefined && record[f] !== null) payload[f] = record[f]
      }

      await base44.entities[entityName].create(payload)
      await markArchiveRestored(entry.id)
      await reload()
    } catch (err) {
      alert(`تعذر الاستعادة: ${err.message}`)
    } finally {
      setRestoring(null)
    }
  }

  const handleDeletePermanent = async (entry) => {
    if (!window.confirm(`حذف نهائي لـ "${getDisplayName(entry)}"؟ لا يمكن التراجع.`)) return
    setDeleting(entry.id)
    try {
      await removeFromArchive(entry.id)
      await reload()
    } finally {
      setDeleting(null)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm(`حذف ${items.length} عنصر نهائياً من الأرشيف؟ لا يمكن التراجع.`)) return
    setDeleting('all')
    try {
      await clearArchive()
      await reload()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5" dir="rtl">
      <PageHeader
        title="سلة الأرشيف"
        subtitle={`${items.length} عنصر محذوف قابل للاستعادة`}
        action={
          items.length > 0 ? (
            <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={deleting === 'all'} className="gap-1.5">
              {deleting === 'all' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              حذف الكل نهائياً
            </Button>
          ) : undefined
        }
      />

      <Card className="p-4 bg-emerald-500/8 border-emerald-500/20 flex items-start gap-3">
        <Database className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground text-sm">الأرشيف مرتبط بـ Supabase مع نسخة احتياطية محلية</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            عند توفر جدول الأرشيف يتم الحفظ والاسترجاع عبر قاعدة البيانات، ومع عدم توفره يستخدم النظام التخزين المحلي مؤقتاً.
          </p>
          {migrated && <p className="text-xs text-emerald-600 mt-1">تم ترحيل الأرشيف المحلي إلى Supabase بنجاح.</p>}
        </div>
      </Card>

      <Card className="p-4 bg-amber-500/8 border-amber-500/20 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground text-sm">تنبيه الحذف النهائي</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            الاستعادة تنشئ نسخة جديدة من السجل ثم تضع علامة مسترجع على عنصر الأرشيف. الحذف النهائي لا رجعة فيه.
          </p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في المحذوفات…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['الكل', ...entityTypes].map(t => (
            <Button
              key={t}
              variant={filter === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(t)}
              className="h-11 rounded-xl"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="p-14 text-center space-y-3">
          <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
          <p className="font-bold text-foreground text-lg">جارٍ تحميل الأرشيف…</p>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-14 text-center space-y-3">
          <Archive className="h-10 w-10 text-muted-foreground mx-auto opacity-30" />
          <p className="font-bold text-foreground text-lg">الأرشيف فارغ</p>
          <p className="text-sm text-muted-foreground">عند حذف أي سجل سيظهر هنا ويمكن استعادته</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">لا توجد نتائج لبحثك</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(entry => {
            const entityName = getEntityName(entry)
            const Icon = ENTITY_ICONS[entityName] || FileText
            const name  = getDisplayName(entry)
            const sub   = getSub(entry)
            const isRest = restoring === entry.id
            const isDel  = deleting  === entry.id
            const archivedAt = entry.archived_at || entry.archivedAt

            return (
              <Card key={entry.id} className="p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="h-11 w-11 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm truncate">{name}</p>
                    <Badge variant="outline" className="text-[10px] py-0 h-5">
                      {getEntityLabel(entry)}
                    </Badge>
                  </div>
                  {sub && <p className="text-xs text-muted-foreground truncate mt-0.5">{sub}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    حُذف {safeFmt(archivedAt, 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-green-600 border-green-500/30 hover:bg-green-500/10"
                    onClick={() => handleRestore(entry)}
                    disabled={isRest}
                  >
                    {isRest
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <RotateCcw className="h-3.5 w-3.5" />
                    }
                    استعادة
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeletePermanent(entry)}
                    disabled={isDel}
                    title="حذف نهائي"
                  >
                    {isDel ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
