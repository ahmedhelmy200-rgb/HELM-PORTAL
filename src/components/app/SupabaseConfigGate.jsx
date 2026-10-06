import React, { useState } from 'react'
import {
  hasSupabaseConfig,
  supabaseConfig,
  saveDesktopSupabaseConfig,
} from '@/integrations/supabase/client'

export default function SupabaseConfigGate({ children }) {
  const [url, setUrl] = useState(supabaseConfig.url || '')
  const [anonKey, setAnonKey] = useState('')
  const [error, setError] = useState('')

  if (hasSupabaseConfig) return children

  const saveDesktopConfig = (event) => {
    event.preventDefault()
    try {
      setError('')
      saveDesktopSupabaseConfig(url, anonKey)
      window.location.reload()
    } catch (saveError) {
      setError(saveError?.message || 'تعذر حفظ إعدادات Supabase.')
    }
  }

  return (
    <main dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-5">
      <section className="w-full max-w-2xl rounded-3xl border border-red-400/25 bg-white/[.06] p-6 md:p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-sm font-bold text-red-200 mb-5">
          إعدادات Supabase غير مكتملة
        </div>
        <h1 className="text-2xl md:text-3xl font-black mb-3">تعذر تشغيل HELM Portal</h1>
        <p className="text-slate-300 leading-8 mb-5">
          النظام يحتاج إلى عنوان مشروع Supabase والمفتاح العام Anon قبل تسجيل الدخول أو تحميل بيانات المكتب.
        </p>

        <div className="grid gap-3 text-sm mb-5">
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

        {supabaseConfig.isDesktopRuntime ? (
          <form onSubmit={saveDesktopConfig} className="space-y-4 rounded-2xl border border-blue-400/20 bg-blue-500/[.06] p-5">
            <div>
              <h2 className="font-black text-blue-100 mb-1">إعداد نسخة Windows لأول مرة</h2>
              <p className="text-xs leading-6 text-slate-400">
                أدخل القيم العامة من Supabase Dashboard → Project Settings → API. استخدم Anon/Public key فقط، ولا تستخدم Service Role key.
              </p>
            </div>
            <label className="block">
              <span className="text-sm font-bold text-slate-200">Supabase URL</span>
              <input
                dir="ltr"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://project-ref.supabase.co"
                className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 py-3 text-left text-white outline-none focus:border-blue-400"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-200">Anon / Public key</span>
              <input
                dir="ltr"
                value={anonKey}
                onChange={(event) => setAnonKey(event.target.value)}
                placeholder="eyJ..."
                className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 py-3 text-left text-white outline-none focus:border-blue-400"
                required
              />
            </label>
            {error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
            <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 font-black text-white hover:bg-blue-500">
              حفظ وتشغيل HELM Portal
            </button>
          </form>
        ) : (
          <p className="mt-5 text-xs leading-6 text-slate-400">
            أضف القيم في Vercel Environment Variables أو في ملف .env.local محليًا، ثم أعد نشر/تشغيل التطبيق.
          </p>
        )}
      </section>
    </main>
  )
}
