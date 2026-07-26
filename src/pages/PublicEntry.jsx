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
  FolderLock,
  Gavel,
  Handshake,
  Landmark,
  Lock,
  LogIn,
  Mail,
  Menu,
  RefreshCw,
  Scale,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '#about', label: 'عن البوابة' },
  { href: '#services', label: 'الخدمات' },
  { href: '#library', label: 'المكتبة' },
  { href: '#faq', label: 'الأسئلة' },
]

const SERVICES = [
  { icon: Scale, title: 'الاستشارات القانونية', desc: 'دراسة الوقائع والمستندات وتحديد المسار القانوني المناسب وفق جهة الاختصاص.' },
  { icon: FileText, title: 'المذكرات والعقود', desc: 'إعداد ومراجعة المذكرات والطلبات والعقود بصياغة منظمة قابلة للمراجعة.' },
  { icon: Gavel, title: 'إدارة القضايا', desc: 'ربط كل قضية بالموكل والمستندات والجلسات والملاحظات والإجراءات.' },
  { icon: CalendarDays, title: 'المواعيد والمهام', desc: 'متابعة الجلسات والمواعيد والمهام المهمة داخل ملف واحد.' },
  { icon: FolderLock, title: 'المستندات الآمنة', desc: 'إظهار المستندات للمستخدم المصرح له فقط وفق الصلاحيات المعتمدة.' },
  { icon: Building2, title: 'الشركات والأعمال', desc: 'تنظيم ملفات الشركات والعقود والمطالبات والنزاعات التجارية.' },
]

const ROLES = [
  { icon: Landmark, title: 'إدارة المكتب', desc: 'إدارة القضايا والموكلين والمستندات والصلاحيات.' },
  { icon: Users, title: 'الموكل', desc: 'متابعة الملف والمواعيد والمستندات المصرح بعرضها.' },
  { icon: Handshake, title: 'البروكر', desc: 'الوصول إلى الملفات المرتبطة به فقط وفق الصلاحية.' },
]

