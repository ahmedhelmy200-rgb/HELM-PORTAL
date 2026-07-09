import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { base44 } from '@/api/base44Client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Handshake, Phone, Mail, Trash2, Pencil, Percent, Wallet, Briefcase, Users } from 'lucide-react'
import PageHeader from '@/components/helm/PageHeader'
import EmptyState from '@/components/helm/EmptyState'
import StatCard from '@/components/helm/StatCard'
import ChoiceInput from '@/components/shared/ChoiceInput'
import { PageErrorState } from '@/components/app/AppStatusBar'
import { searchInFields } from '@/lib/search'
import { brokerSummaryForCase, calcBrokerCommission } from '@/lib/brokerUtils'

const emptyForm = { full_name: '', phone: '', email: '', default_commission_percent: '', status: 'نشط', notes: '' }
const STATUSES = ['نشط', 'موقوف', 'غير نشط']

function isMissingTable(error) {
  const msg = String(error?.message || error || '').toLowerCase()
  return msg.includes('brokers') && (msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('relation'))
}
function numberOrZero(value) { const n = Number(value); return Number.isFinite(n) ? n : 0 }

export default function Brokers() {
  const [brokers, setBrokers] = useState([])
  const [clients, setClients] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const [{ data, error }, clientRows, caseRows] = await Promise.all([
        supabase.from('brokers').select('*').order('full_name', { ascending: true }),
        base44.entities.Client.list('-created_date', 1000).catch(() => []),
        base44.entities.Case.list('-created_date', 1000).catch(() => []),
      ])
      if (error) throw error
      setBrokers(data || [])
      setClients(clientRows || [])
      setCases(caseRows || [])
    } catch (error) {
      setLoadError(isMissingTable(error) ? 'جدول البروكر غير موجود بعد. شغّل Migration رقم 022 من Supabase ثم أعد فتح الصفحة.' : (error.message || 'تعذر تحميل البروكر.'))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const statsByName = useMemo(() => {
    const map = new Map()
    brokers.forEach((broker) => map.set(broker.full_name, { clients: 0, cases: 0, totalFees: 0, commission: 0 }))
    clients.forEach((client) => {
      if (!client.broker_name) return
      const current = map.get(client.broker_name) || { clients: 0, cases: 0, totalFees: 0, commission: 0 }
      current.clients += 1
      map.set(client.broker_name, current)
    })
    cases.forEach((item) => {
      if (!item.broker_name) return
      const current = map.get(item.broker_name) || { clients: 0, cases: 0, totalFees: 0, commission: 0 }
      const summary = brokerSummaryForCase(item)
      current.cases += 1
      current.totalFees += numberOrZero(item.fees)
      current.commission += summary.amount || calcBrokerCommission(item.fees, item.broker_commission_percent)
      map.set(item.broker_name, current)
    })
    return map
  }, [brokers, clients, cases])

  const filtered = useMemo(() => brokers.filter((item) => searchInFields(item, ['full_name', 'phone', 'email', 'status', 'notes'], search)), [brokers, search])
  const totals = useMemo(() => {
    const rows = [...statsByName.values()]
    return {
      brokers: brokers.length,
      clients: rows.reduce((sum, row) => sum + row.clients, 0),
      cases: rows.reduce((sum, row) => sum + row.cases, 0),
      commission: rows.reduce((sum, row) => sum + row.commission, 0),
    }
  }, [brokers.length, statsByName])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true) }
  const openEdit = (item) => { setEditing(item); setForm({ ...emptyForm, ...item, default_commission_percent: item.default_commission_percent ?? '' }); setShowDialog(true) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        full_name: form.full_name.trim(),
        default_commission_percent: form.default_commission_percent === '' ? 0 : Number(form.default_commission_percent),
      }
      const result = editing
        ? await supabase.from('brokers').update(payload).eq('id', editing.id)
        : await supabase.from('brokers').insert(payload)
      if (result.error) throw result.error
      setShowDialog(false)
      await loadData()
    } catch (error) {
      alert(error.message || 'تعذر حفظ البروكر')
    } finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!confirm(`حذف البروكر: ${item.full_name}؟ لن يتم حذف القضايا أو الموكلين المرتبطين، لكن الأفضل تعديلهم بعد الحذف.`)) return
    const { error } = await supabase.from('brokers').delete().eq('id', item.id)
    if (error) alert(error.message)
    else await loadData()
  }

  return (
    <div className="space-y-5">
      <PageHeader title="البروكر" subtitle="مصدر الموكل أو القضية ونسبة الأتعاب" action={<Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة بروكر</Button>} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي البروكر" value={totals.brokers} icon={Handshake} color="primary" />
        <StatCard title="موكلون مرتبطون" value={totals.clients} icon={Users} color="success" />
        <StatCard title="قضايا مرتبطة" value={totals.cases} icon={Briefcase} color="warning" />
        <StatCard title="مستحق تقديري" value={`${totals.commission.toFixed(2)} د.إ`} icon={Wallet} color="accent" />
      </div>

      <Card className="p-4 border-primary/10">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث باسم البروكر أو الهاتف أو البريد..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-11" />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Handshake} title="لا يوجد بروكر" description="أضف الأشخاص أو الجهات التي تجلب الموكلين والقضايا." action={<Button onClick={openCreate}>إضافة بروكر</Button>} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {filtered.map((broker) => {
            const stats = statsByName.get(broker.full_name) || { clients: 0, cases: 0, totalFees: 0, commission: 0 }
            return (
              <Card key={broker.id} className="p-4 border-primary/10 hover:border-primary/25 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{broker.full_name}</h3>
                      <Badge className="text-[10px] bg-primary/10 text-primary border-0">{broker.status || 'نشط'}</Badge>
                      <Badge variant="secondary" className="text-[10px] flex items-center gap-1"><Percent className="h-3 w-3" />{numberOrZero(broker.default_commission_percent)}%</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                      {broker.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{broker.phone}</span>}
                      {broker.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{broker.email}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="rounded-xl bg-muted/40 p-2 text-center"><p className="font-black">{stats.clients}</p><p className="text-[10px] text-muted-foreground">موكل</p></div>
                      <div className="rounded-xl bg-muted/40 p-2 text-center"><p className="font-black">{stats.cases}</p><p className="text-[10px] text-muted-foreground">قضية</p></div>
                      <div className="rounded-xl bg-muted/40 p-2 text-center"><p className="font-black text-xs">{stats.commission.toFixed(2)}</p><p className="text-[10px] text-muted-foreground">مستحق</p></div>
                    </div>
                    {broker.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{broker.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(broker)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(broker)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? 'تعديل بروكر' : 'إضافة بروكر'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 md:col-span-2"><Label>اسم البروكر *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>الهاتف</Label><Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>البريد الإلكتروني</Label><Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>النسبة الافتراضية من أتعاب القضية %</Label><Input type="number" min="0" max="100" step="0.01" value={form.default_commission_percent} onChange={(e) => setForm({ ...form, default_commission_percent: e.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES} listId="broker-status" /></div>
            <div className="space-y-1 md:col-span-2"><Label>ملاحظات</Label><Textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[100px]" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.full_name.trim()} className="bg-primary text-white">{saving ? 'جارٍ الحفظ...' : 'حفظ'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
