import React, { useMemo, useState } from 'react'
import { ExternalLink, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'

const DEFAULT_HELM_SMART_URL = 'https://helm-smart.vercel.app/app?embedded=1&source=portal'

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

export default function HelmSmart() {
  const { user } = useAuth()
  const smartUrl = useMemo(() => buildSmartUrl(user), [user?.role])
  const [frameKey, setFrameKey] = useState(0)
  const [loading, setLoading] = useState(true)

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
              <h1 className="text-base md:text-lg font-black leading-tight truncate">حُلم سمارت — النسخة الحديثة</h1>
              <p className="text-[11px] md:text-xs text-white/45 leading-5 truncate">
                تم دمج النسخة المنشورة الحديثة داخل حلم بروتال بدون تعديل على مشروع HELM Smart الأصلي.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
              <ShieldCheck className="h-4 w-4" /> دمج آمن
            </span>
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
                <p className="text-sm font-bold text-white">جارٍ تحميل النسخة الحديثة من حلم سمارت…</p>
                <p className="text-xs text-white/40 mt-1">إذا تأخر التحميل استخدم زر فتح مستقل.</p>
              </div>
            </div>
          </div>
        )}

        <iframe
          key={frameKey}
          title="HELM Smart Modern Embedded"
          src={smartUrl}
          className="h-full w-full border-0 bg-white"
          allow="clipboard-read; clipboard-write; fullscreen; payment; geolocation"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  )
}
