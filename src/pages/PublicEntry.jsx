import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import OfficeBrandMark from '@/components/helm/OfficeBrandMark'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  FileText,
  FolderLock,
  Lock,
  LogIn,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'ملف قانوني واحد',
    desc: 'القضايا والمذكرات والمستندات والملاحظات مرتبطة بالموكل في مكان واضح.',
  },
  {
    icon: CalendarDays,
    title: 'مواعيد وإجراءات',
    desc: 'متابعة الجلسات والمواعيد والمهام المهمة دون تشتت بين أكثر من وسيلة.',
  },
  {
    icon: FolderLock,
    title: 'صلاحيات وسرية',
    desc: 'يظهر لكل مستخدم فقط ما تسمح به صفته وارتباطه بالملف.',
  },
  {
    icon: Users,
    title: 'متابعة مباشرة',
    desc: 'واجهة موحدة للمكتب والموكلين والموظفين والبروكر وفق الصلاحيات المعتمدة.',
  },
]

const inputClass = 'h-12 w-full rounded-2xl border border-slate-300 bg-white pr-11 pl-4 text-sm font-bold text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100'

function AuthErrorCard({ error, onRetry }) {
  const isSetup = error?.type === 'oauth_error' || error?.type === 'network_error'
  const isNoReg = error?.type === 'user_not_registered'

  return (
    <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-right">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div>
          <p className="text-sm font-black text-red-900">
            {isNoReg ? 'الحساب غير مفعل داخل المكتب' : isSetup ? 'تعذر إكمال تسجيل الدخول' : 'فشل تسجيل الدخول'}
          </p>
          <p className="mt-1 text-xs leading-6 text-red-800">{error?.message}</p>
        </div>
      </div>
      {isNoReg && (
        <p className="mt-3 border-t border-red-200 pt-3 text-xs leading-6 text-red-800">
          اطلب من إدارة المكتب إضافة بريدك ضمن الصلاحية المناسبة قبل الدخول.
        </p>
      )}
      {isSetup && (
        <p className="mt-3 border-t border-red-200 pt-3 text-xs leading-6 text-red-800">
          استخدم الدخول بالبريد أو راجع إعدادات تسجيل الدخول عبر Google.
        </p>
      )}
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-700 px-3 py-2 text-xs font-black text-white"
      >
        <RefreshCw className="h-3.5 w-3.5" /> إعادة الفحص
      </button>
    </div>
  )
}

