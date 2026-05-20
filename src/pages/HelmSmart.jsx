import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DatabaseZap, ExternalLink, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'
import { base44 } from '@/api/base44Client'
import { getInvoiceTotals } from '@/lib/invoiceMath'

const DEFAULT_HELM_SMART_URL = 'https://helm-smart.vercel.app/app?embedded=1&source=portal'
const SYNC_MESSAGE_TYPE = 'HELM_PORTAL_SYNC_DATA'
const ACK_MESSAGE_TYPE = 'HELM_SMART_SYNC_ACK'
const SMART_CHANGED_MESSAGE_TYPE = 'HELM_SMART_DATA_CHANGED'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function buildSmartUrl(user) {
  const raw = import.meta.env.VITE_HELM_SMART_URL || DEFAULT_HELM_SMART_URL
  try {
    const url = new URL(raw)
    url.searchParams.set('embedded', '1')
    url.searchParams.set('source', 'helm-portal')
    if (user?.role) url.searchParams.set('portal_role', user.role)
    return url.toString()
  } catch {
    return DEFAULT_HELM_SMART_URL
  }
}

function asMoney(value) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function smartDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10)
  try { return new Date(value).toISOString().slice(0, 10) } catch { return String(value).slice(0, 10) }
}

function validUuid(value) {
  return UUID_RE.test(String(value || ''))
}

function maybeId(value) {
  return validUuid(value) ? String(value) : undefined
}

function mapClient(row) {
  return {
    id: String(row.id || row.email || crypto.randomUUID()),
    name: row.full_name || row.name || row.client_name || 'موكل بدون اسم',
    email: row.email || '',
    phone: row.phone || row.mobile || '',
    emiratesId: row.id_number || row.emirates_id || '',
    address: row.address || '',
    type: row.client_type === 'شركة' || row.type === 'Corporate' ? 'Corporate' : 'Individual',
    totalCases: Number(row.total_cases || 0),
    createdAt: smartDate(row.created_date || row.created_at),
    notes: row.notes || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    category: 'office',
  }
}

function mapCase(row) {
  return {
    id: String(row.id || crypto.randomUUID()),
    caseNumber: row.case_number || row.number || row.case_no || '',
    title: row.title || row.case_title || 'قضية بدون عنوان',
    caseType: row.case_type || row.type || '',
    clientId: String(row.client_id || row.client_email || row.client_name || ''),
    clientName: row.client_name || row.client || '',
    opponentName: row.opponent_name || row.opponent || '',
    court: row.court || '',
    status: row.status || 'نشط',
    nextHearingDate: smartDate(row.next_hearing_date || row.session_date || row.updated_date),
    assignedLawyer: row.assigned_lawyer || row.lawyer || '',
    createdAt: smartDate(row.created_date || row.created_at),
    documents: [],
    totalFee: asMoney(row.total_fee || row.fees || row.amount),
    paidAmount: asMoney(row.paid_amount || row.paid),
  }
}

function mapInvoice(row) {
  const totals = getInvoiceTotals(row)
  return {
    id: String(row.id || crypto.randomUUID()),
    invoiceNumber: row.invoice_number || row.number || '',
    caseId: String(row.case_id || ''),
    caseTitle: row.case_title || '',
    clientId: String(row.client_id || row.client_name || ''),
    clientName: row.client_name || '',
    amount: asMoney(totals.total || row.amount || row.total),
    date: smartDate(row.issue_date || row.invoice_date || row.date || row.created_date),
    status: row.status === 'مدفوعة' ? 'Paid' : row.status === 'جزئية' ? 'Partial' : 'Unpaid',
    description: row.description || row.notes || '',
    finalAmount: asMoney(totals.total || row.final_amount),
  }
}

function mapExpense(row) {
  return {
    id: String(row.id || crypto.randomUUID()),
    category: row.category || row.title || 'أخرى',
    amount: asMoney(row.amount),
    date: smartDate(row.expense_date || row.date || row.created_date),
    description: row.notes || row.description || row.title || '',
    status: row.status === 'معلق' || row.status === 'Pending' ? 'Pending' : 'Paid',
  }
}

function mapTaskToReminder(row) {
  return {
    id: String(row.id || crypto.randomUUID()),
    title: row.title || 'تذكير',
    dueDate: smartDate(row.due_date || row.created_date),
    dueTime: row.due_time || '09:00',
    priority: row.priority || 'متوسط',
    done: row.status === 'مكتملة',
    note: row.description || row.notes || row.case_title || '',
    source: { type: 'manual' },
  }
}

