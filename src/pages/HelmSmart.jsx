import React, { Suspense } from 'react'
import SmartApp from '@/smart/App'
import SmartSessionProvider from '@/smart/components/SessionProvider'

const SmartFallback = () => (
  <div dir="rtl" className="min-h-[70vh] flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white/70">
    جارٍ تحميل وحدة حُلم سمارت…
  </div>
)

export default function HelmSmart() {
  return (
    <div dir="rtl" className="helm-smart-embedded -m-4 md:-m-6 min-h-screen bg-slate-50 text-slate-900">
      <Suspense fallback={<SmartFallback />}>
        <SmartSessionProvider>
          <SmartApp />
        </SmartSessionProvider>
      </Suspense>
    </div>
  )
}
