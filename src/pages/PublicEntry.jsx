import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { PUBLIC_LEGAL_LIBRARY } from '@/lib/publicLegalLibrary'
import OfficeBrandMark from '@/components/helm/OfficeBrandMark'
import {
  Scale, ShieldCheck, FileText, BarChart2, MessageCircle, LogIn, ChevronLeft,
  Star, Zap, AlertCircle, RefreshCw, CheckCircle2, Mail, Lock, Eye, EyeOff,
  UserPlus, BookOpen, Search, Gavel, Users, CalendarDays, Receipt,
  FolderArchive, Handshake, ArrowLeft, Building2, Sparkles, PhoneCall,
  MapPin, Clock3, Award, Landmark, Globe2
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

    const points = Array.from({ length: 64 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .28,
      vy: (Math.random() - .5) * .28,
      r: Math.random() * 1.4 + .45,
    }))

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      points.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10) p.y = H + 10
        if (p.y > H + 10) p.y = -10
      })
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)
          if (d < 125) {
            ctx.strokeStyle = `rgba(148,163,184,${(1 - d / 125) * .16})`
            ctx.lineWidth = .5
            ctx.beginPath()
            ctx.moveTo(points[i].x, points[i].y)
            ctx.lineTo(points[j].x, points[j].y)
            ctx.stroke()
          }
        }
      }
      points.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(191,219,254,.42)'
        ctx.fill()
      })
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setSize) }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" />
}

function AuthErrorCard({ error, onRetry }) {
  const isSetup = error?.type === 'oauth_error' || error?.type === 'network_error'
  const isNoReg = error?.type === 'user_not_registered'
  return (
    <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
        <div>
          <p className="text-sm font-black text-red-200">{isNoReg ? 'الحساب غير مفعل داخل المكتب' : isSetup ? 'تعذر إكمال تسجيل الدخول' : 'فشل تسجيل الدخول'}</p>
          <p className="mt-1 text-xs leading-5 text-red-100/72">{error?.message}</p>
        </div>
      </div>
      {isNoReg && <p className="border-t border-white/8 pt-3 text-xs leading-6 text-white/52">اطلب من إدارة المكتب إضافة البريد إلى صلاحيات الموظف أو الموكل أو البروكر قبل الدخول.</p>}
      {isSetup && <p className="border-t border-white/8 pt-3 text-xs leading-6 text-white/52">راجع إعدادات Supabase Auth و Redirect URLs أو استخدم الدخول بالإيميل لحين ضبط Google.</p>}
      <button onClick={onRetry} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-200 hover:text-white">
        <RefreshCw className="h-3.5 w-3.5" /> إعادة الفحص
      </button>
    </div>
  )
}

