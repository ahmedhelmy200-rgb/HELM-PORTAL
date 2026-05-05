import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export default function PasswordReset() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 6) return setError('كلمة المرور يجب ألا تقل عن 6 أحرف.')
    if (password !== confirm) return setError('تأكيد كلمة المرور غير مطابق.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return setError(error.message || 'تعذر تحديث كلمة المرور.')
    setMessage('تم تحديث كلمة المرور بنجاح. يمكنك الدخول الآن بالبريد وكلمة المرور الجديدة.')
    setTimeout(() => navigate('/'), 1500)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,.20), transparent 35%), linear-gradient(180deg,#03070f,#060d1f)' }} />
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.06] p-6 shadow-2xl shadow-blue-950/30">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-blue-200 hover:text-white mb-6">
          <ArrowRight className="h-4 w-4" />
          العودة
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl bg-blue-500/20 border border-blue-300/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-blue-200" />
          </div>
          <div>
            <h1 className="text-xl font-black">تعيين كلمة مرور جديدة</h1>
            <p className="text-xs text-white/40 mt-1">أدخل كلمة مرور قوية لحسابك</p>
          </div>
        </div>
        {error && <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-xs leading-6 text-red-100">{error}</div>}
        {message && <div className="mb-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs leading-6 text-emerald-100">{message}</div>}
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="block mb-1.5 text-[11px] font-bold text-white/45">كلمة المرور الجديدة</span>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 rounded-2xl bg-slate-950/55 border border-white/10 pr-11 pl-4 text-sm text-white outline-none focus:border-blue-300/50" />
            </div>
          </label>
          <label className="block">
            <span className="block mb-1.5 text-[11px] font-bold text-white/45">تأكيد كلمة المرور</span>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full h-12 rounded-2xl bg-slate-950/55 border border-white/10 pr-11 pl-4 text-sm text-white outline-none focus:border-blue-300/50" />
            </div>
          </label>
          <button disabled={loading} className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-colors font-black text-sm text-white disabled:opacity-60">
            {loading ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  )
}
