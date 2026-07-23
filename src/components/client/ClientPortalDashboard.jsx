import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/helm/StatusBadge'
import ClientContactCard from '@/components/helm/ClientContactCard'
import { getInvoiceTotals } from '@/lib/invoiceMath'
import { caseSuccessStats } from '@/lib/dataIntegrity'
import {
  Briefcase,
  Receipt,
  FileText,
  Bell,
  CalendarDays,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink,
  Scale,
  TrendingUp,
  Clock3,
} from 'lucide-react'

function fmtMoney(value) {
  return Number(value || 0).toLocaleString('ar-AE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function fmtDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('ar-AE', { year: 'numeric', month: 'short', day: 'numeric' })
}

function SummaryCard({ icon: Icon, label, value, sub, tone = 'blue', to }) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-900 border-blue-100',
    green: 'bg-emerald-50 text-emerald-900 border-emerald-100',
    amber: 'bg-amber-50 text-amber-900 border-amber-100',
    red: 'bg-red-50 text-red-900 border-red-100',
    slate: 'bg-slate-50 text-slate-900 border-slate-200',
  }[tone]
  const body = (
    <Card className={`h-full border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black opacity-70">{label}</p>
          <p className="mt-2 text-2xl font-black leading-none">{value}</p>
          {sub && <p className="mt-2 text-xs font-bold opacity-65">{sub}</p>}
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75 shadow-sm"><Icon className="h-5 w-5" /></span>
      </div>
    </Card>
  )
  return to ? <Link to={createPageUrl(to)}>{body}</Link> : body
}

function SuccessGauge({ stats }) {
  const percentage = stats.rate ?? 0
  const color = stats.rate === null ? '#94a3b8' : percentage >= 75 ? '#059669' : percentage >= 50 ? '#d97706' : '#dc2626'
  return (
    <Card className="border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-32 w-32 shrink-0 rounded-full" style={{ background: `conic-gradient(${color} ${percentage * 3.6}deg, #e2e8f0 0deg)` }}>
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white text-center">
            <p className="text-3xl font-black text-slate-950">{stats.rate === null ? '—' : `${stats.rate}%`}</p>
            <p className="text-[11px] font-black text-slate-500">معدل النجاح</p>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-900" /><h2 className="text-lg font-black text-slate-950">مؤشر نتائج القضايا</h2></div>
          <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
            النسبة محسوبة فقط من القضايا التي تم تسجيل نتيجتها. القضايا غير المحسومة أو غير المصنفة لا تدخل في الحساب حتى تظل النسبة دقيقة.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-emerald-50 p-3 text-center"><p className="text-lg font-black text-emerald-800">{stats.won}</p><p className="text-[11px] font-black text-emerald-700">ناجحة</p></div>
            <div className="rounded-2xl bg-amber-50 p-3 text-center"><p className="text-lg font-black text-amber-800">{stats.partial}</p><p className="text-[11px] font-black text-amber-700">جزئية</p></div>
            <div className="rounded-2xl bg-slate-100 p-3 text-center"><p className="text-lg font-black text-slate-800">{stats.unrated}</p><p className="text-[11px] font-black text-slate-600">غير محسومة</p></div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function SectionHeader({ icon: Icon, title, count, to }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-900 text-white"><Icon className="h-5 w-5" /></span>
        <div><h2 className="font-black text-slate-950">{title}</h2><p className="text-xs font-bold text-slate-500">{count} سجل</p></div>
      </div>
      {to && <Link to={createPageUrl(to)}><Button variant="outline" size="sm">فتح القسم</Button></Link>}
    </div>
  )
}

function EmptyRow({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">{text}</div>
}

export default function ClientPortalDashboard({ user, data, greeting = 'مرحباً' }) {
  const invoices = data.invoices || []
  const cases = data.cases || []
  const documents = data.documents || []
  const sessions = data.sessions || []
  const notifications = data.notifications || []
  const caseStats = useMemo(() => caseSuccessStats(cases), [cases])
  const finance = useMemo(() => invoices.reduce((acc, invoice) => {
    const totals = getInvoiceTotals(invoice)
    acc.total += totals.total
    acc.paid += totals.paid
    acc.remaining += totals.remaining
    if (totals.remaining > 0) acc.unpaidCount += 1
    if (invoice.status === 'متأخرة') acc.overdueCount += 1
    return acc
  }, { total: 0, paid: 0, remaining: 0, unpaidCount: 0, overdueCount: 0 }), [invoices])

  const nextSession = useMemo(() => sessions
    .filter((item) => item.session_date && new Date(item.session_date) >= new Date())
    .sort((a, b) => new Date(a.session_date) - new Date(b.session_date))[0] || null, [sessions])

  return (
    <div className="space-y-5 page-enter">
      <section className="overflow-hidden rounded-[30px] bg-gradient-to-l from-blue-950 via-blue-900 to-slate-900 p-5 text-white shadow-xl md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Badge className="border-white/15 bg-white/10 text-white"><ShieldCheck className="h-3.5 w-3.5" /> بوابة الموكل الخاصة</Badge>
              {nextSession && <Badge className="border-amber-200/20 bg-amber-300 text-slate-950"><CalendarDays className="h-3.5 w-3.5" /> الجلسة القادمة {fmtDate(nextSession.session_date)}</Badge>}
            </div>
            <h1 className="mt-4 text-2xl font-black md:text-3xl">{greeting}، {user?.full_name || 'الموكل الكريم'}</h1>
            <p className="mt-2 text-sm font-medium leading-7 text-blue-100">جميع القضايا والمستندات والفواتير والمدفوع والمتبقي والنتائج المسجلة في ملفك تظهر هنا من مصدر واحد مرتبط بحسابك.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[480px]">
            <div className="rounded-2xl bg-white/10 p-3 text-center"><p className="text-xl font-black">{cases.length}</p><p className="text-[11px] font-bold text-blue-100">القضايا</p></div>
            <div className="rounded-2xl bg-white/10 p-3 text-center"><p className="text-xl font-black">{documents.length}</p><p className="text-[11px] font-bold text-blue-100">المستندات</p></div>
            <div className="rounded-2xl bg-emerald-400/20 p-3 text-center"><p className="text-xl font-black">{fmtMoney(finance.paid)}</p><p className="text-[11px] font-bold text-emerald-100">المدفوع</p></div>
            <div className="rounded-2xl bg-amber-400/20 p-3 text-center"><p className="text-xl font-black">{fmtMoney(finance.remaining)}</p><p className="text-[11px] font-bold text-amber-100">المتبقي</p></div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <SummaryCard icon={Briefcase} label="كل القضايا" value={cases.length} sub={`${caseStats.active} جارية`} tone="blue" to="Cases" />
        <SummaryCard icon={Scale} label="القضايا المحسومة" value={caseStats.decided} sub={`${caseStats.unrated} غير محسومة`} tone="slate" />
        <SummaryCard icon={FileText} label="كل المستندات" value={documents.length} tone="green" to="Documents" />
        <SummaryCard icon={Receipt} label="كل الفواتير" value={invoices.length} sub={`${finance.unpaidCount} غير مكتملة السداد`} tone="amber" to="Invoices" />
        <SummaryCard icon={CheckCircle2} label="إجمالي المدفوع" value={`${fmtMoney(finance.paid)} د.إ`} tone="green" />
        <SummaryCard icon={AlertTriangle} label="إجمالي المتبقي" value={`${fmtMoney(finance.remaining)} د.إ`} sub={finance.overdueCount ? `${finance.overdueCount} متأخرة` : 'لا متأخرات'} tone={finance.remaining > 0 ? 'red' : 'green'} />
      </div>

      <SuccessGauge stats={caseStats} />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader icon={Briefcase} title="جميع القضايا الخاصة بك" count={cases.length} to="Cases" />
          <div className="max-h-[520px] space-y-3 overflow-y-auto pl-1">
            {cases.length === 0 && <EmptyRow text="لا توجد قضايا مرتبطة بحسابك حتى الآن." />}
            {cases.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="font-black text-slate-950">{item.title || 'قضية'}</p><p className="mt-1 text-xs font-bold text-slate-500">{item.case_number ? `#${item.case_number}` : 'بدون رقم'} · {item.case_type || '—'} · {item.court || '—'}</p></div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  {item.case_result && item.case_result !== 'غير محسومة' && <Badge variant="secondary">النتيجة: {item.case_result}</Badge>}
                  {item.success_percentage !== null && item.success_percentage !== undefined && item.success_percentage !== '' && <Badge className="bg-emerald-100 text-emerald-800">نسبة النجاح: {Number(item.success_percentage)}%</Badge>}
                  {item.next_session_date && <Badge className="bg-blue-100 text-blue-800"><Clock3 className="h-3 w-3" /> الجلسة: {fmtDate(item.next_session_date)}</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader icon={Receipt} title="جميع الفواتير والمدفوعات" count={invoices.length} to="Invoices" />
          <div className="max-h-[520px] space-y-3 overflow-y-auto pl-1">
            {invoices.length === 0 && <EmptyRow text="لا توجد فواتير مرتبطة بحسابك." />}
            {invoices.map((invoice) => {
              const totals = getInvoiceTotals(invoice)
              const canPay = totals.remaining > 0 && invoice.status !== 'مدفوعة'
              return (
                <div key={invoice.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-black text-slate-950">{invoice.invoice_number || 'فاتورة'}</p><p className="mt-1 text-xs font-bold text-slate-500">{invoice.case_title || 'غير مرتبطة بقضية'} · {fmtDate(invoice.issue_date)}</p></div>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white p-2"><p className="text-xs font-bold text-slate-500">الإجمالي</p><p className="font-black text-slate-950">{fmtMoney(totals.total)}</p></div>
                    <div className="rounded-xl bg-emerald-50 p-2"><p className="text-xs font-bold text-emerald-700">المدفوع</p><p className="font-black text-emerald-800">{fmtMoney(totals.paid)}</p></div>
                    <div className="rounded-xl bg-amber-50 p-2"><p className="text-xs font-bold text-amber-700">المتبقي</p><p className="font-black text-amber-800">{fmtMoney(totals.remaining)}</p></div>
                  </div>
                  {canPay && <a href={`/Payment?token=${btoa(JSON.stringify({ id: invoice.id, ts: Date.now() })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-blue-900 px-3 text-xs font-black text-white"><Wallet className="h-4 w-4" /> سداد المتبقي</a>}
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader icon={FileText} title="جميع المستندات الخاصة بك" count={documents.length} to="Documents" />
        <div className="grid max-h-[580px] gap-3 overflow-y-auto pl-1 md:grid-cols-2 xl:grid-cols-3">
          {documents.length === 0 && <div className="md:col-span-2 xl:col-span-3"><EmptyRow text="لا توجد مستندات مرتبطة بحسابك حتى الآن." /></div>}
          {documents.map((document) => (
            <div key={document.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate font-black text-slate-950">{document.title || document.file_name || 'مستند'}</p><p className="mt-1 text-xs font-bold text-slate-500">{document.case_title || 'مستند عام'} · {document.doc_type || 'أخرى'}</p></div>
                <FileText className="h-5 w-5 shrink-0 text-blue-900" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <StatusBadge status={document.status} />
                {document.file_url ? <a href={document.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-blue-900 hover:underline"><Download className="h-4 w-4" /> فتح المستند</a> : <span className="text-xs font-bold text-slate-400">لا يوجد ملف مرفق</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader icon={Bell} title="التنبيهات غير المقروءة" count={notifications.length} to="Notifications" />
          <div className="space-y-2">
            {notifications.length === 0 && <EmptyRow text="لا توجد تنبيهات جديدة." />}
            {notifications.slice(0, 8).map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-3"><p className="font-black text-slate-950">{item.title}</p><p className="mt-1 text-xs font-medium leading-6 text-slate-600">{item.message}</p></div>)}
          </div>
        </Card>
        <ClientContactCard user={user} officeSettings={data.officeSettings} />
      </div>
    </div>
  )
}
