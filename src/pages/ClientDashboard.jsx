import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useAuth } from '@/lib/AuthContext'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import { PageErrorState } from '@/components/app/AppStatusBar'
import ClientPortalDashboard from '@/components/client/ClientPortalDashboard'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({ cases: [], invoices: [], documents: [], notifications: [], sessions: [], officeSettings: null })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadAll = useCallback(async () => {
    if (!user?.email) return
    setLoading(true)
    setLoadError('')
    try {
      const [cases, invoices, documents, notifications, sessions, settings] = await Promise.all([
        base44.entities.Case.list('-created_date', 1000),
        base44.entities.Invoice.list('-created_date', 1000),
        base44.entities.Document.list('-created_date', 1000),
        base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 200),
        base44.entities.Session.list('-session_date', 300),
        base44.entities.OfficeSettings.list(),
      ])
      setData({
        cases: cases || [],
        invoices: invoices || [],
        documents: documents || [],
        notifications: notifications || [],
        sessions: sessions || [],
        officeSettings: settings?.[0] || null,
      })
    } catch (error) {
      setLoadError(error?.message || 'تعذر تحميل ملف الموكل الكامل.')
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  useEffect(() => { loadAll() }, [loadAll])
  usePageRefresh(loadAll, ['cases', 'invoices', 'documents', 'notifications', 'sessions', 'office_settings'])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور'
  }, [])

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-52 rounded-[30px] bg-muted/50" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-28 rounded-3xl bg-muted/50" />)}</div>
      <div className="grid gap-5 xl:grid-cols-2"><div className="h-96 rounded-3xl bg-muted/50" /><div className="h-96 rounded-3xl bg-muted/50" /></div>
    </div>
  )

  if (loadError) return <PageErrorState message={loadError} onRetry={loadAll} />

  return <ClientPortalDashboard user={user} data={data} greeting={greeting} />
}
