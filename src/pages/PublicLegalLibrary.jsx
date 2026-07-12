import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Search, ShieldCheck, LogIn, Scale, FileText, Gavel, Landmark, FolderArchive, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import { PUBLIC_LEGAL_LIBRARY, PUBLIC_LEGAL_NOTICE } from '@/lib/publicLegalLibrary'
import OfficeBrandMark from '@/components/helm/OfficeBrandMark'
import { useAuth } from '@/lib/AuthContext'

const CATEGORY_ICONS = [BookOpen, Gavel, FileText, Landmark, FolderArchive, ShieldCheck]

function LibraryCard({ item, index }) {
  const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length]
  return (
    <article className="group rounded-[2rem] border border-white/10 bg-white/[.055] p-5 shadow-xl shadow-slate-950/20 transition-all hover:-translate-y-1 hover:border-amber-200/25 hover:bg-white/[.08]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1 text-[11px] font-black text-amber-100">{item.category}</span>
          <h2 className="mt-3 text-lg font-black leading-7 text-white">{item.title}</h2>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200/15 bg-blue-300/10 text-blue-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mb-4 text-sm leading-7 text-white/58">{item.summary}</p>
      <div className="space-y-2.5">
        {item.points.map((point, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs leading-6 text-white/58">
            <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-200/80" />
            <span>{point}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

function StatBox({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[.055] p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-amber-100" />
      <p className="mt-2 text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-white/42">{label}</p>
    </div>
  )
}

export default function PublicLegalLibrary() {
  const { appPublicSettings } = useAuth()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('الكل')

  const officeName = appPublicSettings?.office_name || 'أحمد حلمي للاستشارات القانونية'
  const officeLogo = appPublicSettings?.logo_url || null
  const categories = useMemo(() => ['الكل', ...new Set(PUBLIC_LEGAL_LIBRARY.map(item => item.category))], [])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PUBLIC_LEGAL_LIBRARY.filter((item) => {
      const categoryMatch = category === 'الكل' || item.category === category
      const text = `${item.title} ${item.category} ${item.summary} ${item.points.join(' ')}`.toLowerCase()
      return categoryMatch && (!q || text.includes(q))
    })
  }, [query, category])

  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden bg-slate-950 text-white" style={{ background: 'radial-gradient(circle at 12% 8%, rgba(245,158,11,.16), transparent 30%), radial-gradient(circle at 88% 16%, rgba(59,130,246,.16), transparent 32%), linear-gradient(180deg,#020617,#07111f 55%,#030712)' }}>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:82px_82px] opacity-20" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="المكتبة القانونية العامة" compact />
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[.055] px-4 text-xs font-black text-white transition-colors hover:bg-white/[.09]">
              <ArrowRight className="h-4 w-4" /> العودة لصفحة الدخول
            </Link>
            <Link to="/" className="hidden h-11 items-center gap-2 rounded-2xl bg-amber-300 px-4 text-xs font-black text-slate-950 sm:inline-flex">
              <LogIn className="h-4 w-4" /> دخول الموكلين
            </Link>
          </div>
        </header>

        <section className="mb-6 overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/[.06] shadow-2xl shadow-slate-950/35">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr,340px] md:p-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/18 bg-amber-200/10 px-3 py-1.5 text-xs font-black text-amber-100">
                <Sparkles className="h-4 w-4" /> معرفة قانونية مختصرة قبل فتح الملف
              </div>
              <h1 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                افهم نوع ملفك، المستندات المطلوبة، والمسار الأقرب قبل بدء الإجراء.
              </h1>
              <p className="max-w-3xl text-sm leading-8 text-white/60 md:text-base">{PUBLIC_LEGAL_NOTICE}</p>
              <div className="flex flex-wrap gap-2">
                {['لا تفتح بيانات الموكلين', 'معلومات عامة', 'تساعد في تجهيز المستندات', 'مناسبة قبل الاستشارة'].map((text) => (
                  <span key={text} className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1.5 text-[11px] font-bold text-white/62">{text}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
              <StatBox icon={BookOpen} value={PUBLIC_LEGAL_LIBRARY.length} label="موضوع قانوني" />
              <StatBox icon={Scale} value={categories.length - 1} label="تصنيف عملي" />
              <StatBox icon={ShieldCheck} value="آمن" label="بدون بيانات خاصة" />
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[.045] p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث: إيجارات، عمالي، تنفيذ، استئناف، عقود، أدلة..."
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 pr-11 pl-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-200/45"
              />
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:max-w-[55%] lg:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`h-12 whitespace-nowrap rounded-2xl border px-4 text-xs font-black transition-all ${category === cat ? 'border-amber-200 bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/20' : 'border-white/10 bg-white/[.045] text-white/58 hover:bg-white/[.08] hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => <LibraryCard key={item.id} item={item} index={index} />)}
          {filtered.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[.035] p-10 text-center md:col-span-2 xl:col-span-3">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-100/80" />
              <p className="mt-3 font-black text-white">لا توجد نتيجة مطابقة</p>
              <p className="mt-2 text-sm text-white/48">جرّب كلمة أبسط مثل: عمالي، إيجار، تنفيذ، عقد، استئناف.</p>
            </div>
          )}
        </section>

        <section className="mb-8 rounded-[2rem] border border-amber-200/15 bg-amber-200/10 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">هل تريد متابعة ملفك داخل البوابة؟</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">المكتبة للتوعية العامة فقط. فتح ملف فعلي يحتاج تسجيل دخول وصلاحية من المكتب حتى تُحفظ بياناتك ومرفقاتك داخل بوابة آمنة.</p>
            </div>
            <Link to="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950">
              <LogIn className="h-4 w-4" /> دخول أو إنشاء حساب
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