const FAQS = [
  {
    q: 'هل إنشاء الحساب يعني قبول القضية؟',
    a: 'لا. إنشاء الحساب يتيح تقديم البيانات الأولية، ولا يعد قبولًا للتكليف أو ضمانًا لأي نتيجة قانونية.'
  },
  {
    q: 'هل يمكن إرسال مستندات القضية من الصفحة العامة؟',
    a: 'لا يُنصح بإرسال مستندات أو بيانات شخصية في صفحة عامة. يتم رفع الملفات بعد الدخول إلى الحساب المخصص داخل البوابة.'
  },
  {
    q: 'من يمكنه الاطلاع على ملفي؟',
    a: 'تخضع الملفات لصلاحيات المستخدم، ويظهر لكل حساب ما تصرح به إدارة المكتب وفق دوره وارتباطه بالملف.'
  },
  {
    q: 'هل تقدم الصفحة معلومات قانونية نهائية؟',
    a: 'المحتوى العام للتعريف فقط. الرأي القانوني في واقعة محددة يتطلب مراجعة الوقائع والمستندات وتحديد الاختصاص.'
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
      {isNoReg && <p className="mt-3 border-t border-red-200 pt-3 text-xs leading-6 text-red-800">اطلب من إدارة المكتب إضافة بريدك ضمن الصلاحية المناسبة قبل الدخول.</p>}
      {isSetup && <p className="mt-3 border-t border-red-200 pt-3 text-xs leading-6 text-red-800">راجع إعدادات Supabase Auth أو استخدم الدخول بالبريد لحين ضبط Google.</p>}
      <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-700 px-3 py-2 text-xs font-black text-white">
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
  const tabClass = (mode) => `h-11 rounded-xl border text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${authMode === mode ? 'border-amber-400 bg-amber-300 text-slate-950 shadow-sm' : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'}`

  return (
    <aside id="login" className="scroll-mt-28 rounded-[30px] border border-white/15 bg-white p-5 text-slate-950 shadow-2xl shadow-slate-950/30 md:p-6">
      <div className="mb-5 rounded-3xl bg-gradient-to-br from-blue-950 to-blue-800 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black">دخول حلم بروتال</h2>
            <p className="mt-1 text-sm font-bold text-blue-100">للمكتب والموكلين والموظفين والبروكر</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
        <button type="button" onClick={() => setAuthMode('login')} className={tabClass('login')}>تسجيل الدخول</button>
        <button type="button" onClick={() => setAuthMode('signup')} className={tabClass('signup')}>إنشاء حساب</button>
      </div>

      <div className="mt-5 space-y-4">
        {authError && <AuthErrorCard error={authError} onRetry={() => checkAppState?.({ force: true })} />}
        {notice && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold leading-7 text-emerald-900">{notice}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          {authMode === 'signup' && (
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
                autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className={`${inputClass} pl-11`}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950" aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <button type="submit" disabled={emailLoading || isLoadingAuth} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 text-sm font-black text-slate-950 shadow-lg shadow-amber-300/30 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60">
            {emailLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-950" /> : authMode === 'signup' ? 'إنشاء الحساب' : 'دخول إلى البوابة'}
            {!emailLoading && <ChevronLeft className="h-4 w-4" />}
          </button>
        </form>

        <button type="button" onClick={onReset} disabled={emailLoading || !form.email} className="text-sm font-black text-slate-700 underline underline-offset-4 hover:text-slate-950 disabled:opacity-40">
          نسيت كلمة المرور؟ أدخل البريد ثم اضغط هنا.
        </button>

        <div className="flex items-center gap-3 text-xs font-black text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> أو <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button type="button" onClick={onGoogle} disabled={googleLoading || isLoadingAuth} className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white text-sm font-black text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
          {(googleLoading || isLoadingAuth) ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" /> : <><ShieldCheck className="h-5 w-5" /> تسجيل الدخول عبر Google <ChevronLeft className="h-4 w-4" /></>}
        </button>
      </div>
    </aside>
  )
}

function ServiceCard({ icon: Icon, title, desc }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-950 text-amber-300"><Icon className="h-5 w-5" /></div>
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-7 text-slate-700">{desc}</p>
    </article>
  )
}

function RoleCard({ icon: Icon, title, desc }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-300 text-slate-950"><Icon className="h-5 w-5" /></div>
        <h3 className="text-base font-black text-white">{title}</h3>
      </div>
      <p className="mt-3 text-sm font-medium leading-7 text-blue-100">{desc}</p>
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  const officeName = appPublicSettings?.office_name || 'أحمد حلمي للاستشارات القانونية'
  const officeLogo = appPublicSettings?.logo_url || null
  const legalPreview = useMemo(() => PUBLIC_LEGAL_LIBRARY.slice(0, 6), [])

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
      setNotice('تم إنشاء الحساب. إذا كان تأكيد البريد مفعلًا، افتح بريدك واضغط رابط التفعيل قبل الدخول.')
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
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white shadow-xl backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="الاستشارات القانونية وحلم بروتال" compact />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
            {NAV_ITEMS.map((item) => <a key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-black text-slate-200 transition hover:bg-white/10 hover:text-white">{item.label}</a>)}
            <a href="#login" className="mr-2 inline-flex h-10 items-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-black text-slate-950 transition hover:bg-amber-200"><LogIn className="h-4 w-4" /> دخول البوابة</a>
          </nav>

          <button type="button" onClick={() => setMobileOpen((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 lg:hidden" aria-label="فتح القائمة" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="grid gap-1 border-t border-white/10 px-4 py-3 lg:hidden" aria-label="التنقل على الهاتف">
            {NAV_ITEMS.map((item) => <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black text-slate-200 hover:bg-white/10">{item.label}</a>)}
            <a href="#login" onClick={() => setMobileOpen(false)} className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-black text-slate-950"><LogIn className="h-4 w-4" /> دخول البوابة</a>
          </nav>
        )}
      </header>

      <main>
        <section id="about" className="scroll-mt-24 overflow-hidden bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.32),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(245,158,11,0.18),transparent_28%),linear-gradient(135deg,#020617,#0b1f46_55%,#07142d)] text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-8 lg:grid-cols-[1fr,430px] lg:items-center lg:py-16">
            <div>
              <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-200">منصة قانونية رقمية في دولة الإمارات</span>
              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">استشارة قانونية منظمة، وملف إلكتروني أكثر وضوحًا.</h1>
              <p className="mt-5 max-w-3xl text-lg font-medium leading-9 text-blue-100">تجمع حلم بروتال بين إدارة ملفات الموكلين والقضايا والمستندات والمواعيد، مع فصل الصلاحيات والمحافظة على سرية البيانات.</p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#login" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-6 text-sm font-black text-slate-950 shadow-lg shadow-amber-300/20 transition hover:-translate-y-0.5 hover:bg-amber-200">دخول المكتب والموكلين <ChevronLeft className="h-4 w-4" /></a>
                <Link to="/PublicLegalLibrary" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/5 px-6 text-sm font-black text-white transition hover:bg-white/10">المكتبة القانونية <BookOpen className="h-4 w-4" /></Link>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {ROLES.map((role) => <RoleCard key={role.title} {...role} />)}
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

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl md:grid-cols-3">
            {[
              ['01', 'الوقائع أولًا', 'فهم التسلسل الزمني والمستندات قبل اختيار النص أو الإجراء.'],
              ['02', 'الدليل لكل طلب', 'ربط كل دفع أو مطالبة بالمستند أو الواقعة التي تسنده.'],
              ['03', 'صلاحية واضحة', 'إظهار البيانات لكل مستخدم بحسب دوره وارتباطه بالملف.'],
            ].map(([number, title, desc]) => (
              <article key={number} className="border-b border-slate-200 px-6 py-7 last:border-b-0 md:border-b-0 md:border-l md:last:border-l-0">
                <span className="text-xs font-black text-amber-700">{number}</span>
                <h2 className="mt-2 text-lg font-black text-slate-950">{title}</h2>
                <p className="mt-2 text-sm font-medium leading-7 text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="services" className="scroll-mt-24 px-4 py-12 md:px-8 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 max-w-3xl">
              <p className="text-sm font-black text-amber-700">الخدمات داخل المنصة</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">واجهة عملية لتنظيم العمل القانوني</h2>
              <p className="mt-3 text-base font-medium leading-8 text-slate-700">يُحدد نطاق الخدمة النهائي بعد مراجعة الوقائع والمستندات والتأكد من الاختصاص ونطاق الترخيص.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((service) => <ServiceCard key={service.title} {...service} />)}
            </div>
          </div>
        </section>

        <section id="library" className="scroll-mt-24 bg-slate-950 py-12 text-white lg:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-black text-amber-300">المكتبة القانونية العامة</p>
                <h2 className="mt-2 text-3xl font-black md:text-4xl">موضوعات تمهيدية قبل فتح الملف</h2>
                <p className="mt-3 text-base font-medium leading-8 text-slate-300">المحتوى العام يساعد على ترتيب المستندات والأسئلة، ولا يُعد رأيًا قانونيًا في واقعة محددة.</p>
              </div>
              <Link to="/PublicLegalLibrary" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 text-sm font-black text-slate-950"><BookOpen className="h-4 w-4" /> فتح المكتبة بالكامل</Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {legalPreview.map((item) => (
                <Link key={item.id} to="/PublicLegalLibrary" className="rounded-3xl border border-slate-700 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-amber-300">
                  <span className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950">{item.category}</span>
                  <h3 className="mt-4 text-base font-black leading-7 text-white">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm font-medium leading-7 text-slate-300">{item.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-amber-300">قراءة داخل المكتبة <ArrowLeft className="h-3.5 w-3.5" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 px-4 py-12 md:px-8 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr,1.2fr]">
            <div>
              <p className="text-sm font-black text-amber-700">قبل البدء</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">أسئلة مهمة عن الحساب والخدمة</h2>
              <p className="mt-3 text-base font-medium leading-8 text-slate-700">لا تعرض الصفحة نسب نجاح أو وعودًا زمنية غير قابلة للإثبات، ولا تحفظ بيانات قضايا في المتصفح.</p>
              <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-800" />
                  <p className="text-sm font-bold leading-7 text-blue-950">الترافع أمام المحاكم، عند الحاجة، يكون من خلال محامٍ مقيد ومخول قانونًا وفق نطاق التكليف.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
                  <summary className="cursor-pointer list-none py-5 text-sm font-black text-slate-950">{faq.q}</summary>
                  <p className="border-t border-slate-100 py-5 text-sm font-medium leading-7 text-slate-700">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-12 md:px-8 lg:pb-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[30px] bg-gradient-to-br from-blue-950 to-blue-800 p-7 text-white shadow-2xl shadow-blue-950/20 md:flex-row md:items-center md:p-10">
            <div>
              <p className="text-sm font-black text-amber-300">ابدأ بطريقة منظمة</p>
              <h2 className="mt-2 text-2xl font-black md:text-4xl">ادخل إلى حلم بروتال لإدارة ملفك بأمان.</h2>
              <p className="mt-3 text-sm font-medium leading-7 text-blue-100">لا ترسل مستندات قضايا أو بيانات شخصية في صفحات أو نماذج عامة.</p>
            </div>
            <a href="#login" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-6 text-sm font-black text-slate-950">دخول البوابة <ChevronLeft className="h-4 w-4" /></a>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 text-sm font-bold text-slate-600 md:grid-cols-3">
          <div><span className="font-black text-slate-950">{officeName}</span><p className="mt-1 text-xs leading-6">استشارات ودراسات وبحوث في مجال العلوم القانونية.</p></div>
          <div><span className="font-black text-slate-950">تنبيه مهني</span><p className="mt-1 text-xs leading-6">المعلومات العامة لا تُعد رأيًا قانونيًا في واقعة محددة.</p></div>
          <div className="md:text-left"><span>© {new Date().getFullYear()} جميع الحقوق محفوظة.</span><p className="mt-1 text-xs leading-6">موكلين — قضايا — مستندات — مكتبة عامة — صلاحيات.</p></div>
        </div>
      </footer>
    </div>
  )
}
