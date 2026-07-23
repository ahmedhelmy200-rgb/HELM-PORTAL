import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { useAuth } from '@/lib/AuthContext'
import { LayoutDashboard, Users, Briefcase, Receipt, FileText, Handshake } from 'lucide-react'

const DOCKS = {
  staff: [
    { page: 'Dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { page: 'Clients', label: 'الموكلون', icon: Users },
    { page: 'Cases', label: 'القضايا', icon: Briefcase },
    { page: 'Invoices', label: 'الفواتير', icon: Receipt },
  ],
  broker: [
    { page: 'Brokers', label: 'البروكر', icon: Handshake },
    { page: 'Clients', label: 'الموكلون', icon: Users },
    { page: 'Cases', label: 'القضايا', icon: Briefcase },
  ],
  client: [
    { page: 'Dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { page: 'Cases', label: 'القضايا', icon: Briefcase },
    { page: 'Invoices', label: 'الفواتير', icon: Receipt },
    { page: 'Documents', label: 'المستندات', icon: FileText },
  ],
}

export default function MobilePriorityDock() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user || user.role === 'pending_client') return null

  const roleKey = user.role === 'client' ? 'client' : user.role === 'broker' ? 'broker' : 'staff'
  const items = DOCKS[roleKey]

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .mobile-bottom-tabs { display: none !important; }
        }
      `}</style>
      <nav dir="rtl" aria-label="القائمة الرئيسية للموبايل" className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200 bg-white/98 px-2 pb-[calc(.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(15,23,42,.14)] backdrop-blur md:hidden">
        <div className={`mx-auto grid max-w-lg gap-1 ${items.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {items.map((item) => {
            const Icon = item.icon
            const target = createPageUrl(item.page)
            const active = location.pathname.toLowerCase() === target.toLowerCase() || location.pathname.toLowerCase().endsWith(`/${item.page.toLowerCase()}`)
            return (
              <Link key={item.page} to={target} className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-black transition ${active ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
