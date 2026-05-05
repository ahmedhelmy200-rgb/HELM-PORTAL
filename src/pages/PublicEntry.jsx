import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { appParams } from '@/lib/app-params'
import { PUBLIC_LEGAL_LIBRARY, PUBLIC_LEGAL_NOTICE } from '@/lib/publicLegalLibrary'
import {
  Scale, ShieldCheck, FileText, BarChart2,
  MessageCircle, LogIn, ChevronLeft, Star, Zap,
  AlertCircle, RefreshCw, CheckCircle2, Mail,
  Lock, Eye, EyeOff, UserPlus, BookOpen, Search,
} from 'lucide-react'

function ParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let raf
    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    setSize()
    window.addEventListener('resize', setSize, { passive: true })

    const points = Array.from({ length: 58 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.4 + .5,
    }))

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      points.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10) p.y = H + 10
        if (p.y > H + 10) p.y = -10
      })
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)
          if (d < 115) {
            ctx.strokeStyle = `rgba(96,165,250,${(1 - d / 115) * .13})`
            ctx.lineWidth = .5
            ctx.beginPath()
            ctx.moveTo(points[i].x, points[i].y)
            ctx.lineTo(points[j].x, points[j].y)
            ctx.stroke()
          }
        }
      }
      points.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(147,197,253,.45)'
        ctx.fill()
      })
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setSize) }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" />
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-white/8 bg-white/[.04] hover:bg-white/[.08] hover:border-white/14 transition-all group cursor-default">
      <div className="h-8 w-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/28 transition-colors">
        <Icon className="h-4 w-4 text-blue-300" />
      </div>
      <div>
        <p className="text-sm font-bold text-white/90">{title}</p>
        <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function AuthErrorCard({ error, onRetry }) {
  const isSetup = error?.type === 'oauth_error' || error?.type === 'network_error'
  const isNoReg = error?.type === 'user_not_registered'

  return (
    <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-300">
            {isNoReg ? 'حسابك غير مسجّل في النظام' : isSetup ? 'خطأ في إعداد تسجيل الدخول' : 'تعذر تسجيل الدخول'}
          </p>
          <p className="text-xs text-red-300/70 mt-1 leading-5">{error?.message}</p>
        </div>
      </div>
      {isSetup && (
        <div className="text-xs text-white/50 space-y-1.5 border-t border-white/8 pt-3">
          <p className="font-semibold text-white/70 mb-2">خطوات الحل:</p>
          {[
            'تأكد أن VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY صحيحان في ملف .env',
            'في Supabase → Authentication → URL Configuration → أضف http://localhost:5173 في Redirect URLs',
            'في Supabase → Authentication → Providers → فعّل Google وأضف Client ID و Secret عند استخدام Google',
            'للدخول المحلي بالإيميل: فعّل Email Provider من Supabase Authentication إن كان مغلقًا',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-white/15 text-[9px] flex items-center justify-center shrink-0 mt-0.5 font-bold text-white/60">{i + 1}</span>
              <span className="leading-5">{step}</span>
            </div>
          ))}
        </div>
      )}
      {isNoReg && (
        <p className="text-xs text-white/50 border-t border-white/8 pt-3">
          تواصل مع مدير المكتب لإضافة حسابك في النظام قبل محاولة الدخول.
        </p>
      )}
      <button onClick={onRetry} className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200 transition-colors">
        <RefreshCw className="h-3.5 w-3.5" /> حاول مرة أخرى
      </button>
    </div>
  )
}

