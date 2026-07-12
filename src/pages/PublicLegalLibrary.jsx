import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Search, ShieldCheck, LogIn, FileText, Gavel, Landmark, FolderArchive, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { PUBLIC_LEGAL_LIBRARY, PUBLIC_LEGAL_NOTICE } from '@/lib/publicLegalLibrary'
import OfficeBrandMark from '@/components/helm/OfficeBrandMark'
import { useAuth } from '@/lib/AuthContext'

const CATEGORY_ICONS = [BookOpen, Gavel, FileText, Landmark, FolderArchive, ShieldCheck]

function LibraryCard({ item, index }) {
  const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length]
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-950 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-slate-950">{item.category}</span>
          <h2 className="mt-3 text-xl font-black leading-8 text-slate-950">{item.title}</h2>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mb-4 text-sm font-medium leading-8 text-slate-700">{item.summary}</p>
      <div className="space-y-2.5">
        {item.points.map((point, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm font-medium leading-7 text-slate-700">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
            <span>{point}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

function StatBox({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <Icon className="mx-auto h-6 w-6 text-slate-950" />
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-black text-slate-600">{label}</p>
    </div>
  )
}

export default function PublicLegalLibrary() {
  const { appPublicSettings } = useAuth()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('الكل')

  const officeName = appPublicSettings?.office_name || 'أحمد حلمي للاستشارات القانونية'
  const officeLogo = appPublicSettings?.logo_url || null
  const categories = useMemo(() => ['الكل', ...new Set(PUBLIC_LEGAL_LIBRARY.map((item) => item.category))], [])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PUBLIC_LEGAL_LIBRARY.filter((item) => {
      const categoryMatch = category === 'الكل' || item.category === category
      const text = `${item.title} ${item.category} ${item.summary} ${item.points.join(' ')}`.toLowerCase()
      return categoryMatch && (!q || text.includes(q))
    })
  }, [query, category])

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-950">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="المكتبة القانونية العامة" compact />
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/20 px-4 text-sm font-black text-white hover:bg-white/10">
              <ArrowRight className="h-4 w-4" /> العودة للدخول
            </Link>
            <Link to="/" className="hidden h-11 items-center gap-2 rounded-2xl bg-amber-300 px-4 text-sm font-black text-slate-950 sm:inline-flex">
              <LogIn className="h-4 w-4" /> دخول البوابة
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <section className="rounded-[32px] bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
            <div>
              <div className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-slate-950">مكتبة عامة قبل فتح الملف</div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-slate-950 md:text-5xl">
                اعرف نوع ملفك، والمستندات المطلوبة، والخطوة الأقرب قبل بدء الإجراء.
              </h1>
              <p className="mt-5 max-w-4xl text-base font-medium leading-9 text-slate-700">{PUBLIC_LEGAL_NOTICE}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['معلومات عامة', 'لا تعرض بيانات الموكلين', 'تساعد في تجهيز المستندات', 'مناسبة قبل الاستشارة'].map((text) => (
                  <span key={text} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-700">{text}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              <StatBox icon={BookOpen} value={PUBLIC_LEGAL_LIBRARY.length} label="موضوع" />
              <StatBox icon={Gavel} value={categories.length - 1} label="تصنيف" />
              <StatBox icon={ShieldCheck} value="آمن" label="عام" />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث: إيجارات، عمالي، تنفيذ، استئناف، عقود، أدلة..."
                className="h-13 w-full rounded-2xl border border-slate-300 bg-white py-3 pr-12 pl-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950"
              />
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:max-w-[54%] lg:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`h-12 whitespace-nowrap rounded-2xl border px-4 text-sm font-black transition ${category === cat ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => <LibraryCard key={item.id} item={item} index={index} />)}
          {filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center md:col-span-2 xl:col-span-3">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-700" />
              <p className="mt-4 text-xl font-black text-slate-950">لا توجد نتيجة مطابقة</p>
              <p className="mt-2 text-base font-medium text-slate-700">جرّب كلمة أبسط مثل: عمالي، إيجار، تنفيذ، عقد، استئناف.</p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[28px] bg-slate-950 p-6 text-white md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">هل تريد متابعة ملفك داخل البوابة؟</h2>
              <p className="mt-2 max-w-3xl text-base font-medium leading-8 text-slate-300">المكتبة للتوعية العامة فقط. فتح ملف فعلي يحتاج تسجيل دخول وصلاحية من المكتب حتى تحفظ بياناتك ومرفقاتك داخل بوابة آمنة.</p>
            </div>
            <Link to="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 text-sm font-black text-slate-950">
              <LogIn className="h-4 w-4" /> دخول أو إنشاء حساب
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
