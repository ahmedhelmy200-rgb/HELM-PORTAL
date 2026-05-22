import React, { useState } from 'react'
import { Building2, ArrowLeft } from 'lucide-react'

export default function BadayatPortalShortcut() {
  const [armed, setArmed] = useState(false)
  const activate = () => {
    sessionStorage.setItem('helm_post_login_target', 'BadayatAlKhair')
    setArmed(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <div className="fixed left-4 bottom-4 z-[70] max-w-[330px] rounded-3xl border border-amber-300/25 bg-slate-950/80 p-4 shadow-2xl shadow-amber-900/20 backdrop-blur-2xl" dir="rtl">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-400 to-slate-900 flex items-center justify-center"><Building2 className="h-6 w-6 text-white" /></div>
        <div><p className="text-sm font-black text-white">بداية الخير على HELM Portal</p><p className="mt-1 text-[11px] leading-5 text-white/50">اختصار لقسم بداية الخير بعد اعتماد المستخدم.</p></div>
      </div>
      <button onClick={activate} className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${armed ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'}`}>
        {armed ? 'تم تحديد بداية الخير' : 'فتح بداية الخير'} <ArrowLeft className="h-4 w-4" />
      </button>
    </div>
  )
}
