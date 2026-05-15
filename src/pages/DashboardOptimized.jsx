import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow, differenceInHours, isValid, subMonths } from 'date-fns'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Activity,
  AlertTriangle,
  Bell,
  Briefcase,
  CalendarDays,
  CheckSquare,
  FileText,
  MessageCircle,
  Receipt,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react'

import { base44 } from '@/api/base44Client'
import { createPageUrl } from '@/utils'
import { useAuth } from '@/lib/AuthContext'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import StatCard from '@/components/helm/StatCard'
import StatusBadge from '@/components/helm/StatusBadge'
import ClientContactCard from '@/components/helm/ClientContactCard'
import { PageErrorState } from '@/components/app/AppStatusBar'
import { getInvoiceTotals } from '@/lib/invoiceMath'
import { checkAndCreateReminders } from '@/components/helm/NotificationBell'

const STAFF_PAGE_SIZE = 40
const CLIENT_PAGE_SIZE = 25

function safeFmt(value, pattern, fallback = '—') {
  if (!value) return fallback
  try {
    const date = new Date(value)
    return isValid(date) ? format(date, pattern) : fallback
  } catch {
    return fallback
  }
}

function fmtMoney(value) {
  const n = Number(value || 0)
  if (!n) return '٠'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}ك`
  return n.toLocaleString('ar')
}

function unwrapPage(result) {
  return {
    rows: Array.isArray(result) ? result : (result?.data || []),
    total: Array.isArray(result) ? result.length : (result?.total || 0),
  }
}

function MiniChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={46}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Tooltip content={({ active, payload }) => active && payload?.[0]
          ? <div className="text-[10px] bg-black/80 text-white px-2 py-1 rounded-lg">{payload[0].value.toLocaleString('ar')}</div>
          : null}
        />
        <Area type="monotone" dataKey="v" stroke="#38bdf8" strokeWidth={1.8} fill="rgba(56,189,248,.18)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function QuickLink({ to, icon: Icon, title, text }) {
  return (
    <Link to={createPageUrl(to)} className="dashboard-row-card hover:border-white/18 transition-colors group flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-white">
        <Icon className="h-4 w-4 text-sky-300" />
        <span>
          <b className="block">{title}</b>
          {text && <small className="text-white/40">{text}</small>}
        </span>
      </span>
      <span className="text-white/30 group-hover:text-white/70">←</span>
    </Link>
  )
}

export default function DashboardOptimized() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [data, setData] = useState({
    cases: [],
    clients: [],
    sessions: [],
    tasks: [],
    notifications: [],
    invoices: [],
    documents: [],
    officeSettings: null,
    totals: { cases: 0, clients: 0, sessions: 0, tasks: 0, invoices: 0, documents: 0 },
  })

  const loadAll = useCallback(async () => {
    if (!user?.email) return
    setLoading(true)
    setLoadError('')

    try {
      if (isClient) {
        const [casesPage, invoicesPage, documentsPage, sessionsPage, notifications, settings] = await Promise.all([
          base44.entities.Case.listPage('-created_date', { page: 1, pageSize: CLIENT_PAGE_SIZE }),
          base44.entities.Invoice.listPage('-created_date', { page: 1, pageSize: CLIENT_PAGE_SIZE }),
          base44.entities.Document.listPage('-created_date', { page: 1, pageSize: CLIENT_PAGE_SIZE }),
          base44.entities.Session.listPage('-session_date', { page: 1, pageSize: CLIENT_PAGE_SIZE }),
          base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 20),
          base44.entities.OfficeSettings.list('-created_date', 1),
        ])

        const cases = unwrapPage(casesPage)
        const invoices = unwrapPage(invoicesPage)
        const documents = unwrapPage(documentsPage)
        const sessions = unwrapPage(sessionsPage)

        setData({
          cases: cases.rows,
          invoices: invoices.rows,
          documents: documents.rows,
          sessions: sessions.rows,
          notifications,
          clients: [],
          tasks: [],
          officeSettings: settings?.[0] || null,
          totals: { cases: cases.total, clients: 0, sessions: sessions.total, tasks: 0, invoices: invoices.total, documents: documents.total },
        })
        return
      }

      const [casesPage, clientsPage, sessionsPage, tasksPage, invoicesPage, documentsPage, notifications, settings] = await Promise.all([
        base44.entities.Case.listPage('-created_date', { page: 1, pageSize: STAFF_PAGE_SIZE }),
        base44.entities.Client.listPage('-created_date', { page: 1, pageSize: STAFF_PAGE_SIZE }),
        base44.entities.Session.listPage('-session_date', { page: 1, pageSize: STAFF_PAGE_SIZE }),
        base44.entities.Task.listPage('-due_date', { page: 1, pageSize: STAFF_PAGE_SIZE }),
        base44.entities.Invoice.listPage('-created_date', { page: 1, pageSize: STAFF_PAGE_SIZE }),
        base44.entities.Document.listPage('-created_date', { page: 1, pageSize: 20 }),
        base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 20),
        base44.entities.OfficeSettings.list('-created_date', 1),
      ])

      const cases = unwrapPage(casesPage)
      const clients = unwrapPage(clientsPage)
      const sessions = unwrapPage(sessionsPage)
      const tasks = unwrapPage(tasksPage)
      const invoices = unwrapPage(invoicesPage)
      const documents = unwrapPage(documentsPage)

      setData({
        cases: cases.rows,
        clients: clients.rows,
        sessions: sessions.rows,
        tasks: tasks.rows,
        invoices: invoices.rows,
        documents: documents.rows,
        notifications,
        officeSettings: settings?.[0] || null,
        totals: { cases: cases.total, clients: clients.total, sessions: sessions.total, tasks: tasks.total, invoices: invoices.total, documents: documents.total },
      })
      await checkAndCreateReminders(user.email)
    } catch (error) {
      setLoadError(error?.message || 'تعذر تحميل لوحة التحكم.')
    } finally {
      setLoading(false)
    }
  }, [user?.email, isClient])

  useEffect(() => { loadAll() }, [loadAll])
  usePageRefresh(loadAll, ['cases', 'clients', 'sessions', 'tasks', 'notifications', 'invoices', 'documents'])

  const now = new Date()
  const greeting = useMemo(() => {
    const hour = now.getHours()
    return hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور'
  }, [])

  const activeCases = data.cases.filter(c => c.status === 'جارية').length
  const pendingTasks = data.tasks.filter(t => t.status !== 'مكتملة').length
  const todayTasks = data.tasks.filter(t => t.status !== 'مكتملة' && t.due_date && isToday(new Date(t.due_date)))
  const upcomingSessions = data.sessions
    .filter(s => s.session_date && isValid(new Date(s.session_date)) && new Date(s.session_date) >= now)
    .sort((a, b) => new Date(a.session_date) - new Date(b.session_date))
    .slice(0, 5)
  const urgentTasks = data.tasks.filter(t => {
    if (t.status === 'مكتملة' || !t.due_date) return false
    const hours = differenceInHours(new Date(t.due_date), now)
    return hours >= 0 && hours <= 24
  })

  const invoiceStats = useMemo(() => {
    const total = data.invoices.reduce((sum, invoice) => sum + getInvoiceTotals(invoice).total, 0)
    const paid = data.invoices.reduce((sum, invoice) => sum + getInvoiceTotals(invoice).paid, 0)
    const remaining = Math.max(0, total - paid)
    const overdue = data.invoices.filter(invoice => invoice.status === 'متأخرة')
    return { total, paid, remaining, overdueCount: overdue.length }
  }, [data.invoices])

  const revenueChart = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const d = subMonths(now, 5 - index)
      return { name: format(d, 'M/yy'), v: 0, m: d.getMonth(), y: d.getFullYear() }
    })
    data.invoices.forEach(invoice => {
      const d = invoice.created_date ? new Date(invoice.created_date) : null
      if (!d || !isValid(d)) return
      const target = months.find(m => m.m === d.getMonth() && m.y === d.getFullYear())
      if (target) target.v += Math.round(getInvoiceTotals(invoice).paid || 0)
    })
    return months
  }, [data.invoices])

  const recentActivity = useMemo(() => [
    ...data.cases.slice(0, 3).map(c => ({ id: `case-${c.id}`, icon: Briefcase, label: c.title, sub: c.status || 'قضية', date: c.updated_date || c.created_date })),
    ...data.sessions.slice(0, 2).map(s => ({ id: `session-${s.id}`, icon: CalendarDays, label: s.case_title || 'جلسة', sub: `${s.court || ''} · ${safeFmt(s.session_date, 'dd/MM HH:mm')}`, date: s.session_date })),
    ...data.tasks.slice(0, 2).map(t => ({ id: `task-${t.id}`, icon: CheckSquare, label: t.title, sub: t.priority || 'مهمة', date: t.due_date })),
  ].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 6), [data.cases, data.sessions, data.tasks])

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-44 bg-white/5 rounded-3xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[0,1,2,3].map(i => <div key={i} className="h-28 bg-white/5 rounded-3xl" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{[0,1].map(i => <div key={i} className="h-52 bg-white/5 rounded-3xl" />)}</div>
    </div>
  )

  if (loadError) return <PageErrorState message={loadError} onRetry={loadAll} />

  if (isClient) return (
    <div className="space-y-5 page-enter">
      <section className="hero-electric-panel text-white relative overflow-hidden">
        <div className="relative flex flex-col xl:flex-row xl:items-center gap-6 xl:justify-between">
          <div className="space-y-3 max-w-2xl">
            <Badge className="bg-white/10 text-sky-200 border-white/10"><ShieldCheck className="h-3.5 w-3.5" /> بوابة الموكّل الآمنة</Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold">{greeting}، {user?.full_name?.split(' ')?.[0] || 'الموكّل الكريم'}</h1>
            <p className="text-white/60 text-sm leading-7">تم تحسين هذه اللوحة لتعرض آخر بياناتك فقط بسرعة، مع ترك التفاصيل الكاملة داخل صفحات القضايا والفواتير والمستندات.</p>
            <div className="flex flex-wrap gap-2">
              <Link to={createPageUrl('Cases')}><Button className="bg-white/10 hover:bg-white/18 text-white gap-1.5 border border-white/10"><Briefcase className="h-4 w-4" /> قضاياي</Button></Link>
              <Link to={createPageUrl('Invoices')}><Button className="bg-white/10 hover:bg-white/18 text-white gap-1.5 border border-white/10"><Receipt className="h-4 w-4" /> فواتيري</Button></Link>
              <Link to={createPageUrl('Documents')}><Button className="bg-white/10 hover:bg-white/18 text-white gap-1.5 border border-white/10"><Upload className="h-4 w-4" /> مستنداتي</Button></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:w-72 shrink-0">
            <div className="hero-side-stat"><p className="hero-side-label">إجمالي القضايا</p><p className="hero-side-value">{data.totals.cases}</p></div>
            <div className="hero-side-stat"><p className="hero-side-label">المستندات</p><p className="hero-side-value">{data.totals.documents}</p></div>
            <div className="hero-side-stat"><p className="hero-side-label">المدفوع</p><p className="hero-side-value">{fmtMoney(invoiceStats.paid)} د.إ</p></div>
            <div className="hero-side-stat"><p className="hero-side-label">المتبقي</p><p className="hero-side-value">{fmtMoney(invoiceStats.remaining)} د.إ</p></div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="قضاياي" value={data.totals.cases} icon={Briefcase} color="primary" to="Cases" />
        <StatCard title="فواتيري" value={data.totals.invoices} icon={Receipt} color="accent" to="Invoices" />
        <StatCard title="مستنداتي" value={data.totals.documents} icon={FileText} color="success" to="Documents" />
        <StatCard title="الإشعارات" value={data.notifications.length} icon={Bell} color="warning" to="Notifications" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><Receipt className="h-5 w-5 text-sky-300" /> أحدث الفواتير</h2><Link to={createPageUrl('Invoices')} className="text-sky-300 text-xs">عرض الكل</Link></div>
          <div className="space-y-2">
            {data.invoices.slice(0, 5).map(invoice => (
              <div key={invoice.id} className="dashboard-row-card">
                <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm truncate">{invoice.invoice_number || 'فاتورة'}</p><p className="text-xs text-white/50 truncate">{invoice.case_title || '—'} · {fmtMoney(getInvoiceTotals(invoice).total)} د.إ</p></div>
                <StatusBadge status={invoice.status} />
              </div>
            ))}
            {data.invoices.length === 0 && <p className="text-white/40 text-sm text-center py-6">لا توجد فواتير</p>}
          </div>
        </Card>

        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <h2 className="font-bold flex items-center gap-2 mb-4"><Activity className="h-5 w-5 text-sky-300" /> إجراءات سريعة</h2>
          <div className="space-y-2">
            <QuickLink to="Documents" icon={Upload} title="رفع مستند" text="إضافة ملف إلى ملفك" />
            <QuickLink to="Invoices" icon={Receipt} title="متابعة الفواتير" text="المدفوع والمتبقي" />
            <QuickLink to="Cases" icon={Briefcase} title="متابعة القضايا" text="آخر القضايا المرتبطة بك" />
            {data.officeSettings?.phone && (
              <a href={`https://wa.me/${String(data.officeSettings.phone).replace(/\D+/g, '')}`} target="_blank" rel="noreferrer" className="dashboard-row-card hover:border-white/18 transition-colors group flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm"><MessageCircle className="h-4 w-4 text-green-300" />واتساب المكتب</span>
                <span className="text-white/30 group-hover:text-white/70">←</span>
              </a>
            )}
          </div>
        </Card>
      </div>

      <ClientContactCard user={user} officeSettings={data.officeSettings} />
    </div>
  )

  return (
    <div className="space-y-5 page-enter">
      <section className="hero-electric-panel text-white relative overflow-hidden">
        <div className="relative flex flex-col xl:flex-row xl:items-center gap-6 xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className="bg-white/10 text-sky-200 border-white/10 text-xs">{format(now, 'EEEE، dd MMMM yyyy')}</Badge>
              {data.notifications.length > 0 && <Badge className="bg-amber-400/20 text-amber-200 border-amber-200/15 text-xs"><Bell className="h-3 w-3" /> {data.notifications.length} تنبيه</Badge>}
              {urgentTasks.length > 0 && <Badge className="bg-red-400/20 text-red-200 border-red-300/15 text-xs"><AlertTriangle className="h-3 w-3" /> {urgentTasks.length} عاجل</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{greeting}، {user?.full_name?.split(' ')?.[0] || 'المستشار'}</h1>
            <p className="text-white/50 text-sm">لوحة محسّنة تسحب آخر {STAFF_PAGE_SIZE} سجلًا فقط من كل قسم، مع استخدام الإجمالي من Supabase للعدادات.</p>
            <div className="flex flex-wrap gap-2">
              <Link to={createPageUrl('Cases')}><div className="hero-side-stat min-w-[105px] text-center"><p className="hero-side-label">القضايا</p><p className="hero-side-value">{data.totals.cases}</p></div></Link>
              <Link to={createPageUrl('Sessions')}><div className="hero-side-stat min-w-[105px] text-center"><p className="hero-side-label">الجلسات</p><p className="hero-side-value">{data.totals.sessions}</p></div></Link>
              <Link to={createPageUrl('Tasks')}><div className="hero-side-stat min-w-[105px] text-center"><p className="hero-side-label">المهام</p><p className="hero-side-value">{data.totals.tasks}</p></div></Link>
              <Link to={createPageUrl('Clients')}><div className="hero-side-stat min-w-[105px] text-center"><p className="hero-side-label">الموكلون</p><p className="hero-side-value">{data.totals.clients}</p></div></Link>
            </div>
          </div>
          <div className="xl:w-80 shrink-0 hero-side-stat">
            <p className="hero-side-label flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> الإيراد المحصّل — عينة آخر الفواتير</p>
            <p className="hero-side-value">{fmtMoney(invoiceStats.paid)} <span className="text-sm font-normal text-white/55">د.إ</span></p>
            <MiniChart data={revenueChart} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="القضايا" value={data.totals.cases} icon={Briefcase} color="primary" to="Cases" subtitle={`${activeCases} نشطة ضمن العينة`} />
        <StatCard title="الموكلون" value={data.totals.clients} icon={Users} color="accent" to="Clients" />
        <StatCard title="الفواتير" value={data.totals.invoices} icon={Receipt} color="success" to="Invoices" subtitle={`${fmtMoney(invoiceStats.remaining)} د.إ متبقي بالعينة`} />
        <StatCard title="المهام" value={data.totals.tasks} icon={CheckSquare} color="warning" to="Tasks" subtitle={`${pendingTasks} معلّقة ضمن العينة`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><CalendarDays className="h-5 w-5 text-sky-300" /> الجلسات القادمة</h2><Link to={createPageUrl('Sessions')} className="text-sky-300 text-xs">الكل</Link></div>
          <div className="space-y-2.5">
            {upcomingSessions.map(session => {
              const d = new Date(session.session_date)
              const soon = differenceInHours(d, now) <= 24
              const label = isToday(d) ? 'اليوم' : isTomorrow(d) ? 'غدًا' : safeFmt(session.session_date, 'dd/MM')
              return (
                <div key={session.id} className={`dashboard-row-card ${soon ? 'border-red-400/20 bg-red-500/5' : ''}`}>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm truncate">{session.case_title || 'جلسة'}</p><p className="text-xs text-white/45 truncate">{session.court || '—'} · {safeFmt(session.session_date, 'HH:mm')}</p></div>
                  <Badge className={`text-[10px] ${soon ? 'bg-red-500/20 text-red-200' : 'bg-white/8 text-sky-200'} border-0`}>{label}</Badge>
                </div>
              )
            })}
            {upcomingSessions.length === 0 && <p className="text-white/35 text-sm text-center py-6">لا توجد جلسات قادمة ضمن العينة الحالية</p>}
          </div>
        </Card>

        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <h2 className="font-bold flex items-center gap-2 mb-4"><Activity className="h-5 w-5 text-sky-300" /> النشاط الأخير</h2>
          <div className="space-y-3">
            {recentActivity.map(item => {
              const Icon = item.icon
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-white/6 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5 text-sky-300" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm text-white font-medium truncate">{item.label}</p><p className="text-[11px] text-white/40 truncate">{item.sub}</p></div>
                  <p className="text-[10px] text-white/25 shrink-0">{safeFmt(item.date, 'dd/MM')}</p>
                </div>
              )
            })}
            {recentActivity.length === 0 && <p className="text-white/35 text-sm text-center py-6">لا يوجد نشاط حديث</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><CheckSquare className="h-5 w-5 text-sky-300" /> مهام اليوم</h2><Link to={createPageUrl('Tasks')} className="text-sky-300 text-xs">الكل</Link></div>
          <div className="space-y-2">
            {todayTasks.slice(0, 5).map(task => (
              <div key={task.id} className="dashboard-row-card">
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{task.title}</p>{task.case_title && <p className="text-[11px] text-white/40">{task.case_title}</p>}</div>
                <StatusBadge status={task.priority} isPriority />
              </div>
            ))}
            {todayTasks.length === 0 && <p className="text-white/35 text-sm text-center py-6">لا توجد مهام لهذا اليوم</p>}
          </div>
        </Card>

        <Card className="dashboard-card-elevated rounded-3xl p-5 text-white">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-sky-300" /> آخر القضايا</h2><Link to={createPageUrl('Cases')} className="text-sky-300 text-xs">الكل</Link></div>
          <div className="space-y-2">
            {data.cases.slice(0, 5).map(c => (
              <div key={c.id} className="dashboard-row-card">
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{c.title}</p><p className="text-[11px] text-white/40">{c.client_name || '—'} · {c.case_type || 'قضية'}</p></div>
                <StatusBadge status={c.status} />
              </div>
            ))}
            {data.cases.length === 0 && <p className="text-white/35 text-sm text-center py-6">لا توجد قضايا</p>}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={loadAll} className="gap-2 border-white/12 text-white/70 hover:bg-white/8">
          <RefreshCw className="h-4 w-4" /> تحديث اللوحة
        </Button>
      </div>
    </div>
  )
}
