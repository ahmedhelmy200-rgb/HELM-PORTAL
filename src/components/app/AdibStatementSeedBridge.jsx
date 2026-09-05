import { useEffect } from 'react'
import { seedAdibStatements2026 } from '@/lib/adibStatementSeed2026'

export default function AdibStatementSeedBridge({ user }) {
  useEffect(() => {
    let active = true
    const role = String(user?.role || '')
    if (!role) return undefined

    seedAdibStatements2026({ role })
      .then((result) => {
        if (!active || !result || result.skipped || !result.changed) return
        console.info('[HELM][ADIB] Bank statements synchronized', result)
      })
      .catch((error) => {
        if (!active) return
        console.error('[HELM][ADIB] Automatic bank-statement sync failed:', error)
      })

    return () => { active = false }
  }, [user?.email, user?.role])

  return null
}
