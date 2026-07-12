import React from 'react'
import PublicEntry from './PublicEntry'
import OfficeBrandMark from '@/components/helm/OfficeBrandMark'
import { useAuth } from '@/lib/AuthContext'

export default function PublicEntryWithLogo() {
  const { appPublicSettings } = useAuth()
  return (
    <>
      <div className="pointer-events-none fixed right-4 top-[76px] z-[60] hidden lg:block">
        <div className="rounded-3xl border border-white/10 bg-slate-950/48 px-3 py-2 shadow-2xl shadow-blue-900/25 backdrop-blur-2xl">
          <OfficeBrandMark
            logoUrl={appPublicSettings?.logo_url || null}
            officeName={appPublicSettings?.office_name || 'أحمد حلمي للاستشارات القانونية'}
            subtitle="الشعار الرسمي للمكتب"
            compact
          />
        </div>
      </div>
      <PublicEntry />
    </>
  )
}
