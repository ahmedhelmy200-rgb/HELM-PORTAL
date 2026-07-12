import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { appParams } from '@/lib/app-params'
import { PUBLIC_LEGAL_LIBRARY, PUBLIC_LEGAL_NOTICE } from '@/lib/publicLegalLibrary'
import OfficeBrandMark from '@/components/helm/OfficeBrandMark'
import {
  Scale, ShieldCheck, FileText, BarChart2,
  MessageCircle, LogIn, ChevronLeft, Star, Zap,
  AlertCircle, RefreshCw, CheckCircle2, Mail,
  Lock, Eye, EyeOff, UserPlus, BookOpen, Search,
  Gavel, Users, CalendarDays, Receipt, FolderArchive,
  Handshake, ArrowLeft, Building2, Sparkles, PhoneCall,
} from 'lucide-react'

function ParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let raf
    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    setSize()
    window.addEventListener('resize', setSize, { passive: true })

    const points = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .32,
      vy: (Math.random() - .5) * .32,
      r: Math.random() * 1.6 + .45,
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
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)
          if (d < 130) {
            ctx.strokeStyle = `rgba(96,165,250,${(1 - d / 130) * .14})`
            ctx.lineWidth = .55
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
        ctx.fillStyle = 'rgba(147,197,253,.48)'
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
    <div className="group rounded-3xl border border-white/10 bg-white/[.045] p-4 shadow-xl shadow-slate-950/20 transition-all hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-white/[.075]">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-500/15 text-blue-200 shadow-[0_0_34px_rgba(59,130,246,.10)] transition-colors group-hover:bg-blue-500/22">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-black text-white/92">{title}</p>
      <p className="mt-1.5 text-xs leading-6 text-white/48">{desc}</p>
    </div>
  )
}

function ServicePill({ icon: Icon, title }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2 text-[11px] font-bold text-blue-100/90">
      <Icon className="h-3.5 w-3.5 text-blue-300" />
      {title}
    </span>
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
            'في Supabase → Authentication → URL Configuration → أضف رابط الموقع في Redirect URLs',
            'فعّل Google Provider عند استخدام تسجيل الدخول بجوجل',
            'للدخول المحلي بالإيميل: فعّل Email Provider من Supabase Authentication إن كان مغلقًا',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-white/15 text-[9px] flex items-center justify-center shrink-0 mt-0.5 font-bold text-white/60">{i + 1}</span>
              <span className="leading-5">{step}</span>
            </div>
          ))}
        </div>
      )}
      {isNoReg && <p className="text-xs text-white/50 border-t border-white/8 pt-3">تواصل مع مدير المكتب لإضافة حسابك في النظام قبل محاولة الدخول.</p>}
      <button onClick={onRetry} className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200 transition-colors">
        <RefreshCw className="h-3.5 w-3.5" /> حاول مرة أخرى
      </button>
    </div>
  )
}