function ServiceCard({ icon: Icon, title, desc }) {
  return (
    <div className="group rounded-[1.6rem] border border-white/10 bg-white/[.055] p-4 shadow-xl shadow-slate-950/20 transition-all hover:-translate-y-1 hover:border-amber-200/25 hover:bg-white/[.085]">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-amber-100 shadow-[0_0_34px_rgba(245,158,11,.09)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1.5 text-xs leading-6 text-white/52">{desc}</p>
    </div>
  )
}

function TrustRow({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/35 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/14 text-blue-100">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-white/45">{desc}</p>
      </div>
    </div>
  )
}

function LoginCard({ authMode, setAuthMode, form, setForm, showPassword, setShowPassword, authError, notice, emailLoading, isLoadingAuth, googleLoading, onSubmit, onReset, onGoogle, checkAppState }) {
  return (
    <aside id="login" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-white/[.08] shadow-[0_44px_110px_rgba(0,0,0,.55),0_0_0_1px_rgba(255,255,255,.04)_inset] backdrop-blur-2xl">
        <div className="border-b border-white/10 bg-slate-950/42 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-amber-100">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-none text-white">دخول آمن للبوابة</h2>
              <p className="mt-1.5 text-[11px] font-bold text-white/48">للمكتب، الموكلين، الموظفين، والبروكر</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-1">
            <button type="button" onClick={() => { setAuthMode('login') }} className={`h-11 rounded-xl text-xs font-black transition-all ${authMode === 'login' ? 'bg-white text-slate-950 shadow-lg shadow-white/10' : 'text-white/45 hover:text-white'}`}>تسجيل دخول</button>
            <button type="button" onClick={() => { setAuthMode('signup') }} className={`h-11 rounded-xl text-xs font-black transition-all ${authMode === 'signup' ? 'bg-white text-slate-950 shadow-lg shadow-white/10' : 'text-white/45 hover:text-white'}`}>إنشاء حساب</button>
          </div>

          {authError && <AuthErrorCard error={authError} onRetry={() => { checkAppState?.() }} />}
          {notice && <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-xs leading-6 text-emerald-100">{notice}</div>}

          <form onSubmit={onSubmit} className="space-y-3">
            {authMode === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold text-white/48">الاسم الكامل</span>
                <div className="relative">
                  <UserPlus className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input value={form.fullName} onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/58 pr-11 pl-4 text-sm text-white outline-none placeholder:text-white/24 focus:border-amber-200/45" placeholder="الاسم كما يظهر للموكل أو الموظف" />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-white/48">البريد الإلكتروني</span>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/58 pr-11 pl-4 text-sm text-white outline-none placeholder:text-white/24 focus:border-amber-200/45" placeholder="name@example.com" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-white/48">كلمة المرور</span>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input type={showPassword ? 'text' : 'password'} required autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/58 pr-11 pl-11 text-sm text-white outline-none placeholder:text-white/24 focus:border-amber-200/45" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/75">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button type="submit" disabled={emailLoading || isLoadingAuth} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 font-black text-slate-950 shadow-2xl shadow-amber-950/25 transition-all hover:-translate-y-0.5 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60">
              {emailLoading ? <div className="h-5 w-5 rounded-full border-2 border-slate-900/25 border-t-slate-900 animate-spin" /> : authMode === 'signup' ? 'إنشاء حساب للبوابة' : 'دخول إلى البوابة'}
              {!emailLoading && <ChevronLeft className="h-4 w-4" />}
            </button>
          </form>

          <button type="button" onClick={onReset} disabled={emailLoading || !form.email} className="text-[11px] font-bold text-blue-100/70 hover:text-white disabled:opacity-30">
            نسيت كلمة المرور؟ أدخل البريد ثم اضغط هنا.
          </button>

          <div className="flex items-center gap-3 text-[10px] text-white/25">
            <span className="h-px flex-1 bg-white/10" /> أو <span className="h-px flex-1 bg-white/10" />
          </div>

          <button onClick={onGoogle} disabled={googleLoading || isLoadingAuth} className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-900/85 font-bold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
            {(googleLoading || isLoadingAuth) ? <div className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <>
              <Globe2 className="h-5 w-5" />
              <span>تسجيل الدخول عبر Google</span>
              <ChevronLeft className="h-4 w-4 opacity-60" />
            </>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[{ icon: ShieldCheck, label: 'صلاحيات' }, { icon: Lock, label: 'بيانات آمنة' }, { icon: CheckCircle2, label: 'متابعة واضحة' }].map((item) => {
          const Icon = item.icon
          return <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[.04] p-3 text-center"><Icon className="mx-auto h-4 w-4 text-amber-100/80" /><p className="mt-1 text-[10px] font-bold text-white/48">{item.label}</p></div>
        })}
      </div>
    </aside>
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

  const SERVICES = useMemo(() => [
    { icon: Gavel, title: 'دراسة الملفات والنزاعات', desc: 'فرز الوقائع والمستندات وتحديد المسار القانوني الأقرب قبل التصعيد.' },
    { icon: FileText, title: 'مذكرات ولوائح منظمة', desc: 'صياغة دفاع، طلبات، تظلمات، إنذارات، وصحف دعاوى بمنطق واضح ومرفقات مرتبة.' },
    { icon: CalendarDays, title: 'متابعة الجلسات والمواعيد', desc: 'جدولة المواعيد وربط كل جلسة بالملف والموكل والملاحظات المطلوبة.' },
    { icon: FolderArchive, title: 'أرشفة مستندات الموكلين', desc: 'تجميع المستندات والفواتير والمرفقات في ملف واحد قابل للبحث.' },
    { icon: MessageCircle, title: 'تواصل منظم بدل الفوضى', desc: 'تقليل ضياع الرسائل بين واتساب والبريد بتسجيل الملاحظات داخل الملف.' },
    { icon: Receipt, title: 'حسابات بصلاحيات مقفلة', desc: 'الفواتير والدخل والمصاريف تظهر فقط لمن يملك صلاحية مالية.' },
  ], [])

  const legalPreview = useMemo(() => PUBLIC_LEGAL_LIBRARY.slice(0, 4), [])

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
    if (result?.ok && authMode === 'signup') setNotice('تم إنشاء الحساب. إذا كانت تأكيدات البريد مفعلة، افتح بريدك واضغط رابط التفعيل أولًا.')
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
    <div dir="rtl" className="min-h-screen relative overflow-x-hidden bg-slate-950 text-white" style={{ background: 'radial-gradient(ellipse at 12% 18%, rgba(148,163,184,.16), transparent 40%), radial-gradient(ellipse at 78% 14%, rgba(245,158,11,.14), transparent 32%), radial-gradient(ellipse at 60% 96%, rgba(37,99,235,.16), transparent 42%), linear-gradient(180deg,#020617,#07111f 52%,#030712)' }}>
      <ParticleCanvas />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:78px_78px] opacity-20" />

      <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/70 px-4 py-3 backdrop-blur-2xl md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="بوابة المكتب والموكلين" compact />
          <nav className="hidden items-center gap-2 md:flex">
            <a href="#services" className="rounded-2xl px-3 py-2 text-xs font-black text-white/58 hover:bg-white/[.06] hover:text-white">خدمات المكتب</a>
            <a href="#library" className="rounded-2xl px-3 py-2 text-xs font-black text-white/58 hover:bg-white/[.06] hover:text-white">المكتبة القانونية</a>
            <a href="#login" className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-white/10">دخول البوابة</a>
          </nav>
          <a href="#login" className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-950 shadow-lg shadow-white/10 md:hidden">
            <LogIn className="h-4 w-4" /> دخول
          </a>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-12 pt-8 md:px-10 md:pt-14">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.08fr,440px] lg:gap-12">
          <section className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-[11px] font-black text-amber-100">
                <Award className="h-3.5 w-3.5" /> منصة قانونية خاصة بإدارة ملفات المكتب والموكلين
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                ابدأ ملفك القانوني من بوابة واضحة، آمنة، ومنظمة.
                <span className="mt-2 block bg-gradient-to-l from-amber-100 via-white to-blue-100 bg-clip-text text-transparent">كل قضية، مستند، جلسة، وملاحظة في مكان واحد.</span>
              </h1>
              <p className="max-w-2xl text-base leading-9 text-white/62 md:text-lg">
                {officeName} يقدّم بوابة رقمية تساعد الموكل على فهم مسار ملفه، وتساعد فريق المكتب على إدارة القضايا والمستندات والمواعيد والتواصل بصلاحيات دقيقة تحفظ الخصوصية.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a href="#login" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 text-sm font-black text-slate-950 shadow-2xl shadow-amber-950/25 transition-all hover:-translate-y-0.5 hover:bg-amber-200">
                دخول المكتب والموكلين <ChevronLeft className="h-4 w-4" />
              </a>
              <Link to="/PublicLegalLibrary" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.055] px-5 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/[.09]">
                تصفح المكتبة القانونية <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid max-w-3xl grid-cols-3 gap-3">
              {[
                { val: 'بوابة موكلين', label: 'متابعة منظمة' },
                { val: 'صلاحيات', label: 'موظف / موكل / بروكر' },
                { val: 'أرشفة', label: 'مستندات ومواعيد' },
              ].map((s) => <div key={s.label} className="rounded-3xl border border-white/10 bg-white/[.045] p-4 text-center"><p className="text-sm font-black text-white md:text-lg">{s.val}</p><p className="mt-1 text-[11px] font-bold text-white/42">{s.label}</p></div>)}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <TrustRow icon={Landmark} title="واجهة للمكتب" desc="إدارة داخلية للقضايا والموكلين والمستندات والمهام." />
              <TrustRow icon={Users} title="واجهة للموكل" desc="متابعة الملف وما يصرح المكتب بإظهاره فقط." />
              <TrustRow icon={Handshake} title="واجهة للبروكر" desc="رؤية الموكلين والقضايا المرتبطة به دون حسابات مالية." />
            </div>
          </section>

          <LoginCard
            authMode={authMode}
            setAuthMode={setAuthMode}
            form={form}
            setForm={setForm}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            authError={authError}
            notice={notice}
            emailLoading={emailLoading}
            isLoadingAuth={isLoadingAuth}
            googleLoading={googleLoading}
            onSubmit={handleEmailSubmit}
            onReset={handleResetPassword}
            onGoogle={handleGoogleLogin}
            checkAppState={checkAppState}
          />
        </div>

        <section id="services" className="mx-auto mt-14 max-w-7xl">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black text-amber-100/75">خدمات واضحة قبل الدخول</p>
              <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">ماذا سيجد العميل داخل البوابة؟</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-white/48">الصفحة لا تبيع وعودًا عامة؛ هي تشرح للموكل كيف سيُدار ملفه: مستندات، مواعيد، تواصل، متابعة، وصلاحيات.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((item) => <ServiceCard key={item.title} {...item} />)}
          </div>
        </section>

        <section id="library" className="mx-auto mt-14 max-w-7xl rounded-[2rem] border border-white/10 bg-white/[.05] p-5 shadow-2xl shadow-slate-950/20 md:p-7">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/15 bg-blue-300/10 px-3 py-1.5 text-xs font-black text-blue-100"><BookOpen className="h-4 w-4" /> مكتبة قانونية عامة</div>
              <h2 className="mt-3 text-2xl font-black md:text-3xl">محتوى قانوني مختصر يبني الثقة قبل فتح الملف</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/50">المكتبة لا تكشف أي بيانات عملاء، لكنها تساعد الزائر على فهم نوع النزاع والمستندات المطلوبة قبل التواصل أو تسجيل الدخول.</p>
            </div>
            <Link to="/PublicLegalLibrary" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950"><Search className="h-4 w-4" /> فتح المكتبة بالكامل</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {legalPreview.map((item) => <Link key={item.id} to="/PublicLegalLibrary" className="rounded-3xl border border-white/10 bg-slate-950/35 p-4 transition-all hover:-translate-y-0.5 hover:bg-slate-900/70"><span className="inline-flex rounded-full bg-amber-200/10 px-2.5 py-1 text-[10px] font-black text-amber-100">{item.category}</span><h3 className="mt-3 text-sm font-black leading-6 text-white">{item.title}</h3><p className="mt-2 line-clamp-3 text-xs leading-6 text-white/45">{item.summary}</p></Link>)}
          </div>
        </section>

        <section className="mx-auto mt-10 grid max-w-7xl gap-3 md:grid-cols-4">
          {[
            { icon: PhoneCall, title: 'تواصل منضبط', desc: 'رقم الهاتف والبريد داخل ملف الموكل.' },
            { icon: MapPin, title: 'بيانات موثقة', desc: 'عنوان، هوية، جنسية، وملاحظات.' },
            { icon: Clock3, title: 'مواعيد واضحة', desc: 'جلسات ومهام مرتبطة بالملف.' },
            { icon: Building2, title: 'إدارة مؤسسية', desc: 'مناسب للمكتب والموكل والشركات.' },
          ].map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-3xl border border-white/8 bg-white/[.035] p-4"><Icon className="h-5 w-5 text-blue-100/80" /><p className="mt-3 text-sm font-black text-white">{item.title}</p><p className="mt-1 text-xs leading-6 text-white/45">{item.desc}</p></div> })}
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/8 px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-[11px] text-white/35">
          <span>{officeName} © {new Date().getFullYear()}</span>
          <span>بوابة مكتب قانوني — إدارة ملفات — مكتبة عامة — صلاحيات موكلين</span>
        </div>
      </footer>
    </div>
  )
}