function mapDocumentToNote(row) {
  return {
    id: String(row.id || crypto.randomUUID()),
    title: row.title || row.file_name || 'مستند',
    content: [row.notes, row.client_name, row.case_title, row.file_url].filter(Boolean).join('\n'),
    createdAt: row.created_date || new Date().toISOString(),
    updatedAt: row.updated_date || row.created_date || new Date().toISOString(),
    pinned: false,
  }
}

function buildConfig(settings) {
  return {
    officeName: settings?.office_name || settings?.name || 'مكتب المستشار أحمد حلمي',
    officeSlogan: settings?.office_slogan || 'للاستشارات القانونية',
    officePhone: settings?.phone || '0544144149',
    officeEmail: settings?.email || 'ahmedhelmy200@gmail.com',
    officeAddress: settings?.address || 'الإمارات العربية المتحدة',
    officeWebsite: settings?.website || 'helm-smart.vercel.app',
    primaryColor: settings?.primary_color || '#0f172a',
    secondaryColor: settings?.secondary_color || '#d4af37',
    backgroundColor: '#f8fafc',
    fontFamily: settings?.app_font || 'Cairo',
    logo: settings?.logo_url || null,
    stamp: settings?.stamp_url || null,
    services: [],
    caseTypes: [],
    courts: [],
    invoiceTemplates: [],
    officeTemplates: [],
    invoiceFormatting: { prefix: 'INV-', suffix: '', nextSequence: 1001 },
    features: { enableAI: false, enableAnalysis: false, enableWhatsApp: true },
  }
}

function smartStatusToPortal(status) {
  const s = String(status || '')
  if (s === 'Paid') return 'مدفوعة'
  if (s === 'Partial') return 'جزئية'
  if (s === 'Unpaid') return 'غير مدفوعة'
  if (s === 'Pending') return 'معلق'
  if (s === 'نشط' || s === 'قيد الانتظار' || s === 'مغلق' || s === 'استئناف' || s === 'حكم' || s === 'مرافعة') return s
  return s || 'مسودة'
}

function smartClientToPortal(client) {
  const row = {
    full_name: client.name || client.full_name || 'موكل بدون اسم',
    client_type: client.type === 'Corporate' ? 'شركة' : 'فرد',
    id_number: client.emiratesId || client.id_number || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    notes: client.notes || '',
    status: 'نشط',
  }
  const id = maybeId(client.id)
  return id ? { id, ...row } : row
}

function smartCaseToPortal(item) {
  const row = {
    case_number: item.caseNumber || item.case_number || '',
    title: item.title || 'قضية بدون عنوان',
    client_id: item.clientId || item.client_id || null,
    client_name: item.clientName || item.client_name || '',
    case_type: item.caseType || item.case_type || 'عام',
    court: item.court || '',
    status: smartStatusToPortal(item.status) || 'نشط',
    next_session_date: item.nextHearingDate || item.next_session_date || null,
    assigned_lawyer: item.assignedLawyer || item.assigned_lawyer || '',
    opponent_name: item.opponentName || item.opponent_name || '',
    fees: asMoney(item.totalFee || item.fees),
    paid_amount: asMoney(item.paidAmount || item.paid_amount),
  }
  const id = maybeId(item.id)
  return id ? { id, ...row } : row
}

function smartInvoiceToPortal(item) {
  const amount = asMoney(item.finalAmount || item.amount || item.total_fees)
  const paid = item.status === 'Paid' ? amount : asMoney(item.paid_amount)
  const row = {
    invoice_number: item.invoiceNumber || item.invoice_number || '',
    client_name: item.clientName || item.client_name || '',
    case_id: item.caseId || item.case_id || null,
    case_title: item.caseTitle || item.case_title || '',
    issue_date: item.date || item.issue_date || new Date().toISOString().slice(0, 10),
    total_fees: amount,
    paid_amount: paid,
    discount: asMoney(item.discountValue || item.discount),
    vat_rate: asMoney(item.vat_rate ?? 0),
    status: smartStatusToPortal(item.status),
    notes: item.description || item.notes || '',
  }
  const id = maybeId(item.id)
  return id ? { id, ...row } : row
}

function smartExpenseToPortal(item) {
  const row = {
    title: item.description || item.category || 'مصروف',
    amount: asMoney(item.amount),
    category: item.category || 'أخرى',
    expense_date: item.date || item.expense_date || new Date().toISOString().slice(0, 10),
    notes: item.description || item.note || '',
    status: item.status === 'Pending' ? 'معلق' : 'مدفوع',
  }
  const id = maybeId(item.id)
  return id ? { id, ...row } : row
}

