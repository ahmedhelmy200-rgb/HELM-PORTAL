import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isValid } from 'date-fns'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCopy,
  CreditCard,
  ExternalLink,
  FileText,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react'

import { base44 } from '@/api/base44Client'
import { PageErrorState } from '@/components/app/AppStatusBar'
import PageHeader from '@/components/helm/PageHeader'
import PaginationControls from '@/components/shared/PaginationControls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import {
  buildCollectionsSummary,
  compareCollectionPriority,
  getAgingBucket,
  getCollectionPriority,
  getDaysOverdue,
} from '@/lib/collections'
import { getInvoiceTotals } from '@/lib/invoiceMath'
import { buildSecurePaymentUrl, buildPaymentWhatsAppMessage } from '@/lib/paymentLinks'
import { PORTAL_SCOPE_BADAYAT, PORTAL_SCOPE_HELM, getInvoicePortalScope } from '@/lib/portalScopes'
import { searchInFields } from '@/lib/search'
import { APP_SHORTCUT_SEARCH, subscribeAppEvent } from '@/lib/app-events'
import { invoiceOverdueMessage, invoiceReminderMessage, openWhatsApp } from '@/lib/whatsappTemplates'
import { createPageUrl } from '@/utils'

const PAGE_SIZE = 12
const PRIORITY_META = {
  critical: { label: 'حرجة', className: 'border-rose-500/25 bg-rose-500/10 text-rose-500' },
  urgent: { label: 'عاجلة', className: 'border-red-500/25 bg-red-500/10 text-red-500' },
  high: { label: 'مرتفعة', className: 'border-orange-500/25 bg-orange-500/10 text-orange-500' },
  medium: { label: 'متابعة', className: 'border-amber-500/25 bg-amber-500/10 text-amber-500' },
  normal: { label: 'قادمة', className: 'border-blue-500/25 bg-blue-500/10 text-blue-500' },
}

function money(value) {
  return Number(value || 0).toLocaleString('ar-AE', { maximumFractionDigits: 2 })
}

function dateLabel(value) {
  if (!value) return 'بدون تاريخ'
  try {
    const date = new Date(value)
    return isValid(date) ? format(date, 'dd/MM/yyyy') : 'تاريخ غير صالح'
  } catch {
    return 'تاريخ غير صالح'
  }
}

function buildClientLookup(clients) {
  const lookup = new Map()
  clients.forEach((client) => {
    const keys = [client.id, client.full_name, client.name_ar, client.name_en, ...(Array.isArray(client.name_aliases) ? client.name_aliases : [])]
    keys.filter(Boolean).forEach((key) => lookup.set(String(key), client))
  })
  return lookup
}

