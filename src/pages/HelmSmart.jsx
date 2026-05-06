import React, { Suspense } from 'react'
import SmartApp from '@/smart/App'
import { useAuth } from '@/lib/AuthContext'
import '@/smart/index.css'

const SmartFallback = () => (
  <div dir="rtl" className="min-h-[70vh] flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white/70">
    جارٍ تحميل وحدة حُلم سمارت…
  </div>
)

export default function HelmSmart() {
  const { user } = useAuth()

  return (
    <div dir="rtl" className="helm-smart-embedded -m-4 md:-m-6 min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Suspense fallback={<SmartFallback />}>
        <SmartApp embedded portalUser={user} />
      </Suspense>
    </div>
  )
}
