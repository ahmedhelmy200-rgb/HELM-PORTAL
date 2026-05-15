import React from 'react'
import { hasSupabaseConfig, supabaseConfig } from '@/integrations/supabase/client'

export default function SupabaseConfigGate({ children }) {
  if (hasSupabaseConfig) return children

  return (
    <main dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-5">
      <section className="w-full max-w-2xl rounded-3xl border border-red-400/25 bg-white/[.06] p-6 md:p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-sm font-bold text-red-200 mb-5">
          إعدادات Supabase غير مكتملة
        </div>
        <h1 className="text-2xl md:text-3xl font-black mb-3">تعذر تشغيل HELM Portal</h1>
        <p className="text-slate-300 leading-8 mb-5">
          النظام يحتاج إلى إعداد متغيرات Supabase قبل تسجيل الدخول أو تحميل بيانات المكتب. هذا الفحص يمنع ظهور أخطاء مضللة أو تشغيل التطبيق على إعدادات وهمية.
        </p>
        <div className="grid gap-3 text-sm">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="font-black text-slate-100">VITE_SUPABASE_URL</p>
            <p className={supabaseConfig.hasUrl ? 'text-emerald-300' : 'text-red-300'}>
              {supabaseConfig.hasUrl ? 'موجود وصيغته صحيحة' : 'غير موجود أو صيغته غير صحيحة'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="font-black text-slate-100">VITE_SUPABASE_ANON_KEY</p>
            <p className={supabaseConfig.hasAnonKey ? 'text-emerald-300' : 'text-red-300'}>
              {supabaseConfig.hasAnonKey ? 'موجود' : 'غير موجود'}
            </p>
          </div>
        </div>
        <p className="mt-5 text-xs leading-6 text-slate-400">
          أضف القيم في Vercel Environment Variables أو في ملف .env.local محليًا، ثم أعد تشغيل التطبيق.
        </p>
      </section>
    </main>
  )
}
