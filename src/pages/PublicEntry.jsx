import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { PUBLIC_LEGAL_LIBRARY } from '@/lib/publicLegalLibrary'
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
        </div>
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
}