function LoginPanel({
  authMode,
  setAuthMode,
  form,
  setForm,
  showPassword,
  setShowPassword,
  authError,
  notice,
  emailLoading,
  isLoadingAuth,
  googleLoading,
  onSubmit,
  onReset,
  onGoogle,
  checkAppState,
}) {
  const isSignup = authMode === 'signup'

  const switchMode = () => {
    setAuthMode(isSignup ? 'login' : 'signup')
    setForm((prev) => ({ ...prev, password: '' }))
  }

  return (
    <aside id="login" className="scroll-mt-24 rounded-[28px] border border-white/15 bg-white p-5 text-slate-950 shadow-2xl shadow-slate-950/35 md:p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-950 text-amber-300">
          <LogIn className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black">{isSignup ? 'إنشاء حساب' : 'تسجيل الدخول'}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">حلم بروتال</p>
  AlertCircle, BookOpen, ChevronLeft, Eye, EyeOff, FileText,
  Gavel, Globe2, Landmark, Lock, LogIn, Mail, MapPin, Scale, Search,
  ShieldCheck, Sparkles, UserPlus
} from 'lucide-react'

const publicHubs = [
  { href: '/uae-legal-guides', icon: Landmark, tag: 'الإمارات 🇦🇪', title: 'دليل القانون الإماراتي', desc: 'التنفيذ، المطالبات، الشيكات، العقود، العمل، الإثبات والاستئناف.' },
  { href: '/egypt-legal-guides', icon: MapPin, tag: 'مصر 🇪🇬', title: 'دليل مصر القانوني', desc: 'العمل، النقض، المحاكم الاقتصادية، العقود والمطالبات والملفات المرتبطة بالإمارات.' },
  { href: '/uae-egypt-legal-services', icon: Scale, tag: 'مصر × الإمارات', title: 'ملفات قانونية بين مصر والإمارات', desc: 'تنظيم الملفات العابرة للحدود، الأحكام، العقود، الأعمال والمستندات.' },
  { href: '/global-legal-services', icon: Globe2, tag: 'دولي 🌍', title: 'الخدمات القانونية الدولية', desc: 'عقود ومطالبات وأحكام وتحكيم ومستندات وملفات متعددة الاختصاصات.' },
]

const deportationGuides = [
  { href: '/deportation-mercy-request-egypt-uae', title: 'استرحام وإلغاء الإبعاد للمصريين من مصر', desc: 'من أين تبدأ إذا كنت في مصر وصدر بحقك إبعاد من الإمارات؟ تحديد نوع الإبعاد والجهة والمستندات.' },
  { href: '/judicial-deportation-uae', title: 'إلغاء الإبعاد القضائي من الإمارات', desc: 'فهم الحكم القضائي، منطوق الإبعاد، بيانات القضية وتجهيز ملف الطلب للجهة المختصة.' },
  { href: '/administrative-deportation-uae', title: 'رفع الإبعاد الإداري من الإمارات', desc: 'الفرق عن الحكم القضائي، سبب القرار، بيانات الإقامة والظروف اللاحقة الداعمة للطلب.' },
]

function LoginPanel({ authMode, setAuthMode, form, setForm, showPassword, setShowPassword, authError, notice, busy, googleLoading, onSubmit, onReset, onGoogle }) {
  return (
    <aside id="login" className="rounded-[28px] border border-[#ded6c8] bg-white p-5 shadow-[0_24px_70px_rgba(23,32,51,.13)] sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f3ead9] px-3 py-1.5 text-xs font-black text-[#80602a]"><ShieldCheck className="h-4 w-4" /> HELM PORTAL</div>
          <h2 className="mt-3 text-2xl font-black text-[#172033]">دخول مساحة العمل</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#756e64]">تسجيل الدخول خاص بعملاء وفريق المكتب. المحتوى القانوني العام لا يحتاج حساباً.</p>
        </div>
        <LogIn className="h-6 w-6 text-[#9a793d]" />
      </div>

      <div className="space-y-4">
        {authError && <AuthErrorCard error={authError} onRetry={() => checkAppState?.({ force: true })} />}
        {notice && (
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold leading-7 text-emerald-900">
            {notice}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          {isSignup && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-black text-slate-800">الاسم الكامل</span>
              <div className="relative">
                <UserPlus className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  className={inputClass}
                  placeholder="الاسم كما يظهر داخل النظام"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-800">البريد الإلكتروني</span>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className={inputClass}
                placeholder="name@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-800">كلمة المرور</span>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className={`${inputClass} pl-11`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={emailLoading || isLoadingAuth}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 text-sm font-black text-slate-950 shadow-lg shadow-amber-300/25 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {emailLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-950" />
            ) : (
              <>{isSignup ? 'إنشاء الحساب' : 'دخول إلى البوابة'} <ChevronLeft className="h-4 w-4" /></>
            )}
          </button>
        </form>

        {!isSignup && (
          <button
            type="button"
            onClick={onReset}
            disabled={emailLoading || !form.email}
            className="text-sm font-black text-slate-600 underline underline-offset-4 hover:text-slate-950 disabled:opacity-40"
          >
            نسيت كلمة المرور؟
          </button>
        )}

        <div className="flex items-center gap-3 text-xs font-black text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> أو <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={googleLoading || isLoadingAuth}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white text-sm font-black text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {(googleLoading || isLoadingAuth) ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          ) : (
            <><ShieldCheck className="h-5 w-5" /> الدخول عبر Google</>
          )}
        </button>

        <p className="text-center text-sm font-bold text-slate-600">
          {isSignup ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}{' '}
          <button type="button" onClick={switchMode} className="font-black text-blue-900 underline underline-offset-4">
            {isSignup ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </button>
        </p>

        <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-6 text-slate-600">
          إنشاء الحساب لا يعني قبول التكليف أو فتح قضية. يتم اعتماد الحساب والصلاحيات من إدارة المكتب.
        </p>
      </div>
    </aside>
  )
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-950 text-amber-300">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-7 text-slate-600">{desc}</p>
    </article>
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
  const legalPreview = useMemo(() => PUBLIC_LEGAL_LIBRARY.slice(0, 3), [])

  const handleGoogleLogin = async () => {
    setNotice('')
    setGoogleLoading(true)
    await navigateToLogin()
    window.setTimeout(() => setGoogleLoading(false), 4000)
  }

  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    setNotice('')
    setEmailLoading(true)
    const result = authMode === 'signup'
      ? await signUpWithEmail({ email: form.email, password: form.password, fullName: form.fullName })
      : await signInWithEmail(form.email, form.password)
    setEmailLoading(false)

    if (result?.ok && authMode === 'signup') {
      setNotice('تم إنشاء الحساب. افتح بريدك واضغط رابط التفعيل أولًا إذا كان تأكيد البريد مفعلًا.')
      setAuthMode('login')
      setForm((prev) => ({ ...prev, password: '' }))
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
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <OfficeBrandMark
            logoUrl={officeLogo}
            officeName={officeName}
            subtitle="حلم بروتال"
            compact
          />
          <div className="flex items-center gap-2">
            <Link
              to="/PublicLegalLibrary"
              className="hidden h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-black text-slate-100 transition hover:bg-white/10 sm:inline-flex"
            >
              <BookOpen className="h-4 w-4" /> المكتبة القانونية
            </Link>
            <a
              href="#login"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-black text-slate-950 transition hover:bg-amber-200"
            >
              <LogIn className="h-4 w-4" /> دخول
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.30),transparent_32%),linear-gradient(135deg,#020617,#0b1f46_58%,#07142d)] text-white">
          <div className="mx-auto grid max-w-7xl gap-9 px-4 py-10 md:px-8 lg:grid-cols-[1fr,420px] lg:items-center lg:py-14">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-200">
                بوابة المكتب والموكلين
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                حلم بروتال
              </h1>
              <p className="mt-4 text-xl font-black text-white md:text-2xl">ملفك القانوني في مكان واحد.</p>
              <p className="mt-4 max-w-2xl text-base font-medium leading-8 text-blue-100 md:text-lg">
                دخول موحد لمتابعة القضايا والمستندات والمواعيد والتواصل مع المكتب ضمن صلاحيات واضحة تحفظ سرية الملفات.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  'متابعة القضية والإجراءات',
                  'مستندات منظمة وآمنة',
                  'صلاحيات حسب نوع الحساب',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-blue-50">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/PublicLegalLibrary"
                className="mt-7 inline-flex items-center gap-2 text-sm font-black text-amber-300 underline underline-offset-4 hover:text-amber-200 sm:hidden"
              >
                فتح المكتبة القانونية <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <LoginPanel
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
        </section>

        <section className="px-4 py-10 md:px-8 lg:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 max-w-2xl">
              <p className="text-sm font-black text-amber-700">ما الذي تتيحه البوابة؟</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">أربع وظائف واضحة دون ازدحام.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
            </div>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-[#f2eee7] p-1">
        <button type="button" onClick={() => setAuthMode('login')} className={`rounded-lg px-3 py-2 text-sm font-black ${authMode === 'login' ? 'bg-[#172033] text-white' : 'text-[#6d665c]'}`}>تسجيل الدخول</button>
        <button type="button" onClick={() => setAuthMode('signup')} className={`rounded-lg px-3 py-2 text-sm font-black ${authMode === 'signup' ? 'bg-[#172033] text-white' : 'text-[#6d665c]'}`}>حساب جديد</button>
      </div>

      {authError && <div className="mb-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800"><AlertCircle className="mt-1 h-4 w-4 shrink-0" />{authError.message || 'تعذر تسجيل الدخول'}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</div>}

      <form onSubmit={onSubmit} className="space-y-3">
        {authMode === 'signup' && <label className="block"><span className="mb-1 block text-xs font-black">الاسم الكامل</span><div className="relative"><UserPlus className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8678]" /><input value={form.fullName} onChange={e => setForm(v => ({...v, fullName:e.target.value}))} className="h-12 w-full rounded-xl border border-[#ddd6ca] bg-[#fbfaf7] pr-10 pl-3 outline-none focus:border-[#b79656]" /></div></label>}
        <label className="block"><span className="mb-1 block text-xs font-black">البريد الإلكتروني</span><div className="relative"><Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8678]" /><input dir="ltr" type="email" required value={form.email} onChange={e => setForm(v => ({...v, email:e.target.value}))} className="h-12 w-full rounded-xl border border-[#ddd6ca] bg-[#fbfaf7] pr-10 pl-3 text-left outline-none focus:border-[#b79656]" /></div></label>
        <label className="block"><div className="mb-1 flex justify-between"><span className="text-xs font-black">كلمة المرور</span>{authMode === 'login' && <button type="button" onClick={onReset} className="text-xs font-black text-[#8b6b31]">نسيت كلمة المرور؟</button>}</div><div className="relative"><Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8678]" /><input dir="ltr" type={showPassword ? 'text':'password'} required value={form.password} onChange={e => setForm(v => ({...v, password:e.target.value}))} className="h-12 w-full rounded-xl border border-[#ddd6ca] bg-[#fbfaf7] pr-10 pl-10 text-left outline-none focus:border-[#b79656]" /><button type="button" onClick={() => setShowPassword(v=>!v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f8678]">{showPassword ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></label>
        <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#172033] text-sm font-black text-white disabled:opacity-50">{authMode === 'signup' ? 'إنشاء الحساب':'دخول HELM PORTAL'} <ChevronLeft className="h-4 w-4" /></button>
      </form>
      <button type="button" onClick={onGoogle} disabled={googleLoading || busy} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#ddd6ca] bg-white text-sm font-black text-[#172033] disabled:opacity-50"><ShieldCheck className="h-4 w-4 text-[#9a793d]" /> الدخول بحساب Google</button>
    </aside>
  )
}

export default function PublicEntry() {
  const { navigateToLogin, signInWithEmail, signUpWithEmail, resetPasswordForEmail, authError, isLoadingAuth, appPublicSettings } = useAuth()
  const [googleLoading,setGoogleLoading]=useState(false)
  const [emailLoading,setEmailLoading]=useState(false)
  const [authMode,setAuthMode]=useState('login')
  const [showPassword,setShowPassword]=useState(false)
  const [notice,setNotice]=useState('')
  const [form,setForm]=useState({fullName:'',email:'',password:''})
  const officeName=appPublicSettings?.office_name || 'أحمد حلمي للاستشارات القانونية'
  const officeLogo=appPublicSettings?.logo_url || null
  const busy=emailLoading || isLoadingAuth

  const handleGoogleLogin=async()=>{setNotice('');setGoogleLoading(true);await navigateToLogin();setTimeout(()=>setGoogleLoading(false),4000)}
  const handleEmailSubmit=async(e)=>{e.preventDefault();setNotice('');setEmailLoading(true);const r=authMode==='signup'?await signUpWithEmail({email:form.email,password:form.password,fullName:form.fullName}):await signInWithEmail(form.email,form.password);setEmailLoading(false);if(r?.ok&&authMode==='signup')setNotice('تم إنشاء الحساب. راجع بريدك إذا كان تأكيد البريد مفعلاً.')}
  const handleResetPassword=async()=>{if(!form.email)return;setEmailLoading(true);const r=await resetPasswordForEmail(form.email);setEmailLoading(false);if(r?.ok)setNotice('تم إرسال رابط إعادة تعيين كلمة المرور إن كان البريد مسجلاً.')}
  useEffect(()=>{if(authError){setGoogleLoading(false);setEmailLoading(false)}},[authError])

  return <div dir="rtl" className="min-h-screen bg-[#f5f2ec] text-[#172033]">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101826]/95 shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="HELM Legal — UAE • Egypt • International" compact tone="light" />
        <nav className="hidden items-center gap-2 md:flex">
          <a href="#public-guides" className="rounded-xl px-3 py-2 text-sm font-black text-[#ddd7cd] hover:bg-white/10">الأدلة القانونية</a>
          <a href="#deportation" className="rounded-xl px-3 py-2 text-sm font-black text-[#ddd7cd] hover:bg-white/10">الإبعاد والاسترحام</a>
          <Link to="/PublicLegalLibrary" className="rounded-xl px-3 py-2 text-sm font-black text-[#ddd7cd] hover:bg-white/10">المكتبة</Link>
          <a href="#login" className="rounded-xl bg-[#c8a96b] px-4 py-2 text-sm font-black text-[#111827]">دخول البوابة</a>
        </nav>
      </div>
    </header>

    <main>
      <section className="relative overflow-hidden bg-[#101826] text-white">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#c8a96b]/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-8 lg:grid-cols-[1fr_410px] lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c8a96b]/30 bg-[#c8a96b]/10 px-4 py-2 text-xs font-black text-[#e1c58d]"><Sparkles className="h-4 w-4"/> محتوى قانوني عام — بدون تسجيل دخول</div>
            <p className="mt-7 text-xs font-black tracking-[.25em] text-[#aaa397]">HELM LEGAL</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.25] md:text-6xl">بوابتك القانونية في <span className="text-[#dcc084]">الإمارات ومصر</span> والملفات الدولية.</h1>
            <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-[#c9c3b9] md:text-lg">أدلة قانونية عامة ومصادر رسمية ومسارات عملية لفهم نوع الملف والجهة المختصة قبل بدء الإجراء. جميع الصفحات العامة أدناه مفتوحة مباشرة ولا تحتاج إلى حساب.</p>
            <div className="mt-7 flex flex-wrap gap-3"><a href="#public-guides" className="rounded-xl bg-[#c8a96b] px-5 py-3 text-sm font-black text-[#101826]">استكشف الأدلة القانونية</a><a href="#deportation" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white">الإبعاد والاسترحام</a></div>
          </div>
          <LoginPanel authMode={authMode} setAuthMode={setAuthMode} form={form} setForm={setForm} showPassword={showPassword} setShowPassword={setShowPassword} authError={authError} notice={notice} busy={busy} googleLoading={googleLoading} onSubmit={handleEmailSubmit} onReset={handleResetPassword} onGoogle={handleGoogleLogin}/>
        </div>
      </section>

      <section id="public-guides" className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-18">
        <div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full bg-[#eee5d3] px-3 py-1.5 text-xs font-black text-[#765825]"><BookOpen className="h-4 w-4"/> وصول عام ومباشر</div><h2 className="mt-4 text-3xl font-black md:text-4xl">اختر النطاق القانوني</h2><p className="mt-3 text-base font-semibold leading-8 text-[#6c655b]">هذه الصفحات خارج نظام الحسابات. أي زائر من Google أو من مصر أو الإمارات يستطيع فتحها مباشرة.</p></div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{publicHubs.map(({href,icon:Icon,tag,title,desc})=><a key={href} href={href} className="group rounded-3xl border border-[#e2d9ca] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#172033] text-[#d9bc82]"><Icon className="h-5 w-5"/></div><div className="mt-4 text-xs font-black text-[#9a793d]">{tag}</div><h3 className="mt-2 text-lg font-black">{title}</h3><p className="mt-2 text-sm font-medium leading-7 text-[#6c655b]">{desc}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#8b6428]">فتح الصفحة <ChevronLeft className="h-4 w-4"/></span></a>)}</div>
      </section>

      <section id="deportation" className="border-y border-white/10 bg-[#172033] py-14 text-white md:py-18">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#c8a96b]/30 bg-[#c8a96b]/10 px-3 py-1.5 text-xs font-black text-[#dfc58f]"><Gavel className="h-4 w-4"/> موضوع مطلوب من داخل وخارج الإمارات</div><h2 className="mt-4 text-3xl font-black md:text-4xl">الاسترحام وإلغاء الإبعاد من الإمارات</h2><p className="mt-3 text-base font-semibold leading-8 text-[#c4beb5]">خصصنا مساراً واضحاً للمصري الموجود في مصر، مع فصل الإبعاد القضائي عن الإداري؛ لأن الجهة والمستندات وطريقة الدراسة تختلف.</p></div><a href="/deportation-uae-guide" className="justify-self-start rounded-xl bg-[#c8a96b] px-5 py-3 text-sm font-black text-[#101826] lg:justify-self-end">فتح الدليل الشامل</a></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">{deportationGuides.map(x=><a key={x.href} href={x.href} className="rounded-3xl border border-white/10 bg-white/[.055] p-5 transition hover:-translate-y-1 hover:border-[#c8a96b]/50 hover:bg-white/[.08]"><div className="mb-3 flex items-center gap-2 text-[#dfc58f]"><FileText className="h-5 w-5"/><span className="text-xs font-black">دليل عام</span></div><h3 className="text-lg font-black leading-7">{x.title}</h3><p className="mt-2 text-sm font-medium leading-7 text-[#bbb5ac]">{x.desc}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#dfc58f]">اقرأ الدليل <ChevronLeft className="h-4 w-4"/></span></a>)}</div>
          <p className="mt-6 text-xs font-semibold leading-6 text-[#aaa49b]">المعلومات عامة ولا تعني ضمان قبول طلب الاسترحام أو رفع الإبعاد. يلزم فحص الحكم أو القرار والجهة المختصة في كل حالة.</p>
        </div>
      </section>

        <section className="border-y border-slate-200 bg-white px-4 py-10 md:px-8 lg:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-black text-amber-700">المكتبة القانونية العامة</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">معلومات تمهيدية قبل فتح الملف.</h2>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                  المحتوى للتعريف العام فقط، ولا يعد رأيًا قانونيًا في واقعة محددة.
                </p>
              </div>
              <Link
                to="/PublicLegalLibrary"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white"
              >
                <BookOpen className="h-4 w-4" /> فتح المكتبة
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {legalPreview.map((item) => (
                <Link
                  key={item.id}
                  to="/PublicLegalLibrary"
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-900 hover:bg-white"
                >
                  <span className="text-xs font-black text-amber-700">{item.category}</span>
                  <h3 className="mt-3 text-base font-black leading-7 text-slate-950">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-7 text-slate-600">{item.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-blue-900">
                    قراءة الموضوع <ArrowLeft className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 px-4 py-6 text-slate-300 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-bold md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black text-white">{officeName}</p>
            <p className="mt-1 text-xs leading-6 text-slate-400">استشارات ودراسات وبحوث في مجال العلوم القانونية.</p>
          </div>
          <div className="text-xs leading-6 text-slate-400 md:text-left">
            <p>لا ترسل بيانات أو مستندات قضايا في صفحات عامة.</p>
            <p>© {new Date().getFullYear()} جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  )
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8"><div className="rounded-[30px] border border-[#e2d9ca] bg-white p-7 md:flex md:items-center md:justify-between md:gap-8"><div><div className="flex items-center gap-2 text-[#9a793d]"><Search className="h-5 w-5"/><span className="text-xs font-black">مركز المعرفة</span></div><h2 className="mt-2 text-2xl font-black">المكتبة القانونية العامة</h2><p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[#6c655b]">محتوى قانوني إضافي يمكن تصفحه دون كشف أي بيانات خاصة بالموكلين أو ملفات المكتب.</p></div><Link to="/PublicLegalLibrary" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#172033] px-5 py-3 text-sm font-black text-white md:mt-0"><BookOpen className="h-4 w-4"/> فتح المكتبة</Link></div></section>
    </main>

    <footer className="border-t border-[#e0d9cf] bg-[#faf8f4] px-4 py-6 md:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm font-bold text-[#716a60]"><span>{officeName} © {new Date().getFullYear()}</span><span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-[#9a793d]"/> HELM Legal — UAE • Egypt • International</span></div></footer>
  </div>
}
