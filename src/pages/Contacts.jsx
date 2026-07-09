import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, ContactRound, Phone, Mail, MessageCircle, Trash2, Pencil, Upload } from 'lucide-react'
import PageHeader from '@/components/helm/PageHeader'
import EmptyState from '@/components/helm/EmptyState'
import ChoiceInput from '@/components/shared/ChoiceInput'
import PaginationControls from '@/components/shared/PaginationControls'
import { PageErrorState } from '@/components/app/AppStatusBar'
import { searchInFields } from '@/lib/search'

const emptyForm = {
  full_name: '', phone: '', email: '', company: '', category: 'عام', source: '', status: 'نشط', notes: '',
}
const CATEGORIES = ['عام', 'عميل محتمل', 'موكل سابق', 'محامٍ', 'خبير', 'مترجم', 'جهة رسمية', 'بروكر', 'مورد', 'آخر']
const STATUSES = ['نشط', 'غير نشط', 'محظور']

function isMissingTable(error) {
  const msg = String(error?.message || error || '').toLowerCase()
  return msg.includes('contacts') && (msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('relation'))
}

function normalizePhone(value = '') { return String(value || '').replace(/\D+/g, '') }
function makeKey(row = {}) { return normalizePhone(row.phone) || String(row.email || '').trim().toLowerCase() || String(row.full_name || '').trim().toLowerCase() }

function parseCsv(text = '') {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const next = text[i + 1]
    if (ch === '"' && quoted && next === '"') { cell += '"'; i += 1; continue }
    if (ch === '"') { quoted = !quoted; continue }
    if (ch === ',' && !quoted) { row.push(cell); cell = ''; continue }
    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1
      row.push(cell); cell = ''
      if (row.some((v) => String(v || '').trim())) rows.push(row)
      row = []
      continue
    }
    cell += ch
  }
  if (cell || row.length) { row.push(cell); if (row.some((v) => String(v || '').trim())) rows.push(row) }
  return rows
}