function smartReminderToTask(item) {
  const row = {
    title: item.title || 'تذكير',
    description: item.note || '',
    due_date: `${item.dueDate || new Date().toISOString().slice(0, 10)}T${item.dueTime || '09:00'}:00`,
    priority: item.priority || 'متوسطة',
    status: item.done ? 'مكتملة' : 'معلقة',
  }
  const id = maybeId(item.id)
  return id ? { id, ...row } : row
}

async function upsertPortalRows(entity, rows, limit = 200) {
  const api = base44.entities[entity]
  if (!api || !Array.isArray(rows)) return 0
  let count = 0
  for (const row of rows.slice(0, limit)) {
    if (!row || typeof row !== 'object') continue
    try {
      if (row.id && typeof api.upsert === 'function') await api.upsert(row)
      else await api.create(row)
      count += 1
    } catch (error) {
      console.warn(`[HelmSmart] ${entity} sync skipped:`, error?.message || error)
    }
  }
  return count
}

export default function HelmSmart() {
  const { user } = useAuth()
  const smartUrl = useMemo(() => buildSmartUrl(user), [user?.role])
  const frameRef = useRef(null)
  const latestPayloadRef = useRef(null)
  const applyingFromSmartRef = useRef(false)
  const [frameKey, setFrameKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('لم يتم إرسال البيانات بعد')

  const buildPortalSnapshot = useCallback(async () => {
    const [clients, cases, invoices, expenses, documents, tasks, settings] = await Promise.all([
      base44.entities.Client.list('-created_date', 500),
      base44.entities.Case.list('-created_date', 500),
      base44.entities.Invoice.list('-created_date', 500),
      base44.entities.Expense.list('-created_date', 300),
      base44.entities.Document.list('-created_date', 300),
      base44.entities.Task.list('-due_date', 300),
      base44.entities.OfficeSettings.list('-created_date', 1),
    ])

    const smartClients = clients.map(mapClient)
    const smartCases = cases.map(mapCase)
    const smartInvoices = invoices.map(mapInvoice)
    const smartExpenses = expenses.map(mapExpense)
    const smartReminders = tasks.map(mapTaskToReminder)
    const smartNotes = documents.slice(0, 150).map(mapDocumentToNote)

    const caseCountByClient = smartCases.reduce((acc, item) => {
      if (!item.clientId) return acc
      acc[item.clientId] = (acc[item.clientId] || 0) + 1
      return acc
    }, {})

    return {
      source: 'helm-portal',
      syncedAt: new Date().toISOString(),
      config: buildConfig(settings?.[0] || null),
      clients: smartClients.map(client => ({ ...client, totalCases: caseCountByClient[client.id] || client.totalCases || 0 })),
      cases: smartCases,
      invoices: smartInvoices,
      expenses: smartExpenses,
      receipts: [],
      logs: [],
      reminders: smartReminders,
      notes: smartNotes,
    }
  }, [])

  const sendPayloadToFrame = useCallback((payload = latestPayloadRef.current) => {
    if (!payload || !frameRef.current?.contentWindow) return false
    frameRef.current.contentWindow.postMessage({ type: SYNC_MESSAGE_TYPE, payload }, '*')
    return true
  }, [])

  const syncPortalData = useCallback(async () => {
    if (!user?.email) return
    if (applyingFromSmartRef.current) return
    setSyncing(true)
    setSyncStatus('جارٍ تجهيز بيانات حلم بروتال…')
    try {
      const payload = await buildPortalSnapshot()
      latestPayloadRef.current = payload
      const sent = sendPayloadToFrame(payload)
      setSyncStatus(sent
        ? `تم إرسال ${payload.clients.length} موكل، ${payload.cases.length} قضية، ${payload.invoices.length} فاتورة إلى حلم سمارت.`
        : 'تم تجهيز البيانات، وسيتم إرسالها عند اكتمال تحميل حلم سمارت.'
      )
    } catch (error) {
      setSyncStatus(error?.message || 'تعذر تجهيز بيانات حلم بروتال.')
    } finally {
      setSyncing(false)
    }
  }, [buildPortalSnapshot, sendPayloadToFrame, user?.email])

  const applySmartPayloadToPortal = useCallback(async (payload) => {
    if (!payload || applyingFromSmartRef.current) return
    applyingFromSmartRef.current = true
    setSyncing(true)
    setSyncStatus('جارٍ حفظ تعديلات حلم سمارت داخل حلم بروتال…')
    try {
      const clients = (payload.clients || []).map(smartClientToPortal)
      const cases = (payload.cases || []).map(smartCaseToPortal)
      const invoices = (payload.invoices || []).map(smartInvoiceToPortal)
      const expenses = (payload.expenses || []).map(smartExpenseToPortal)
      const tasks = (payload.reminders || []).map(smartReminderToTask)

      const [c1, c2, c3, c4, c5] = await Promise.all([
        upsertPortalRows('Client', clients, 250),
        upsertPortalRows('Case', cases, 250),
        upsertPortalRows('Invoice', invoices, 250),
        upsertPortalRows('Expense', expenses, 200),
        upsertPortalRows('Task', tasks, 200),
      ])

      setSyncStatus(`تم حفظ تعديلات حلم سمارت داخل حلم بروتال: ${c1} موكل، ${c2} قضية، ${c3} فاتورة، ${c4} مصروف، ${c5} تذكير.`)
      setTimeout(async () => {
        const next = await buildPortalSnapshot()
        latestPayloadRef.current = next
      }, 1200)
    } catch (error) {
      setSyncStatus(error?.message || 'فشل حفظ تعديلات حلم سمارت داخل حلم بروتال.')
    } finally {
      applyingFromSmartRef.current = false
      setSyncing(false)
    }
  }, [buildPortalSnapshot])

  useEffect(() => {
    syncPortalData()
  }, [syncPortalData, frameKey])

  useEffect(() => {
    const onMessage = (event) => {
      const data = event?.data
      if (!data) return

      if (data.type === SMART_CHANGED_MESSAGE_TYPE) {
        applySmartPayloadToPortal(data.payload)
        return
      }

      if (data.type !== ACK_MESSAGE_TYPE) return
      if (data.message === 'bridge-ready') {
        sendPayloadToFrame()
        return
      }
      if (data.status === 'ok') setSyncStatus('تم استقبال بيانات حلم بروتال داخل حلم سمارت بنجاح.')
      if (data.status === 'error') setSyncStatus(data.message || 'فشل استقبال البيانات داخل حلم سمارت.')
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [sendPayloadToFrame, applySmartPayloadToPortal])

  const reloadFrame = () => {
    setLoading(true)
    setFrameKey((value) => value + 1)
  }

  return (
    <div dir="rtl" className="-m-4 md:-m-6 min-h-screen bg-slate-950 text-white overflow-hidden">
      <div className="border-b border-white/10 bg-slate-950/95 backdrop-blur-xl px-4 md:px-6 py-3 sticky top-0 z-20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-900 flex items-center justify-center ring-1 ring-sky-300/25 shadow-[0_0_25px_rgba(56,189,248,.22)] shrink-0">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-black leading-tight truncate">حُلم سمارت — البيانات موحّدة مع البوابة</h1>
              <p className="text-[11px] md:text-xs text-white/45 leading-5 truncate">{syncStatus}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
              <ShieldCheck className="h-4 w-4" /> مزامنة ثنائية مفعّلة
            </span>
            <Button type="button" variant="outline" onClick={syncPortalData} disabled={syncing} className="h-9 gap-2 border-white/12 text-white/75 hover:bg-white/8">
              <DatabaseZap className="h-4 w-4" /> مزامنة الآن
            </Button>
            <Button type="button" variant="outline" onClick={reloadFrame} className="h-9 gap-2 border-white/12 text-white/75 hover:bg-white/8">
              <RefreshCw className="h-4 w-4" /> تحديث
            </Button>
            <a href={smartUrl} target="_blank" rel="noreferrer">
              <Button type="button" className="h-9 gap-2 bg-sky-600 hover:bg-sky-500 text-white">
                <ExternalLink className="h-4 w-4" /> فتح مستقل
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="relative h-[calc(100vh-76px)] md:h-[calc(100vh-72px)] bg-slate-950">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
            <div className="text-center space-y-4">
              <div className="h-14 w-14 mx-auto rounded-3xl border border-sky-300/20 bg-white/5 flex items-center justify-center shadow-[0_0_35px_rgba(56,189,248,.18)]">
                <RefreshCw className="h-6 w-6 text-sky-300 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">جارٍ تحميل حلم سمارت…</p>
                <p className="text-xs text-white/40 mt-1">سيتم توحيد بيانات الموكلين والقضايا والفواتير مع حلم بروتال.</p>
              </div>
            </div>
          </div>
        )}

        <iframe
          ref={frameRef}
          key={frameKey}
          title="HELM Smart Modern Embedded"
          src={smartUrl}
          className="h-full w-full border-0 bg-white"
          allow="clipboard-read; clipboard-write; fullscreen; payment; geolocation"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => {
            setLoading(false)
            setTimeout(() => sendPayloadToFrame(), 400)
          }}
        />
      </div>
    </div>
  )
}