export default function Collections() {
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [officeSettings, setOfficeSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [portalFilter, setPortalFilter] = useState('all')
  const [agingFilter, setAgingFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [invoiceRows, clientRows, officeRows] = await Promise.all([
        base44.entities.Invoice.list('-created_date', 5000),
        base44.entities.Client.list('full_name', 5000),
        base44.entities.OfficeSettings.list('-created_date', 1),
      ])
      setInvoices(Array.isArray(invoiceRows) ? invoiceRows : [])
      setClients(Array.isArray(clientRows) ? clientRows : [])
      setOfficeSettings(officeRows?.[0] || null)
    } catch (error) {
      setLoadError(error?.message || 'تعذّر تحميل بيانات التحصيل.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  usePageRefresh(loadData, ['invoices', 'clients', 'office_settings'])
  useEffect(() => subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page: current }) => {
    if (current === 'Collections') searchRef.current?.focus()
  }), [])

  const clientLookup = useMemo(() => buildClientLookup(clients), [clients])
  const resolveClient = useCallback((invoice) => (
    clientLookup.get(String(invoice?.client_id || '')) || clientLookup.get(String(invoice?.client_name || '')) || {}
  ), [clientLookup])

  const scopedInvoices = useMemo(() => invoices.filter((invoice) => (
    portalFilter === 'all' || getInvoicePortalScope(invoice) === portalFilter
  )), [invoices, portalFilter])
  const summary = useMemo(() => buildCollectionsSummary(scopedInvoices), [scopedInvoices])
  const bucketMap = useMemo(() => new Map(summary.buckets.map((bucket) => [bucket.id, bucket])), [summary.buckets])

  const rows = useMemo(() => scopedInvoices
    .filter((invoice) => getInvoiceTotals(invoice).remaining > 0 && invoice.status !== 'ملغاة')
    .map((invoice) => {
      const client = resolveClient(invoice)
      return {
        ...invoice,
        _client: client,
        _totals: getInvoiceTotals(invoice),
        _daysOverdue: getDaysOverdue(invoice),
        _agingBucket: getAgingBucket(invoice),
        _priority: getCollectionPriority(invoice),
      }
    })
    .filter((invoice) => agingFilter === 'all' || invoice._agingBucket === agingFilter)
    .filter((invoice) => searchInFields({
      ...invoice,
      client_phone: invoice._client.phone,
      client_email: invoice._client.email,
    }, ['invoice_number', 'client_name', 'case_title', 'case_number', 'client_phone', 'client_email'], search))
    .sort((first, second) => compareCollectionPriority(first, second)),
  [agingFilter, resolveClient, scopedInvoices, search])

  const pagedRows = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [page, rows])

  useEffect(() => { setPage(1) }, [search, portalFilter, agingFilter])
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
    if (page > maxPage) setPage(maxPage)
  }, [page, rows.length])

  const getPaymentUrl = (invoice) => buildSecurePaymentUrl(invoice.payment_token)

  const sendWhatsApp = (invoice) => {
    const paymentUrl = getPaymentUrl(invoice)
    const message = paymentUrl
      ? buildPaymentWhatsAppMessage(invoice, paymentUrl, officeSettings || {})
      : invoice._daysOverdue > 0
        ? invoiceOverdueMessage(invoice, officeSettings || {})
        : invoiceReminderMessage(invoice, officeSettings || {})
    openWhatsApp(invoice._client?.phone, message)
  }

  const copyPaymentLink = async (invoice) => {
    const paymentUrl = getPaymentUrl(invoice)
    if (!paymentUrl) return
    try {
      await navigator.clipboard.writeText(paymentUrl)
      setCopiedId(invoice.id)
      window.setTimeout(() => setCopiedId(null), 2200)
    } catch {
      window.prompt('انسخ رابط الدفع:', paymentUrl)
    }
  }

  const markPaid = async (invoice) => {
    if (!window.confirm(`تأكيد تحصيل كامل المتبقي للفاتورة ${invoice.invoice_number || ''}؟`)) return
    setUpdatingId(invoice.id)
    try {
      await base44.entities.Invoice.update(invoice.id, {
        paid_amount: invoice._totals.total,
        status: 'مدفوعة',
      })
      await loadData()
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-24 rounded-3xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-28 rounded-3xl bg-muted" />)}</div>
      <div className="h-72 rounded-3xl bg-muted" />
    </div>
  )

  if (loadError) return <PageErrorState title="تعذّر فتح مركز التحصيل" message={loadError} onRetry={loadData} />

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="مركز التحصيل"
        subtitle="رؤية موحّدة للذمم وأعمار الديون ومتابعة السداد"
        action={<Button type="button" variant="outline" className="gap-2" onClick={loadData}><RefreshCw className="h-4 w-4" /> تحديث</Button>}
      />

      <section className="hero-electric-panel relative overflow-hidden text-white">
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge className="border-white/10 bg-white/10 text-sky-200"><ShieldCheck className="h-3.5 w-3.5" /> متابعة مالية استباقية</Badge>
            <h2 className="text-2xl font-black md:text-3xl">حوّل الفواتير المستحقة إلى خطة تحصيل واضحة</h2>
            <p className="text-sm leading-7 text-white/60">الأولوية محسوبة تلقائيًا حسب تاريخ الاستحقاق، مع وصول مباشر إلى واتساب ورابط الدفع وملف الموكّل.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:w-[390px]">
            <div className="hero-side-stat"><p className="hero-side-label">إجمالي الذمم</p><p className="hero-side-value">{money(summary.totalOutstanding)} <span className="text-xs">د.إ</span></p></div>
            <div className="hero-side-stat"><p className="hero-side-label">نسبة التحصيل</p><p className="hero-side-value">{summary.collectionRate}%</p></div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card className="p-4 md:p-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><WalletCards className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">الفواتير المفتوحة</p><p className="text-xl font-black text-foreground">{summary.outstandingCount}</p><p className="text-[11px] text-muted-foreground">{money(summary.totalOutstanding)} د.إ</p></div></div></Card>
        <Card className="p-4 md:p-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500"><AlertTriangle className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">المتأخر فعليًا</p><p className="text-xl font-black text-foreground">{summary.overdueCount}</p><p className="text-[11px] text-red-500">{money(summary.overdueAmount)} د.إ</p></div></div></Card>
        <Card className="p-4 md:p-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500"><CalendarClock className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">تستحق خلال 7 أيام</p><p className="text-xl font-black text-foreground">{summary.dueSoonCount}</p><p className="text-[11px] text-muted-foreground">{money(summary.dueSoonAmount)} د.إ</p></div></div></Card>
        <Card className="p-4 md:p-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500"><TrendingUp className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">المحصّل</p><p className="text-xl font-black text-foreground">{money(summary.totalPaid)}</p><p className="text-[11px] text-muted-foreground">من {money(summary.totalBilled)} د.إ</p></div></div></Card>
      </div>

      <Card className="p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><h3 className="font-black text-foreground">أعمار الديون</h3><p className="mt-1 text-xs text-muted-foreground">اضغط على أي شريحة لتصفية قائمة المتابعة</p></div>
          {agingFilter !== 'all' && <Button type="button" size="sm" variant="ghost" onClick={() => setAgingFilter('all')}>إلغاء التصفية</Button>}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {summary.buckets.map((bucket) => (
            <button
              type="button"
              key={bucket.id}
              onClick={() => setAgingFilter((current) => current === bucket.id ? 'all' : bucket.id)}
              className={`rounded-2xl border p-3 text-right transition-all hover:-translate-y-0.5 hover:shadow-md ${agingFilter === bucket.id ? 'border-primary bg-primary/8 ring-2 ring-primary/10' : 'border-border bg-muted/20'}`}
            >
              <span className="mb-2 block h-1.5 rounded-full" style={{ backgroundColor: bucket.color, opacity: bucket.count ? 1 : 0.25 }} />
              <span className="block text-xs font-bold text-foreground">{bucket.shortLabel}</span>
              <span className="mt-1 block text-base font-black text-foreground">{money(bucket.amount)} <small className="text-[9px] font-medium text-muted-foreground">د.إ</small></span>
              <span className="mt-1 block text-[10px] text-muted-foreground">{bucket.count} فاتورة · {bucket.percentage}%</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالموكّل أو الفاتورة أو القضية أو الهاتف…" className="h-11 pr-10" /></div>
        <div className="grid grid-cols-3 gap-2 lg:w-auto">
          {[
            { id: 'all', label: 'كل الأقسام' },
            { id: PORTAL_SCOPE_HELM, label: 'حلمي' },
            { id: PORTAL_SCOPE_BADAYAT, label: 'بداية الخير' },
          ].map((option) => <Button key={option.id} type="button" size="sm" variant={portalFilter === option.id ? 'default' : 'outline'} className="h-11" onClick={() => setPortalFilter(option.id)}>{option.label}</Button>)}
        </div>
      </div>

      {rows.length === 0 ? (
        <Card className="p-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-4 text-lg font-black text-foreground">لا توجد ذمم مطابقة</h3>
          <p className="mt-2 text-sm text-muted-foreground">جرّب تغيير الفلتر أو عبارة البحث، أو راجع صفحة الفواتير.</p>
          <Button type="button" variant="outline" className="mt-5 gap-2" onClick={() => navigate(createPageUrl('Invoices'))}><FileText className="h-4 w-4" /> فتح الفواتير</Button>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {pagedRows.map((invoice) => {
              const priority = PRIORITY_META[invoice._priority] || PRIORITY_META.normal
              const bucket = bucketMap.get(invoice._agingBucket)
              const currency = invoice.currency || officeSettings?.currency || 'د.إ'
              return (
                <Card key={invoice.id} className="overflow-hidden border-border transition-all hover:border-primary/25 hover:shadow-lg">
                  <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:p-5">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${bucket?.color || '#64748b'}18`, color: bucket?.color || '#64748b' }}><CreditCard className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black text-foreground">{invoice.client_name || 'موكّل غير محدد'}</h3><Badge variant="outline" className={priority.className}>{priority.label}</Badge>{bucket && <Badge variant="outline" className="text-[10px]">{bucket.label}</Badge>}</div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{invoice.invoice_number || 'فاتورة بدون رقم'}{invoice.case_title ? ` · ${invoice.case_title}` : ''}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>الاستحقاق: {dateLabel(invoice.due_date)}</span><span>{invoice._daysOverdue > 0 ? `متأخرة ${invoice._daysOverdue} يومًا` : invoice._daysOverdue === 0 ? 'تستحق اليوم' : invoice._daysOverdue !== null ? `متبقي ${Math.abs(invoice._daysOverdue)} أيام` : 'يلزم تحديد الاستحقاق'}</span>{invoice._client?.phone && <span dir="ltr">{invoice._client.phone}</span>}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-3 lg:w-64">
                      <div><p className="text-[10px] text-muted-foreground">إجمالي الفاتورة</p><p className="font-bold text-foreground">{money(invoice._totals.total)} <small>{currency}</small></p></div>
                      <div><p className="text-[10px] text-muted-foreground">المتبقي</p><p className="font-black text-destructive">{money(invoice._totals.remaining)} <small>{currency}</small></p></div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:w-[330px] lg:justify-end">
                      <Button type="button" size="sm" className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => sendWhatsApp(invoice)}><MessageCircle className="h-4 w-4" /> واتساب</Button>
                      <Button type="button" size="sm" variant="outline" disabled={!invoice.payment_token} title={invoice.payment_token ? 'نسخ رابط الدفع الآمن' : 'أنشئ رمز دفع آمن لهذه الفاتورة أولًا'} className="gap-1.5" onClick={() => copyPaymentLink(invoice)}>{copiedId === invoice.id ? <Check className="h-4 w-4 text-emerald-500" /> : <ClipboardCopy className="h-4 w-4" />}{copiedId === invoice.id ? 'تم النسخ' : 'رابط الدفع'}</Button>
                      {invoice.client_id && <Button type="button" size="icon" variant="outline" title="ملف الموكّل" onClick={() => navigate(`${createPageUrl('Client360')}?id=${invoice.client_id}`)}><ExternalLink className="h-4 w-4" /></Button>}
                      <Button type="button" size="sm" variant="ghost" disabled={updatingId === invoice.id} className="gap-1.5 text-emerald-600" onClick={() => markPaid(invoice)}><CheckCircle2 className="h-4 w-4" /> تم السداد</Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          <PaginationControls page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} />
        </>
      )}

      <div className="flex justify-end"><Button type="button" variant="ghost" className="gap-2 text-muted-foreground" onClick={() => navigate(createPageUrl('Invoices'))}>إدارة كل الفواتير <ArrowLeft className="h-4 w-4" /></Button></div>
    </div>
  )
}
