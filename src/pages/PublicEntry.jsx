import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { PUBLIC_LEGAL_LIBRARY } from '@/lib/publicLegalLibrary'
import OfficeBrandMark from '@/components/helm/OfficeBrandMark'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  FileText,
  FolderArchive,
  Gavel,
  Handshake,
  Landmark,
  Lock,
  LogIn,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'

const NAV_LINK = 'rounded-2xl border border-transparent px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
const PRIMARY_NAV = 'rounded-2xl bg-blue-900 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'

function AuthErrorCard({ error, onRetry }) {
  const isSetup = error?.type === 'oauth_error' || error?.type === 'network_error'
  const isNoReg = error?.type === 'user_not_registered'
  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-right">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div>
          <p className="text-sm font-black text-red-900">{isNoReg ? 'الحساب غير مفعل داخل المكتب' : isSetup ? 'تعذر إكمال تسجيل الدخول' : 'فشل تسجيل الدخول'}</p>
          <p className="mt-1 text-xs leading-6 text-red-800">{error?.message}</p>
        </div>
      </div>
      {isNoReg && <p className="mt-3 border-t border-red-200 pt-3 text-xs leading-6 text-red-800">اطلب من إدارة المكتب إضافة بريدك ضمن صلاحيات موظف أو موكل أو بروكر قبل الدخول.</p>}
      {isSetup && <p className="mt-3 border-t border-red-200 pt-3 text-xs leading-6 text-red-800">راجع إعدادات Supabase Auth أو استخدم الدخول بالإيميل لحين ضبط Google.</p>}
      <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-700 px-3 py-2 text-xs font-black text-white">
        <RefreshCw className="h-3.5 w-3.5" /> إعادة الفحص
      </button>
    </div>
  )
}