function LegalPreviewCard({ item }) {
  return (
    <Link to="/PublicLegalLibrary" className="block rounded-3xl border border-white/10 bg-slate-950/35 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-slate-900/70">
      <span className="mb-3 inline-flex rounded-full border border-blue-300/15 bg-blue-400/10 px-3 py-1 text-[10px] font-bold text-blue-200">{item.category}</span>
      <h3 className="text-sm font-black leading-6 text-white">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-xs leading-6 text-white/48">{item.summary}</p>
    </Link>
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
    appPublicSettings,
  } = useAuth()

  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  const officeName = appPublicSettings?.office_name || 'أحمد حلمي للاستشارات القانونية'
  const officeLogo = appPublicSettings?.logo_url || null
  const libraryPreview = useMemo(() => PUBLIC_LEGAL_LIBRARY.slice(0, 4), [])

  const FEATURES = [
    { icon: Scale, title: 'إدارة قضايا احترافية', desc: 'ملف واضح لكل قضية مع الخصوم والجلسات والمستندات والمهام.' },
    { icon: Users, title: 'بوابة موكلين آمنة', desc: 'كل موكل يرى ملفه وما يخصه فقط وفق صلاحيات محكمة.' },
    { icon: BookOpen, title: 'مكتبة قانونية عامة', desc: 'محتوى قانوني تعريفي يظهر قبل تسجيل الدخول لجذب العملاء وبناء الثقة.' },
    { icon: MessageCircle, title: 'تواصل سريع', desc: 'تنظيم تواصل واتساب وبريد ومتابعات عملية من داخل الملف.' },
    { icon: BarChart2, title: 'مؤشرات إدارية', desc: 'متابعة أداء المكتب دون إظهار الحسابات لغير أصحاب الصلاحية.' },
    { icon: ShieldCheck, title: 'صلاحيات دقيقة', desc: 'إدارة أدوار المدير، الموظف، الموكل، والبروكر بصلاحيات منفصلة.' },
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
    if (result?.ok && authMode === 'signup') setNotice('تم إنشاء الحساب. إذا كانت تأكيدات البريد مفعّلة في Supabase، افتح بريدك واضغط رابط التفعيل أولًا.')
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
      className="min-h-screen relative overflow-x-hidden flex flex-col bg-slate-950 text-white"
      style={{ background: 'radial-gradient(ellipse at 18% 18%, rgba(37,99,235,.24), transparent 44%), radial-gradient(ellipse at 82% 28%, rgba(14,165,233,.15), transparent 38%), radial-gradient(ellipse at 50% 92%, rgba(16,185,129,.08), transparent 38%), linear-gradient(180deg,#020617,#071022 52%,#030712)' }}
    >
      <ParticleCanvas />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

      <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/55 px-4 py-3 backdrop-blur-2xl md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="منصة المكتب والموكلين" compact />
          <div className="flex items-center gap-2">
            <Link to="/PublicLegalLibrary" className="hidden items-center gap-2 rounded-2xl border border-blue-300/20 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-100 transition-colors hover:bg-blue-500/18 sm:inline-flex">
              <BookOpen className="h-4 w-4" />
              المكتبة القانونية
            </Link>
            <a href="#login" className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-950 shadow-lg shadow-white/10 transition-transform hover:-translate-y-0.5">
              <LogIn className="h-4 w-4" />
              دخول الموكلين
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 pb-10 pt-8 md:px-10 md:pt-14">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.08fr,440px] lg:gap-10 xl:gap-14">
          <section className="space-y-7 md:space-y-9">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[11px] font-black text-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                مكتب قانوني رقمي منظم — للموكلين والإدارة والمتابعة
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                بوابة قانونية تجعل العميل يشعر أن ملفه
                <span className="mt-1 block bg-gradient-to-l from-blue-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">واضح، آمن، وتحت السيطرة</span>
              </h1>
              <p className="max-w-2xl text-sm leading-8 text-white/58 md:text-base">
                {officeName} يقدم واجهة موحدة لإدارة القضايا، المذكرات، الجلسات، المستندات، التواصل، ومتابعة الموكلين — مع مكتبة قانونية عامة تبني الثقة قبل بداية التعامل.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a href="#login" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-2xl shadow-blue-900/35 transition-all hover:-translate-y-0.5 hover:bg-blue-500">
                دخول المكتب والموكلين
                <ChevronLeft className="h-4 w-4" />
              </a>
              <Link to="/PublicLegalLibrary" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.055] px-5 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/[.09]">
                تصفح المكتبة القانونية
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <ServicePill icon={Gavel} title="استشارات ودراسة ملفات" />
              <ServicePill icon={FileText} title="مذكرات ولوائح قانونية" />
              <ServicePill icon={CalendarDays} title="متابعة جلسات ومواعيد" />
              <ServicePill icon={FolderArchive} title="أرشفة مستندات" />
              <ServicePill icon={Handshake} title="إحالات وبروكر" />
              <ServicePill icon={Receipt} title="إدارة مالية بصلاحيات" />
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-2xl">
              {[
                { val: 'RTL', label: 'عربي كامل' },
                { val: 'آمن', label: 'صلاحيات متعددة' },
                { val: '24/7', label: 'بوابة إلكترونية' },
              ].map((s) => (
                <div key={s.label} className="rounded-3xl border border-white/10 bg-white/[.045] p-4 text-center">
                  <p className="text-xl font-black text-white md:text-2xl">{s.val}</p>
                  <p className="mt-1 text-[11px] font-bold text-white/42">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {FEATURES.map((f) => <Feature key={f.title} {...f} />)}
            </div>
          </section>

          <aside id="login" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border border-white/10 bg-white/[.07] shadow-[0_40px_90px_rgba(0,0,0,.50),0_0_0_1px_rgba(255,255,255,.05)_inset] backdrop-blur-2xl overflow-hidden">
              <div className="border-b border-white/8 bg-slate-950/35 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-500/18 text-blue-200">
                    <LogIn className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black leading-none text-white">تسجيل الدخول</h2>
                    <p className="mt-1 text-[11px] font-bold text-white/42">للمكتب، الموكلين، الموظفين، والبروكر</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-slate-950/45 p-1">
                  <button type="button" onClick={() => { setAuthMode('login'); setNotice('') }} className={`h-10 rounded-xl text-xs font-black transition-all ${authMode === 'login' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-white/45 hover:text-white'}`}>دخول</button>
                  <button type="button" onClick={() => { setAuthMode('signup'); setNotice('') }} className={`h-10 rounded-xl text-xs font-black transition-all ${authMode === 'signup' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-white/45 hover:text-white'}`}>حساب جديد</button>
                </div>

                {authError && <AuthErrorCard error={authError} onRetry={() => { setNotice(''); checkAppState?.(); }} />}
                {notice && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs leading-6 text-emerald-100">{notice}</div>}

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {authMode === 'signup' && (
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold text-white/45">الاسم الكامل</span>
                      <div className="relative">
                        <UserPlus className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                        <input value={form.fullName} onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/55 pr-11 pl-4 text-sm text-white outline-none placeholder:text-white/22 focus:border-blue-300/50" placeholder="الاسم كما يظهر داخل النظام" />
                      </div>
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold text-white/45">البريد الإلكتروني</span>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/55 pr-11 pl-4 text-sm text-white outline-none placeholder:text-white/22 focus:border-blue-300/50" placeholder="name@example.com" />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold text-white/45">كلمة المرور</span>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <input type={showPassword ? 'text' : 'password'} required autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/55 pr-11 pl-11 text-sm text-white outline-none placeholder:text-white/22 focus:border-blue-300/50" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </label>

                  <button type="submit" disabled={emailLoading || isLoadingAuth} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                    {emailLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : authMode === 'signup' ? 'إنشاء حساب بالإيميل' : 'دخول بالإيميل'}
                    {!emailLoading && <ChevronLeft className="h-4 w-4 opacity-70" />}
                  </button>
                </form>

                <button type="button" onClick={handleResetPassword} disabled={emailLoading || !form.email} className="text-[11px] text-blue-200/70 hover:text-blue-100 disabled:opacity-30">نسيت كلمة المرور؟ أدخل البريد ثم اضغط هنا.</button>

                <div className="flex items-center gap-3 text-[10px] text-white/25"><span className="h-px flex-1 bg-white/10" />أو<span className="h-px flex-1 bg-white/10" /></div>

                <button onClick={handleGoogleLogin} disabled={googleLoading || isLoadingAuth} className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-900/85 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                  {(googleLoading || isLoadingAuth) ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : (
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

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { icon: ShieldCheck, label: 'SSL آمن' },
                    { icon: Building2, label: 'مكتب موحد' },
                    { icon: CheckCircle2, label: 'صلاحيات' },
                  ].map((item) => {
                    const Icon = item.icon
                    return <div key={item.label} className="flex flex-col items-center gap-1 rounded-2xl border border-white/6 bg-white/[.03] p-2.5 text-center"><Icon className="h-4 w-4 text-blue-400/70" /><p className="text-[10px] text-white/45">{item.label}</p></div>
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-emerald-300/15 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-50/80">
              <div className="mb-2 flex items-center gap-2 font-black text-emerald-100"><PhoneCall className="h-4 w-4" /> بوابة جذب وثقة</div>
              <p className="text-xs text-white/55">العميل يرى مكتبة قانونية تعريفية قبل الدخول، ثم يدخل إلى بوابة آمنة مخصصة لملفه فقط.</p>
            </div>
          </aside>
        </div>

        <section className="mx-auto mt-12 max-w-7xl rounded-[2rem] border border-white/10 bg-white/[.045] p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-xl md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-black text-blue-200"><BookOpen className="h-4 w-4" /> مكتبة قانونية عامة بدون تسجيل دخول</div>
              <h2 className="text-2xl font-black text-white md:text-3xl">توعية قانونية مختصرة تجذب العميل وتبني الثقة</h2>
              <p className="mt-2 max-w-3xl text-xs leading-7 text-white/48 md:text-sm">{PUBLIC_LEGAL_NOTICE}</p>
            </div>
            <Link to="/PublicLegalLibrary" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-xs font-black text-white transition-colors hover:bg-blue-500">
              <Search className="h-4 w-4" /> تصفح المكتبة بالكامل
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{libraryPreview.map(item => <LegalPreviewCard key={item.id} item={item} />)}</div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 px-5 py-4 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-white/24">{officeName} © {new Date().getFullYear()}</p>
          <div className="flex items-center gap-3 text-[11px] text-white/24"><span>HELM Portal</span><span>·</span><span>مكتبة قانونية</span><span>·</span><span>بوابة موكلين</span></div>
        </div>
      </footer>
    </div>
  )
}
