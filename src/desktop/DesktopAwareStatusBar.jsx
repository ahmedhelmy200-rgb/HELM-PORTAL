import React, { useEffect, useMemo, useState } from 'react'
import { Cloud, CloudOff, Database, RefreshCw } from 'lucide-react'
import OriginalAppStatusBar, { PageErrorState } from '../components/app/AppStatusBar.jsx'
import { base44 } from './base44DesktopClient.js'

export { PageErrorState }

const INITIAL_STATE = {
  phase: 'ready',
  online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  pending: 0,
}

function desktopStatusText(status) {
  if (!status.online || status.phase === 'offline') return 'يعمل محليًا دون إنترنت'
  if (status.phase === 'syncing') return 'جارٍ مزامنة البيانات'
  if (status.phase === 'error') return 'تعذر إكمال المزامنة'
  if (Number(status.pending || 0) > 0) return `${status.pending} عملية بانتظار المزامنة`
  return 'البيانات المحلية والسحابية متزامنة'
}

export default function DesktopAwareStatusBar(props) {
  const [status, setStatus] = useState(INITIAL_STATE)

  useEffect(() => {
    if (!base44.desktop?.enabled) return undefined

    const onStatus = (event) => {
      setStatus((current) => ({ ...current, ...(event.detail || {}) }))
    }

    window.addEventListener('helm:desktop-sync-status', onStatus)
    base44.desktop.status()
      .then((result) => {
        setStatus((current) => ({
          ...current,
          pending: result?.pendingOperations || 0,
          databasePath: result?.databasePath,
        }))
      })
      .catch(() => {})

    return () => window.removeEventListener('helm:desktop-sync-status', onStatus)
  }, [])

  const appearance = useMemo(() => {
    if (!status.online || status.phase === 'offline') {
      return { icon: CloudOff, className: 'border-amber-300 bg-amber-50 text-amber-900' }
    }
    if (status.phase === 'syncing') {
      return { icon: RefreshCw, className: 'border-blue-300 bg-blue-50 text-blue-900' }
    }
    if (status.phase === 'error') {
      return { icon: CloudOff, className: 'border-red-300 bg-red-50 text-red-900' }
    }
    return { icon: Cloud, className: 'border-emerald-300 bg-emerald-50 text-emerald-900' }
  }, [status])

  const Icon = appearance.icon

  return (
    <>
      <OriginalAppStatusBar {...props} />
      {base44.desktop?.enabled && (
        <button
          type="button"
          onClick={() => base44.desktop.syncNow().catch(() => {})}
          title={status.databasePath || 'قاعدة بيانات HELM المحلية'}
          className={`fixed bottom-4 left-4 z-[90] flex max-w-[340px] items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black shadow-lg backdrop-blur transition hover:-translate-y-0.5 ${appearance.className}`}
        >
          <Database className="h-4 w-4 shrink-0" />
          <span className="truncate">{desktopStatusText(status)}</span>
          <Icon className={`h-4 w-4 shrink-0 ${status.phase === 'syncing' ? 'animate-spin' : ''}`} />
        </button>
      )}
    </>
  )
}