function LoginPanel({ authMode, setAuthMode, form, setForm, showPassword, setShowPassword, authError, notice, emailLoading, isLoadingAuth, googleLoading, onSubmit, onReset, onGoogle, checkAppState }) {
  const tabClass = (mode) => `h-11 rounded-xl border text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${authMode === mode ? 'border-amber-400 bg-amber-300 text-slate-950 shadow-sm' : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'}`
  return (
    <aside id="login" className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/12 md:p-6">
      <div className="mb-5 rounded-3xl bg-blue-900 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black">دخول البوابة</h2>
            <p className="mt-1 text-sm font-bold text-blue-100">للمكتب، الموكلين، الموظفين، والبروكر</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
        <button type="button" onClick={() => setAuthMode('login')} className={tabClass('login')}>تسجيل دخول</button>
        <button type="button" onClick={() => setAuthMode('signup')} className={tabClass('signup')}>إنشاء حساب</button>
      </div>

      <div className="mt-5 space-y-4">
        {authError && <AuthErrorCard error={authError} onRetry={() => checkAppState?.()} />}
        {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold leading-7 text-emerald-900">{notice}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          {authMode === 'signup' && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-black text-slate-800">الاسم الكامل</span>
              <div className="relative">
                <UserPlus className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-300 bg-white pr-11 pl-4 text-sm font-bold text-slate-950 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" placeholder="الاسم كما يظهر داخل النظام" />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-800">البريد الإلكتروني</span>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-300 bg-white pr-11 pl-4 text-sm font-bold text-slate-950 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" placeholder="name@example.com" />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-800">كلمة المرور</span>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input type={showPassword ? 'text' : 'password'} required autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-300 bg-white pr-11 pl-11 text-sm font-bold text-slate-950 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <button type="submit" disabled={emailLoading || isLoadingAuth} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 text-sm font-black text-slate-950 shadow-lg shadow-amber-300/30 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60">
            {emailLoading ? <div className="h-5 w-5 rounded-full border-2 border-slate-900/30 border-t-slate-950 animate-spin" /> : authMode === 'signup' ? 'إنشاء حساب' : 'دخول إلى البوابة'}
            {!emailLoading && <ChevronLeft className="h-4 w-4" />}
          </button>
        </form>

        <button type="button" onClick={onReset} disabled={emailLoading || !form.email} className="text-sm font-black text-slate-700 underline underline-offset-4 hover:text-slate-950 disabled:opacity-40">
          نسيت كلمة المرور؟ أدخل البريد ثم اضغط هنا.
        </button>

        <div className="flex items-center gap-3 text-xs font-black text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> أو <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button onClick={onGoogle} disabled={googleLoading || isLoadingAuth} className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white text-sm font-black text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
          {(googleLoading || isLoadingAuth) ? <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-950 animate-spin" /> : <>
            <ShieldCheck className="h-5 w-5" /> تسجيل الدخول عبر Google <ChevronLeft className="h-4 w-4" />
          </>}
        </button>
      </div>
    </aside>
  )
}

function ServiceCard({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-7 text-slate-700">{desc}</p>
    </div>
  )
}

function RoleCard({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm"><Icon className="h-5 w-5" /></div>
        <h3 className="text-base font-black text-slate-950">{title}</h3>
      </div>
      <p className="mt-3 text-sm font-medium leading-7 text-slate-700">{desc}</p>
    </div>
  )
}

function ProfessionalIntroCard({ officeName }) {
  return (
    <div className="space-y-7">
      <div className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-slate-950">منصة قانونية رقمية لإدارة ملفات الموكلين</div>
      <div className="space-y-4">
        <h1 className="max-w-4xl text-4xl font-black leading-tight text-slate-950 md:text-6xl">
          {officeName}
        </h1>
        <p className="max-w-3xl text-lg font-medium leading-9 text-slate-700">
          منصة مهنية لتنظيم ملفات الموكلين، متابعة القضايا، أرشفة المستندات، وإدارة التواصل القانوني بين المكتب والموكلين ضمن صلاحيات واضحة تحفظ سرية البيانات وتمنع تداخل الملفات.
        </p>
        <p className="max-w-3xl rounded-3xl border border-slate-200 bg-slate-50 p-5 text-base font-bold leading-8 text-slate-800">
          تهدف البوابة إلى تقديم تجربة متابعة قانونية أكثر انضباطًا: ملف لكل موكل، قضية لكل إجراء، ومستندات ومواعيد وملاحظات محفوظة في مكان واحد، مع فصل كامل بين صلاحيات الإدارة والموكل والبروكر والحسابات المالية.
        </p>
      </div>
    </div>
  )
}

export default function PublicEntry() {
  const { navigateToLogin, signInWithEmail, signUpWithEmail, resetPasswordForEmail, checkAppState, authError, isLoadingAuth, appPublicSettings } = useAuth()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  const officeName = appPublicSettings?.office_name || 'أحمد حلمي للاستشارات القانونية'
  const officeLogo = appPublicSettings?.logo_url || null
  const legalPreview = useMemo(() => PUBLIC_LEGAL_LIBRARY.slice(0, 4), [])

  const handleGoogleLogin = async () => {
    setNotice('')
    setGoogleLoading(true)
    await navigateToLogin()
    setTimeout(() => setGoogleLoading(false), 4000)
  }

  const handleEmailSubmit = async (event) => {
    event.preventDefault()
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
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="بوابة المكتب والموكلين" compact tone="dark" />
          <nav className="hidden items-center gap-2 md:flex">
            <a href="#services" className={NAV_LINK}>الخدمات</a>
            <a href="#library" className={NAV_LINK}>المكتبة القانونية</a>
            <a href="#login" className={PRIMARY_NAV}>دخول البوابة</a>
          </nav>
          <a href="#login" className="rounded-2xl bg-blue-900 px-4 py-2 text-sm font-black text-white shadow-sm md:hidden">دخول</a>
        </div>
      </header>

      <main>
        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-8 lg:grid-cols-[1fr,430px] lg:py-14">
            <div className="space-y-7">
              <ProfessionalIntroCard officeName={officeName} />

              <div className="flex flex-wrap gap-3">
                <a href="#login" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-900 px-6 text-sm font-black text-white shadow-lg shadow-slate-900/20 hover:bg-blue-800">دخول المكتب والموكلين <ChevronLeft className="h-4 w-4" /></a>
                <Link to="/PublicLegalLibrary" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 text-sm font-black text-slate-950 hover:border-blue-900">تصفح المكتبة القانونية <ArrowLeft className="h-4 w-4" /></Link>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <RoleCard icon={Landmark} title="للمكتب" desc="إدارة القضايا والموكلين والمستندات والجلسات والصلاحيات." />
                <RoleCard icon={Users} title="للموكل" desc="متابعة الملف والمواعيد والمستندات التي يصرح المكتب بإظهارها." />
                <RoleCard icon={Handshake} title="للبروكر" desc="رؤية الموكلين والقضايا المرتبطة به فقط دون أي بيانات مالية." />
              </div>
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

        <section id="services" className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <div className="mb-6 max-w-3xl">
            <p className="text-sm font-black text-amber-700">خدمات المكتب داخل البوابة</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">واجهة عملية لتنظيم العمل القانوني</h2>
            <p className="mt-3 text-base font-medium leading-8 text-slate-700">كل خدمة داخل البوابة لها مكان واضح: موكل، قضية، مستند، جلسة، مهمة، تواصل، وصلاحية.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ServiceCard icon={Gavel} title="إدارة القضايا" desc="ملف قضية واضح مرتبط بالموكل والمستندات والجلسات والملاحظات." />
            <ServiceCard icon={FileText} title="مذكرات ومستندات" desc="أرشفة منظمة للمذكرات والطلبات والمرفقات مع سهولة الوصول." />
            <ServiceCard icon={CalendarDays} title="جلسات ومواعيد" desc="متابعة المواعيد المهمة والمهام المرتبطة بكل ملف." />
            <ServiceCard icon={MessageCircle} title="تواصل منضبط" desc="حفظ بيانات التواصل والرسائل والملاحظات داخل ملف الموكل." />
            <ServiceCard icon={FolderArchive} title="أرشيف واضح" desc="تقليل ضياع الملفات بين واتساب والبريد ومجلدات الجهاز." />
            <ServiceCard icon={Building2} title="صلاحيات متعددة" desc="فصل صلاحيات الإدارة والموكل والبروكر والحسابات المالية." />
          </div>
        </section>

        <section id="library" className="bg-slate-950 py-10 text-white">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black text-amber-300">المكتبة القانونية العامة</p>
                <h2 className="mt-2 text-3xl font-black">محتوى قانوني تعريفي قبل فتح الملف</h2>
                <p className="mt-3 max-w-3xl text-base font-medium leading-8 text-slate-300">المكتبة تساعد الزائر على فهم نوع النزاع والمستندات المطلوبة دون فتح أي بيانات خاصة.</p>
              </div>
              <Link to="/PublicLegalLibrary" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 text-sm font-black text-slate-950"><Search className="h-4 w-4" /> فتح المكتبة بالكامل</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {legalPreview.map((item) => (
                <Link key={item.id} to="/PublicLegalLibrary" className="rounded-3xl border border-slate-700 bg-slate-900 p-5 transition hover:border-amber-300">
                  <span className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950">{item.category}</span>
                  <h3 className="mt-4 text-base font-black leading-7 text-white">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm font-medium leading-7 text-slate-300">{item.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-600">
          <span>{officeName} © {new Date().getFullYear()}</span>
          <span>بوابة مكتب قانوني — موكلين — قضايا — مكتبة عامة — صلاحيات</span>
        </div>
      </footer>
    </div>
  )
}
