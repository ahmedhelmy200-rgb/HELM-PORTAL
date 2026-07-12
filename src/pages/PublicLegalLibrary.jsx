import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Search, ShieldCheck, Sparkles, LogIn, Scale } from 'lucide-react'
import { PUBLIC_LEGAL_LIBRARY, PUBLIC_LEGAL_NOTICE } from '@/lib/publicLegalLibrary'
import OfficeBrandMark from '@/components/helm/OfficeBrandMark'
import { useAuth } from '@/lib/AuthContext'

export default function PublicLegalLibrary() {
  const { appPublicSettings } = useAuth()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('الكل')

  const officeName = appPublicSettings?.office_name || 'أحمد حلمي للاستشارات القانونية'
  const officeLogo = appPublicSettings?.logo_url || null
  const categories = useMemo(() => ['الكل', ...new Set(PUBLIC_LEGAL_LIBRARY.map(item => item.category))], [])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PUBLIC_LEGAL_LIBRARY.filter(item => {
      const categoryMatch = category === 'الكل' || item.category === category
      const text = `${item.title} ${item.category} ${item.summary} ${item.points.join(' ')}`.toLowerCase()
      return categoryMatch && (!q || text.includes(q))
    })
  }, [query, category])

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 15% 10%, rgba(59,130,246,.24), transparent 32%), radial-gradient(circle at 85% 20%, rgba(6,182,212,.14), transparent 30%), radial-gradient(circle at 50% 100%, rgba(16,185,129,.08), transparent 34%)' }} />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8">
        <header className="mb-7 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[.045] p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-5">
          <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="المكتبة القانونية العامة" compact />
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[.055] px-4 text-xs font-black text-blue-100 transition-colors hover:bg-white/[.09]">
              <ArrowRight className="h-4 w-4" /> العودة لصفحة الدخول
            </Link>
            <Link to="/#login" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-xs font-black text-white transition-colors hover:bg-blue-500">
              <LogIn className="h-4 w-4" /> دخول الموكلين
            </Link>
          </div>
        </header>

        <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.06] p-6 shadow-2xl shadow-blue-950/30 md:p-8">
          <div className="grid gap-7 lg:grid-cols-[1.15fr,360px] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black text-blue-200">
                <BookOpen className="h-4 w-4" /> متاحة للجميع بدون تسجيل دخول
              </div>
              <h1 className="text-3xl font-black leading-tight md:text-5xl">مكتبة قانونية عامة تجيب العميل قبل أن يسأل</h1>
              <p className="max-w-3xl text-sm leading-8 text-white/62 md:text-base">{PUBLIC_LEGAL_NOTICE}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['إجراءات مدنية', 'جزائي', 'عمالي', 'تجاري', 'عقود', 'تنفيذ'].map(item => (
                  <span key={item} className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-[11px] font-bold text-white/65">{item}</span>
                ))}
              </div>
            </div>
            <div className="rounded-[1.7rem] border border-emerald-300/15 bg-emerald-400/10 p-5">
              <div className="flex items-center gap-3 text-emerald-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/14"><ShieldCheck className="h-6 w-6" /></div>
                <div>
                  <p className="font-black">قسم عام آمن</p>
                  <p className="mt-1 text-xs text-white/45">لا يفتح بيانات العملاء أو القضايا أو الفواتير.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-2xl bg-white/[.045] p-3"><p className="text-xl font-black">{PUBLIC_LEGAL_LIBRARY.length}</p><p className="text-[10px] text-white/42">موضوع</p></div>
                <div className="rounded-2xl bg-white/[.045] p-3"><p className="text-xl font-black">{categories.length - 1}</p><p className="text-[10px] text-white/42">تصنيف</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/[.04] p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في المكتبة القانونية العامة..." className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900/80 pr-11 pl-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-300/50" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} className={`h-12 whitespace-nowrap rounded-2xl border px-4 text-xs font-black transition-all ${category === cat ? 'border-blue-400 bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'border-white/10 bg-white/[.04] text-white/55 hover:bg-white/[.08] hover:text-white'}`}>{cat}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-10 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(item => (
            <article key={item.id} className="group rounded-[1.75rem] border border-white/10 bg-white/[.055] p-5 transition-all hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-white/[.075]">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <span className="mb-3 inline-flex rounded-full border border-blue-300/15 bg-blue-400/10 px-3 py-1 text-[11px] font-bold text-blue-200">{item.category}</span>
                  <h2 className="text-lg font-black leading-7">{item.title}</h2>
                </div>
                <div className="mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-200"><Scale className="h-5 w-5" /></div>
              </div>
              <p className="mb-4 text-sm leading-7 text-white/58">{item.summary}</p>
              <div className="space-y-2">
                {item.points.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs leading-6 text-white/55">
                    <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-blue-300/65" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
          {filtered.length === 0 && <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/[.03] p-10 text-center text-white/50 md:col-span-2 xl:col-span-3">لا توجد نتيجة مطابقة للبحث الحالي.</div>}
        </section>
      </div>
    </div>
  )
}