function csvRowsToContacts(text = '') {
  const rows = parseCsv(text)
  const headers = (rows.shift() || []).map((h) => String(h || '').trim())
  const index = (names) => names.map((n) => headers.indexOf(n)).find((i) => i >= 0)
  const firstIdx = index(['First Name', 'الاسم الأول', 'first_name'])
  const middleIdx = index(['Middle Name', 'middle_name'])
  const lastIdx = index(['Last Name', 'اسم العائلة', 'last_name'])
  const fullIdx = index(['Name', 'Full Name', 'full_name', 'الاسم'])
  const phoneIdx = headers.findIndex((h) => /Phone|هاتف|phone/i.test(h))
  const emailIdx = headers.findIndex((h) => /E-mail|Email|بريد|email/i.test(h))
  const orgIdx = index(['Organization Name', 'Company', 'company', 'الشركة'])
  const notesIdx = index(['Notes', 'notes', 'ملاحظات'])
  return rows.map((row) => {
    const parts = [row[firstIdx], row[middleIdx], row[lastIdx]].filter(Boolean).map((v) => String(v).trim()).filter(Boolean)
    const full = String(row[fullIdx] || parts.join(' ') || '').trim()
    return {
      full_name: full,
      phone: String(row[phoneIdx] || '').trim(),
      email: String(row[emailIdx] || '').trim(),
      company: String(row[orgIdx] || '').trim(),
      notes: String(row[notesIdx] || '').trim(),
      category: 'عام',
      source: 'CSV',
      status: 'نشط',
    }
  }).filter((row) => row.full_name && makeKey(row))
}

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('الكل')
  const [page, setPage] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState('')
  const fileRef = useRef(null)
  const pageSize = 20

  const loadData = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const { data, error } = await supabase.from('contacts').select('*').order('created_date', { ascending: false })
      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      setLoadError(isMissingTable(error) ? 'جدول جهات الاتصال غير موجود بعد. شغّل Migration رقم 022 من Supabase ثم أعد فتح الصفحة.' : (error.message || 'تعذر تحميل جهات الاتصال.'))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => contacts.filter((item) => {
    const matches = searchInFields(item, ['full_name', 'phone', 'email', 'company', 'category', 'source', 'notes'], search)
    return matches && (category === 'الكل' || item.category === category)
  }), [contacts, search, category])

  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page])
  const categories = useMemo(() => ['الكل', ...new Set([...CATEGORIES, ...contacts.map((c) => c.category)].filter(Boolean))], [contacts])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true) }
  const openEdit = (item) => { setEditing(item); setForm({ ...emptyForm, ...item }); setShowDialog(true) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, full_name: form.full_name.trim() }
      const result = editing
        ? await supabase.from('contacts').update(payload).eq('id', editing.id)
        : await supabase.from('contacts').insert(payload)
      if (result.error) throw result.error
      setShowDialog(false)
      await loadData()
    } catch (error) {
      alert(error.message || 'تعذر الحفظ')
    } finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!confirm(`حذف جهة الاتصال: ${item.full_name}؟`)) return
    const { error } = await supabase.from('contacts').delete().eq('id', item.id)
    if (error) alert(error.message)
    else await loadData()
  }

  const importCsv = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImporting(true); setImportSummary('جاري قراءة الملف...')
    try {
      const text = await file.text()
      const rows = csvRowsToContacts(text)
      const existingKeys = new Set(contacts.map(makeKey).filter(Boolean))
      const seen = new Set()
      const incoming = rows.filter((row) => {
        const key = makeKey(row)
        if (!key || existingKeys.has(key) || seen.has(key)) return false
        seen.add(key)
        return true
      })
      if (!incoming.length) { setImportSummary('لم يتم العثور على جهات جديدة صالحة للاستيراد.'); return }
      const { error } = await supabase.from('contacts').insert(incoming)
      if (error) throw error
      setImportSummary(`تم استيراد ${incoming.length} جهة اتصال، وتم تخطي ${rows.length - incoming.length} مكرر/ناقص.`)
      await loadData()
    } catch (error) {
      setImportSummary(error.message || 'تعذر استيراد الملف.')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const sendWhatsApp = (item) => {
    const phone = normalizePhone(item.phone)
    if (phone) window.open(`https://wa.me/${phone}`, '_blank')
  }

  return (
    <div className="space-y-5">
      <PageHeader title="جهات الاتصال" subtitle={`${contacts.length} جهة`} action={
        <div className="flex flex-wrap gap-2 justify-end">
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} />
          <Button variant="outline" disabled={importing} onClick={() => fileRef.current?.click()} className="gap-2"><Upload className="h-4 w-4" />استيراد CSV</Button>
          <Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة جهة</Button>
        </div>
      } />

      {importSummary && <Card className="p-3 border-primary/10 bg-primary/5 text-sm font-bold text-primary">{importSummary}</Card>}

      <Card className="p-4 border-primary/10">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الهاتف أو البريد أو الشركة..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pr-10 h-11" />
          </div>
          <ChoiceInput value={category} onChange={(v) => { setCategory(v); setPage(1) }} options={categories} listId="contact-categories-filter" helper="" className="xl:w-56 h-11" />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ContactRound} title="لا توجد جهات اتصال" description="أضف جهة اتصال أو استورد ملف CSV." action={<Button onClick={openCreate}>إضافة جهة</Button>} />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {paged.map((item) => (
              <Card key={item.id} className="p-4 border-primary/10 hover:border-primary/25 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{item.full_name}</h3>
                      {item.category && <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>}
                      {item.status && <Badge className="text-[10px] bg-primary/10 text-primary border-0">{item.status}</Badge>}
                    </div>
                    {item.company && <p className="text-xs text-muted-foreground mt-1">{item.company}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                      {item.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone}</span>}
                      {item.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{item.email}</span>}
                    </div>
                    {item.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {item.phone && <Button variant="ghost" size="icon" onClick={() => sendWhatsApp(item)}><MessageCircle className="h-4 w-4" /></Button>}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <PaginationControls page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? 'تعديل جهة اتصال' : 'إضافة جهة اتصال'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 md:col-span-2"><Label>الاسم *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>الشركة / الجهة</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>التصنيف</Label><ChoiceInput value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} listId="contact-categories" /></div>
            <div className="space-y-1"><Label>المصدر</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="h-11" placeholder="مثلاً: واتساب، إحالة، CSV" /></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES} listId="contact-status" /></div>
            <div className="space-y-1 md:col-span-2"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[100px]" /></div>
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
