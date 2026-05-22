import React, { useState } from 'react'
import { CheckCircle2, MessageSquareText, Send, Building2, Phone, Mail, UserRound, FileText } from 'lucide-react'
import { submitBadayatFeedback } from '@/lib/badayatFeedbackStore'

const branches = ['بداية الخير دبي - الإدارة الأم', 'معرض سيارات بداية الخير 1', 'معرض سيارات بداية الخير 2', 'قضايا فرعية', 'غير محدد']

const emptyForm = { type: 'اقتراح', name: '', phone: '', email: '', branch: 'غير محدد', subject: '', message: '' }

export default function BadayatFeedback() {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await submitBadayatFeedback(form)
      setDone(true)
      setForm(emptyForm)
    } catch (err) {
      setError(err?.message || 'تعذر إرسال الطلب، حاول مرة أخرى.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,.22),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(15,23,42,.35),transparent_30%),linear-gradient(180deg,#020617,#0f172a)] px-4 py-8 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-[2rem] border border-amber-300/25 bg-white/[.06] p-5 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-amber-300/35 bg-white p-1">
                <img src="/badayat-logo.svg" alt="بداية الخير" className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div>
                <p className="text-xs font-black text-amber-300">BADAYAT AL KHAIR</p>
                <h1 className="mt-1 text-2xl font-black">الشكاوى والمقترحات</h1>
                <p className="mt-1 text-xs leading-6 text-white/55">هذه الصفحة عامة ويمكن الوصول إليها مباشرة عبر مسح الباركود.</p>
              </div>
            </div>
            <MessageSquareText className="hidden h-10 w-10 text-amber-300 sm:block" />
          </div>
        </div>

        {done && (
          <div className="mb-4 rounded-3xl border border-emerald-300/25 bg-emerald-500/12 p-4 text-emerald-100">
            <div className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" /> تم استلام رسالتك بنجاح</div>
            <p className="mt-2 text-sm leading-7 text-emerald-100/75">شكراً لتواصلكم مع شركة بداية الخير. سيتم مراجعة الشكوى أو الاقتراح من الإدارة المختصة.</p>
            <button onClick={() => setDone(false)} className="mt-3 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950">إرسال طلب آخر</button>
          </div>
        )}

        {!done && (
          <form onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-2xl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-white/55"><FileText className="h-3.5 w-3.5" /> نوع الطلب</span>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 outline-none focus:border-amber-300">
                  <option>اقتراح</option>
                  <option>شكوى</option>
                  <option>ملاحظة عامة</option>
                  <option>بلاغ داخلي</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-white/55"><Building2 className="h-3.5 w-3.5" /> الفرع</span>
                <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 outline-none focus:border-amber-300">
                  {branches.map((b) => <option key={b}>{b}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-white/55"><UserRound className="h-3.5 w-3.5" /> الاسم</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اختياري" className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 outline-none focus:border-amber-300" />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-white/55"><Phone className="h-3.5 w-3.5" /> رقم الهاتف</span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="اختياري للمتابعة" className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 outline-none focus:border-amber-300" />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-white/55"><Mail className="h-3.5 w-3.5" /> البريد الإلكتروني</span>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="اختياري" className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 outline-none focus:border-amber-300" />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 text-xs font-bold text-white/55">عنوان مختصر</span>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="مثال: اقتراح لتحسين خدمة العملاء" className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 outline-none focus:border-amber-300" />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 text-xs font-bold text-white/55">نص الشكوى أو الاقتراح *</span>
                <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="اكتب التفاصيل هنا..." className="min-h-[170px] w-full resize-y rounded-2xl border border-white/10 bg-slate-900 p-3 leading-8 outline-none focus:border-amber-300" />
              </label>
            </div>

            {error && <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}

            <button disabled={saving || !form.message.trim()} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-50">
              {saving ? 'جارٍ الإرسال...' : 'إرسال'} <Send className="h-4 w-4" />
            </button>

            <p className="mt-4 text-center text-[11px] leading-6 text-white/38">يمكن إرسال الطلب دون تسجيل دخول. بيانات الاتصال اختيارية وتستخدم فقط للمتابعة.</p>
          </form>
        )}
      </section>
    </main>
  )
}
