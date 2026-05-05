import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Search, Scale, ShieldCheck } from 'lucide-react'
import { PUBLIC_LEGAL_LIBRARY, PUBLIC_LEGAL_NOTICE } from '@/lib/publicLegalLibrary'
import { appParams } from '@/lib/app-params'

export default function PublicLegalLibrary() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('الكل')

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
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 15% 10%, rgba(59,130,246,.20), transparent 32%), radial-gradient(circle at 85% 20%, rgba(6,182,212,.12), transparent 30%)' }} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <header className="flex items-center justify-between gap-4 mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors">
            <ArrowRight className="h-4 w-4" />
            العودة لصفحة الدخول
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-300/20 flex items-center justify-center">
              <Scale className="h-5 w-5 text-blue-200" />
            </div>
            <div className="text-right">
              <p className="font-black leading-none">{appParams.appName}</p>
              <p className="text-[11px] text-white/40 mt-1">المكتبة القانونية العامة</p>
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-white/10 bg-white/[.06] p-6 md:p-8 mb-6 shadow-2xl shadow-blue-950/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-400/10 border border-blue-300/20 text-blue-200 text-xs font-bold">
                <BookOpen className="h-4 w-4" />
                متاحة للجميع بدون تسجيل دخول
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">مكتبة قانونية عامة مختصرة</h1>
              <p className="text-white/60 leading-8 text-sm md:text-base">{PUBLIC_LEGAL_NOTICE}</p>
            </div>
            <div className="rounded-3xl border border-emerald-300/15 bg-emerald-400/10 p-4 min-w-[240px]">
              <div className="flex items-center gap-2 text-emerald-200 font-bold text-sm">
                <ShieldCheck className="h-5 w-5" />
                وصول عام آمن
              </div>
              <p className="text-xs text-white/45 leading-6 mt-2">لا يتم فتح بيانات العملاء أو القضايا أو الفواتير في هذا القسم.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[.04] p-4 md:p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في المكتبة القانونية العامة..."
                className="w-full h-12 rounded-2xl bg-slate-900/80 border border-white/10 pr-11 pl-4 text-sm outline-none focus:border-blue-300/50 text-white placeholder:text-white/30"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`h-12 px-4 rounded-2xl text-xs font-black whitespace-nowrap border transition-all ${category === cat ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-white/[.04] border-white/10 text-white/55 hover:text-white hover:bg-white/[.08]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4 pb-10">
          {filtered.map(item => (
            <article key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/[.055] p-5 hover:bg-white/[.075] transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="inline-flex px-3 py-1 rounded-full bg-blue-400/10 border border-blue-300/15 text-blue-200 text-[11px] font-bold mb-3">{item.category}</span>
                  <h2 className="font-black text-lg leading-7">{item.title}</h2>
                </div>
                <BookOpen className="h-5 w-5 text-blue-200/70 shrink-0 mt-2" />
              </div>
              <p className="text-sm text-white/58 leading-7 mb-4">{item.summary}</p>
              <div className="space-y-2">
                {item.points.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-white/55 leading-6">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-300 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="md:col-span-2 rounded-[1.75rem] border border-dashed border-white/15 bg-white/[.03] p-10 text-center text-white/50">
              لا توجد نتيجة مطابقة للبحث الحالي.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
