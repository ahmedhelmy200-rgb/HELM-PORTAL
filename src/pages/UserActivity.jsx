import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, RefreshCw, Search, UserRound, Database, Clock3 } from 'lucide-react'
import PageHeader from '@/components/helm/PageHeader'
import EmptyState from '@/components/helm/EmptyState'
import { PageErrorState } from '@/components/app/AppStatusBar'

const ACTION_LABELS = {
  INSERT: 'إضافة',
  UPDATE: 'تعديل',
  DELETE: 'حذف',
}

const ACTION_STYLES = {
  INSERT: 'bg-emerald-100 text-emerald-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-AE', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date)
}

function activitySummary(item) {
  const fields = Array.isArray(item.changed_fields) ? item.changed_fields.filter(Boolean) : []
  if (item.action === 'UPDATE' && fields.length) return `تم تعديل: ${fields.join('، ')}`
  if (item.action === 'INSERT') return 'تم إنشاء سجل جديد'
  if (item.action === 'DELETE') return 'تم حذف السجل'
  return 'تم تنفيذ عملية على السجل'
}

export default function UserActivity() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('الكل')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: queryError } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(1000)
      if (queryError) throw queryError
      setRows(data || [])
    } catch (loadError) {
      setError(loadError?.message || 'تعذر تحميل سجل أعمال المستخدمين.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((item) => {
      if (action !== 'الكل' && item.action !== action) return false
      if (!q) return true
      return [
        item.actor_email,
        item.actor_role,
        item.table_name,
        item.record_id,
        activitySummary(item),
      ].some((value) => String(value || '').toLowerCase().includes(q))
    })
  }, [rows, search, action])

  const uniqueUsers = useMemo(() => new Set(rows.map((item) => item.actor_email).filter(Boolean)).size, [rows])
  const todayCount = useMemo(() => {
    const today = new Date().toDateString()
    return rows.filter((item) => new Date(item.occurred_at).toDateString() === today).length
  }, [rows])

  return (
    <div className="space-y-5" dir="rtl">
      <PageHeader
        title="سجل أعمال المستخدمين"
        subtitle="متابعة جميع الإضافات والتعديلات والحذف مع المستخدم والوقت والحقول المتغيرة"
        action={(
          <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 border-primary/10"><p className="text-xs text-muted-foreground">إجمالي العمليات</p><p className="mt-1 text-2xl font-black">{rows.length}</p></Card>
        <Card className="p-4 border-primary/10"><p className="text-xs text-muted-foreground">المستخدمون</p><p className="mt-1 text-2xl font-black">{uniqueUsers}</p></Card>
        <Card className="p-4 border-primary/10"><p className="text-xs text-muted-foreground">عمليات اليوم</p><p className="mt-1 text-2xl font-black">{todayCount}</p></Card>
        <Card className="p-4 border-primary/10"><p className="text-xs text-muted-foreground">آخر تحديث</p><p className="mt-1 text-sm font-black">{formatDate(new Date())}</p></Card>
      </div>

      <Card className="p-4 border-primary/10">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالمستخدم أو الجدول أو رقم السجل..." className="pr-10 h-11" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['الكل', 'الكل'],
              ['INSERT', 'إضافة'],
              ['UPDATE', 'تعديل'],
              ['DELETE', 'حذف'],
            ].map(([value, label]) => (
              <Button key={value} variant={action === value ? 'default' : 'outline'} onClick={() => setAction(value)}>{label}</Button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48"><RefreshCw className="h-7 w-7 animate-spin text-primary" /></div>
      ) : error ? (
        <PageErrorState message={error} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Activity} title="لا توجد عمليات مطابقة" description="سيظهر هنا كل نشاط مسجل بعد تشغيل Migration الصلاحيات وسجل المستخدمين." />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id} className="p-4 border-primary/10">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`border-0 ${ACTION_STYLES[item.action] || 'bg-slate-100 text-slate-800'}`}>{ACTION_LABELS[item.action] || item.action}</Badge>
                    <span className="inline-flex items-center gap-1 text-sm font-bold"><UserRound className="h-4 w-4" />{item.actor_email || 'system'}</span>
                    {item.actor_role && <Badge variant="secondary">{item.actor_role}</Badge>}
                  </div>
                  <p className="mt-2 text-sm font-bold">{activitySummary(item)}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" />{item.table_name}</span>
                    {item.record_id && <span>السجل: {item.record_id}</span>}
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatDate(item.occurred_at)}</span>
                  </div>
                </div>
              </div>
              {(item.old_data || item.new_data) && (
                <details className="mt-3 rounded-xl border border-border bg-muted/20 p-3">
                  <summary className="cursor-pointer text-xs font-bold">عرض التفاصيل الفنية قبل وبعد</summary>
                  <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3 text-left" dir="ltr">
                    <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] text-slate-100">{JSON.stringify(item.old_data, null, 2)}</pre>
                    <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] text-slate-100">{JSON.stringify(item.new_data, null, 2)}</pre>
                  </div>
                </details>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