export default function PublicEntry() {
  const {
    navigateToLogin,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    checkAppState,
    authError,
    isLoadingAuth,
  } = useAuth()

  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  const FEATURES = [
    { icon: Scale, title: 'إدارة القضايا', desc: 'متابعة كاملة للقضايا والجلسات' },
    { icon: BarChart2, title: 'تقارير احترافية', desc: 'إحصائيات الإيرادات والأداء' },
    { icon: MessageCircle, title: 'تواصل واتساب', desc: 'رسائل تلقائية للموكلين' },
    { icon: FileText, title: 'مستندات ذكية', desc: 'أرشفة وتصنيف فوري' },
    { icon: ShieldCheck, title: 'أمان عالي', desc: 'تشفير وصلاحيات متعددة' },
    { icon: Zap, title: 'دفع إلكتروني', desc: 'Stripe — Apple Pay — Google Pay' },
  ]

  const handleGoogleLogin = async () => {
    setNotice('')
    setGoogleLoading(true)
    await navigateToLogin()
    setTimeout(() => setGoogleLoading(false), 4000)
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setNotice('')
    setEmailLoading(true)
    const result = authMode === 'signup'
      ? await signUpWithEmail({ email: form.email, password: form.password, fullName: form.fullName })
      : await signInWithEmail(form.email, form.password)
    setEmailLoading(false)
    if (result?.ok && authMode === 'signup') {
      setNotice('تم إنشاء الحساب. إذا كانت تأكيدات البريد مفعّلة في Supabase، افتح بريدك واضغط رابط التفعيل أولًا.')
    }
  }

  const handleResetPassword = async () => {
    setNotice('')
    setEmailLoading(true)
    const result = await resetPasswordForEmail(form.email)
    setEmailLoading(false)
    if (result?.ok) setNotice('تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد المدخل إن كان مسجلًا.')
  }

  useEffect(() => {
    if (authError) {
      setGoogleLoading(false)
      setEmailLoading(false)
    }
  }, [authError])

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-x-hidden flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(37,99,235,.18), transparent 45%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,.12), transparent 45%), linear-gradient(180deg,#03070f,#060d1f 50%,#04091a)' }}
    >
      <ParticleCanvas />

      <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Scale className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-base leading-none">{appParams.appName}</p>
            <p className="text-[10px] text-blue-300/60 mt-0.5">منظومة إدارة المكتب القانوني</p>
          </div>
        </div>
        <Link to="/PublicLegalLibrary" className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/10 bg-white/[.04] text-xs font-bold text-blue-100 hover:bg-white/[.08] transition-colors">
          <BookOpen className="h-4 w-4" />
          المكتبة القانونية العامة
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center px-4 py-6 md:px-10">
        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-[1fr,420px] gap-10 md:gap-14 items-center">
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-400/20 bg-blue-400/8 text-blue-300 text-[11px] font-semibold">
                <Star className="h-3 w-3 fill-current" />
                نظام قانوني متكامل باللغة العربية
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                أدِر مكتبك
                <span className="block mt-1 bg-gradient-to-l from-blue-400 to-cyan-300 bg-clip-text text-transparent">بذكاء واحترافية</span>
              </h1>
              <p className="text-white/55 text-sm md:text-base leading-8 max-w-lg">
                منصة متكاملة لإدارة القضايا، الموكّلين، الجلسات، الفواتير والمستندات — مصممة خصيصاً لمكاتب المحاماة العربية.
              </p>
            </div>

            <div className="flex items-center gap-5 flex-wrap">
              {[{ val: '١٠٠٪', label: 'عربي' }, { val: 'آمن', label: 'SSL + Supabase' }, { val: 'محلي', label: 'Email Login' }].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-lg font-black text-white">{s.val}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
              <div className="h-7 w-px bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />)}
                <span className="text-[11px] text-white/40 mr-1">بوابة موحدة للمكتب والموكلين</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FEATURES.map((f, i) => <Feature key={i} {...f} />)}
            </div>
          </div>

          <div className="space-y-3">
            <div
              className="rounded-3xl border border-white/10 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.03))',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 0 0 1px rgba(255,255,255,.05) inset, 0 32px 72px rgba(0,0,0,.45), 0 0 80px rgba(37,99,235,.07)',
              }}
            >
              <div className="px-6 pt-6 pb-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
                    <LogIn className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-lg leading-none">تسجيل الدخول</h2>
                    <p className="text-[11px] text-white/40 mt-0.5">Google أو البريد الإلكتروني وكلمة المرور</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/[.04] p-1">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setNotice('') }}
                    className={`h-10 rounded-xl text-xs font-black transition-all ${authMode === 'login' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-white/45 hover:text-white'}`}
                  >
                    دخول
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setNotice('') }}
                    className={`h-10 rounded-xl text-xs font-black transition-all ${authMode === 'signup' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-white/45 hover:text-white'}`}
                  >
                    حساب جديد
                  </button>
                </div>

                {authError && <AuthErrorCard error={authError} onRetry={() => { setNotice(''); checkAppState?.(); }} />}
                {notice && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs leading-6 text-emerald-100">{notice}</div>}

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {authMode === 'signup' && (
                    <label className="block">
                      <span className="block mb-1.5 text-[11px] font-bold text-white/45">الاسم الكامل</span>
                      <div className="relative">
                        <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input
                          value={form.fullName}
                          onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full h-12 rounded-2xl bg-slate-950/55 border border-white/10 pr-11 pl-4 text-sm text-white outline-none focus:border-blue-300/50 placeholder:text-white/22"
                          placeholder="الاسم كما يظهر داخل النظام"
                        />
                      </div>
                    </label>
                  )}

                  <label className="block">
                    <span className="block mb-1.5 text-[11px] font-bold text-white/45">البريد الإلكتروني</span>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full h-12 rounded-2xl bg-slate-950/55 border border-white/10 pr-11 pl-4 text-sm text-white outline-none focus:border-blue-300/50 placeholder:text-white/22"
                        placeholder="name@example.com"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="block mb-1.5 text-[11px] font-bold text-white/45">كلمة المرور</span>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                        value={form.password}
                        onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full h-12 rounded-2xl bg-slate-950/55 border border-white/10 pr-11 pl-11 text-sm text-white outline-none focus:border-blue-300/50 placeholder:text-white/22"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={emailLoading || isLoadingAuth}
                    className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-colors font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {emailLoading ? <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : authMode === 'signup' ? 'إنشاء حساب بالإيميل' : 'دخول بالإيميل'}
                    {!emailLoading && <ChevronLeft className="h-4 w-4 opacity-70" />}
                  </button>
                </form>

                <button type="button" onClick={handleResetPassword} disabled={emailLoading || !form.email} className="text-[11px] text-blue-200/70 hover:text-blue-100 disabled:opacity-30">
                  نسيت كلمة المرور؟ أدخل البريد ثم اضغط هنا.
                </button>

                <div className="flex items-center gap-3 text-[10px] text-white/25">
                  <span className="h-px bg-white/10 flex-1" />
                  أو
                  <span className="h-px bg-white/10 flex-1" />
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || isLoadingAuth}
                  className="w-full h-12 rounded-2xl border border-white/10 bg-slate-900/75 hover:bg-slate-900 font-bold text-white flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {(googleLoading || isLoadingAuth) ? (
                    <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>تسجيل الدخول بـ Google</span>
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-white/28 text-center leading-5 pt-1">
                  الدخول بالإيميل يعمل محليًا بدون Google Redirect، بشرط وجود مستخدم في Supabase Auth أو إنشاء حساب جديد.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ShieldCheck, label: 'SSL 256-bit' },
                { icon: CheckCircle2, label: 'Google + Email' },
                { icon: Zap, label: 'Supabase Auth' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex flex-col items-center gap-1 p-2.5 rounded-2xl border border-white/6 bg-white/[.03] text-center">
                    <Icon className="h-4 w-4 text-blue-400/70" />
                    <p className="text-[10px] text-white/45">{item.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 px-4 md:px-10 pb-8">
        <div className="max-w-6xl mx-auto rounded-[2rem] border border-white/10 bg-white/[.045] p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-blue-200 text-xs font-bold mb-2">
                <BookOpen className="h-4 w-4" />
                معلومات قانونية عامة بدون تسجيل دخول
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">المكتبة القانونية العامة</h2>
              <p className="text-xs md:text-sm text-white/45 leading-7 mt-1 max-w-3xl">{PUBLIC_LEGAL_NOTICE}</p>
            </div>
            <Link to="/PublicLegalLibrary" className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-colors">
              <Search className="h-4 w-4" />
              تصفح المكتبة بالكامل
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {PUBLIC_LEGAL_LIBRARY.slice(0, 3).map(item => (
              <Link key={item.id} to="/PublicLegalLibrary" className="block rounded-2xl border border-white/8 bg-slate-950/35 p-4 hover:bg-slate-900/60 transition-colors">
                <span className="inline-flex px-2.5 py-1 rounded-full bg-blue-400/10 border border-blue-300/15 text-blue-200 text-[10px] font-bold mb-3">{item.category}</span>
                <h3 className="font-black text-white text-sm leading-6 mb-2">{item.title}</h3>
                <p className="text-xs text-white/45 leading-6 line-clamp-3">{item.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-3 px-5 md:px-10 border-t border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-[11px] text-white/22">{appParams.appName} © {new Date().getFullYear()}</p>
          <div className="flex items-center gap-3 text-[11px] text-white/22">
            <span>Supabase</span><span>·</span><span>React + Vite</span><span>·</span><span>Email Auth</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
