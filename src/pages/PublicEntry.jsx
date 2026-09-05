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
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'

const NAV_LINK = 'rounded-xl px-4 py-2 text-sm font-black text-[#d8d2c7] transition hover:bg-white/[.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a96b]'
const PRIMARY_NAV = 'rounded-xl border border-[#c8a96b]/40 bg-[#c8a96b] px-4 py-2 text-sm font-black text-[#111827] shadow-lg shadow-black/10 transition hover:bg-[#d9bc82] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e6cf9c]'
const FIELD_CLASS = 'h-13 w-full rounded-2xl border border-[#ddd6ca] bg-[#fbfaf7] px-4 text-sm font-bold text-[#172033] outline-none transition placeholder:text-[#9c9589] focus:border-[#b79656] focus:bg-white focus:ring-4 focus:ring-[#c8a96b]/10'

function AuthErrorCard({ error, onRetry }) {
  const isSetup = error?.type === 'oauth_error' || error?.type === 'network_error'
  const isNoReg = error?.type === 'user_not_registered'

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-right">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <AlertCircle className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-rose-950">
            {isNoReg ? 'الحساب غير مفعل داخل المكتب' : isSetup ? 'تعذر إكمال تسجيل الدخول' : 'فشل تسجيل الدخول'}
          </p>
          <p className="mt-1 text-xs font-semibold leading-6 text-rose-800">{error?.message}</p>
        </div>
      </div>
      {isNoReg && (
        <p className="mt-3 border-t border-rose-200 pt-3 text-xs font-semibold leading-6 text-rose-800">
          اطلب من إدارة المكتب إضافة بريدك ضمن الصلاحيات المعتمدة قبل الدخول.
        </p>
      )}
      {isSetup && (
        <p className="mt-3 border-t border-rose-200 pt-3 text-xs font-semibold leading-6 text-rose-800">
          يمكنك المحاولة مجددًا أو استخدام تسجيل الدخول بالبريد الإلكتروني.
        </p>
      )}
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-3 py-2 text-xs font-black text-white transition hover:bg-rose-800"
      >
        <RefreshCw className="h-3.5 w-3.5" /> إعادة المحاولة
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
  const busy = emailLoading || isLoadingAuth
  const tabClass = (mode) =>
    `relative h-11 rounded-xl px-3 text-sm font-black transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a96b] ${
      authMode === mode
        ? 'bg-[#172033] text-white shadow-lg shadow-[#172033]/15'
        : 'text-[#6f685d] hover:bg-white hover:text-[#172033]'
    }`

  return (
    <aside id="login" className="relative w-full overflow-hidden rounded-[30px] border border-[#e1dbd0] bg-white shadow-[0_28px_80px_rgba(23,32,51,.13)] lg:max-w-[440px]">
      <div className="h-1.5 w-full bg-gradient-to-l from-[#172033] via-[#c8a96b] to-[#172033]" />

      <div className="p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#e8dfce] bg-[#f8f4ec] px-3 py-1.5 text-[11px] font-black text-[#8b6b31]">
              <ShieldCheck className="h-3.5 w-3.5" /> HELM PORTAL
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[#172033]">مرحباً بعودتك</h2>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-[#787166]">أدخل بياناتك للوصول إلى مساحة العمل القانونية.</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#172033] text-[#d9bc82] shadow-lg shadow-[#172033]/20">
            <LogIn className="h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-[#e6e0d6] bg-[#f4f1eb] p-1">
          <button type="button" onClick={() => setAuthMode('login')} className={tabClass('login')}>تسجيل الدخول</button>
          <button type="button" onClick={() => setAuthMode('signup')} className={tabClass('signup')}>حساب جديد</button>
        </div>

        <div className="mt-6 space-y-4">
          {authError && <AuthErrorCard error={authError} onRetry={() => checkAppState?.()} />}
          {notice && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold leading-7 text-emerald-900">
              {notice}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <label className="block">
                <span className="mb-2 block text-xs font-black text-[#544e45]">الاسم الكامل</span>
                <div className="relative">
                  <UserPlus className="absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#8f8678]" />
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className={`${FIELD_CLASS} pr-11`}
                    placeholder="الاسم كما سيظهر داخل النظام"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-xs font-black text-[#544e45]">البريد الإلكتروني</span>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#8f8678]" />
                <input
                  dir="ltr"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={`${FIELD_CLASS} pr-11 text-left`}
                  placeholder="name@example.com"
                />
              </div>
            </label>

            <label className="block">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-black text-[#544e45]">كلمة المرور</span>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={onReset}
                    disabled={emailLoading || !form.email}
                    className="text-[11px] font-black text-[#92723a] transition hover:text-[#5e451d] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#8f8678]" />
                <input
                  dir="ltr"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className={`${FIELD_CLASS} pr-11 pl-11 text-left`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#8f8678] transition hover:bg-[#f0ece4] hover:text-[#172033]"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#172033] text-sm font-black text-white shadow-xl shadow-[#172033]/20 transition-all hover:-translate-y-0.5 hover:bg-[#222d43] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {emailLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {authMode === 'signup' ? 'إنشاء الحساب' : 'دخول إلى HELM PORTAL'}
                  <ChevronLeft className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 text-[11px] font-black text-[#aaa296]">
            <span className="h-px flex-1 bg-[#e7e1d7]" />
            <span>أو تابع باستخدام</span>
            <span className="h-px flex-1 bg-[#e7e1d7]" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={googleLoading || isLoadingAuth}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#ddd6ca] bg-white text-sm font-black text-[#172033] transition hover:border-[#bfa36c] hover:bg-[#fbf8f2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading || isLoadingAuth ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d7d0c5] border-t-[#172033]" />
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 text-[#9a793d]" />
                الدخول بحساب Google
                <ChevronLeft className="h-4 w-4 text-[#91897e]" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#f8f5ef] px-3 py-3 text-[11px] font-bold text-[#777065]">
            <Lock className="h-3.5 w-3.5 text-[#9a793d]" />
            بيانات المكتب لا تظهر إلا وفق صلاحية الحساب المسجل.
          </div>
        </div>
      </div>
    </aside>
  )
}

function ServiceCard({ icon: Icon, title, desc }) {
  return (
    <div className="group rounded-3xl border border-[#e3ded5] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#172033] text-[#d9bc82] transition group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-black text-[#172033]">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-7 text-[#696258]">{desc}</p>
    </div>
  )
}

function RoleCard({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.055] p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c8a96b]/25 bg-[#c8a96b]/10 text-[#dfc48e]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">{title}</h3>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-[#bdb7ae]">{desc}</p>
        </div>
      </div>
    </div>
  )
}

function PremiumIntro({ officeName }) {
  return (
    <div className="relative z-10 flex h-full flex-col justify-between gap-10">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c8a96b]/25 bg-[#c8a96b]/10 px-4 py-2 text-xs font-black text-[#e2c993]">
          <Sparkles className="h-3.5 w-3.5" /> منصة العمل القانوني الذكية
        </div>

        <div className="mt-7 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#a9a397]">HELM LEGAL WORKSPACE</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.25] text-white md:text-5xl xl:text-6xl">
            إدارة قانونية أكثر وضوحاً،
            <span className="mt-1 block text-[#dcc084]">من أول ملف حتى آخر إجراء.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#c7c1b7] md:text-lg">
            {officeName} — مساحة واحدة تجمع القضايا والموكلين والمستندات والمواعيد والتواصل، بصلاحيات دقيقة لكل مستخدم.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/PublicLegalLibrary"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-5 text-sm font-black text-white transition hover:border-[#c8a96b]/50 hover:bg-white/[.1]"
          >
            <BookOpen className="h-4 w-4 text-[#d9bc82]" /> المكتبة القانونية <ArrowLeft className="h-4 w-4" />
          </Link>
          <a
            href="#services"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-[#c7c1b7] transition hover:bg-white/[.05] hover:text-white"
          >
            استكشف خدمات البوابة <ChevronLeft className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <RoleCard icon={Landmark} title="إدارة المكتب" desc="القضايا والموكلون والجلسات والصلاحيات." />
        <RoleCard icon={Users} title="بوابة الموكل" desc="متابعة الملف والمواعيد والمستندات المصرح بها." />
        <RoleCard icon={Handshake} title="الوصول المخصص" desc="كل مستخدم يرى فقط ما تسمح به صلاحياته." />
      </div>
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
    if (result?.ok && authMode === 'signup') {
      setNotice('تم إنشاء الحساب. إذا كان تأكيد البريد مفعلاً، افتح بريدك واضغط رابط التفعيل أولاً.')
    }
  }

  const handleResetPassword = async () => {
    setNotice('')
    setEmailLoading(true)
    const result = await resetPasswordForEmail(form.email)
    setEmailLoading(false)
    if (result?.ok) setNotice('تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد المدخل إن كان مسجلاً.')
  }

  useEffect(() => {
    if (authError) {
      setGoogleLoading(false)
      setEmailLoading(false)
    }
  }, [authError])

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f2ec] text-[#172033]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101826]/95 shadow-lg shadow-black/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:px-8">
          <OfficeBrandMark
            logoUrl={officeLogo}
            officeName={officeName}
            subtitle="HELM PORTAL — البوابة القانونية"
            compact
            tone="light"
          />

          <nav className="hidden items-center gap-1 md:flex">
            <a href="#services" className={NAV_LINK}>الخدمات</a>
            <a href="#library" className={NAV_LINK}>المكتبة القانونية</a>
            <a href="#login" className={PRIMARY_NAV}>دخول البوابة</a>
          </nav>

          <a href="#login" className="rounded-xl bg-[#c8a96b] px-4 py-2 text-sm font-black text-[#111827] shadow-sm md:hidden">
            دخول
          </a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#101826]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 -top-36 h-[430px] w-[430px] rounded-full bg-[#c8a96b]/10 blur-3xl" />
            <div className="absolute -bottom-48 left-[18%] h-[520px] w-[520px] rounded-full bg-[#304a6e]/20 blur-3xl" />
            <div className="absolute inset-0 opacity-[.055]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.45) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
          </div>

          <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12 lg:min-h-[660px] lg:flex-row lg:items-stretch lg:gap-12 lg:py-14">
            <div className="flex-1 lg:py-4">
              <PremiumIntro officeName={officeName} />
            </div>

            <div className="flex w-full items-center lg:w-[440px] lg:shrink-0">
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
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dfd2b8] bg-[#eee5d3] px-3 py-1.5 text-xs font-black text-[#765825]">
                <CheckCircle2 className="h-3.5 w-3.5" /> منظومة واحدة للعمل اليومي
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#172033] md:text-4xl">كل ما يحتاجه المكتب، في مساحة مرتبة.</h2>
              <p className="mt-3 text-base font-medium leading-8 text-[#696258]">
                من فتح ملف الموكل وحتى متابعة التنفيذ، كل خدمة داخل البوابة لها مكان واضح وسجل يمكن الرجوع إليه.
              </p>
            </div>
            <a href="#login" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#172033] px-5 text-sm font-black text-white transition hover:bg-[#26334b]">
              فتح حسابي <ChevronLeft className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ServiceCard icon={Gavel} title="إدارة القضايا" desc="ملف قضية واضح مرتبط بالموكل والمستندات والجلسات والملاحظات والإجراءات." />
            <ServiceCard icon={FileText} title="المذكرات والمستندات" desc="أرشفة منظمة للمذكرات والطلبات والمرفقات مع سهولة البحث والوصول." />
            <ServiceCard icon={CalendarDays} title="الجلسات والمواعيد" desc="متابعة الجلسات والمواعيد والمهام القانونية المهمة داخل كل ملف." />
            <ServiceCard icon={MessageCircle} title="التواصل" desc="تنظيم بيانات التواصل والملاحظات والرسائل المرتبطة بالموكل والقضية." />
            <ServiceCard icon={FolderArchive} title="الأرشيف" desc="حفظ الملفات في بنية واضحة تقلل التشتت بين البريد وواتساب ومجلدات الجهاز." />
            <ServiceCard icon={Building2} title="الصلاحيات" desc="فصل دقيق بين الإدارة والموظفين والموكلين وكل حساب بحسب دوره." />
          </div>
        </section>

        <section id="library" className="border-y border-white/10 bg-[#172033] py-12 text-white md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#c8a96b]/25 bg-[#c8a96b]/10 px-3 py-1.5 text-xs font-black text-[#dfc58f]">
                  <BookOpen className="h-3.5 w-3.5" /> المكتبة القانونية العامة
                </div>
                <h2 className="mt-4 text-3xl font-black">مدخل قانوني واضح قبل فتح الملف.</h2>
                <p className="mt-3 max-w-3xl text-base font-medium leading-8 text-[#c1bbc0]">
                  محتوى تعريفي يساعد الزائر على فهم نوع النزاع والمستندات الأولية دون إظهار أي بيانات خاصة بالقضايا أو الموكلين.
                </p>
              </div>
              <Link to="/PublicLegalLibrary" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c8a96b] px-5 text-sm font-black text-[#111827] transition hover:bg-[#d9bc82]">
                <Search className="h-4 w-4" /> فتح المكتبة
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {legalPreview.map((item) => (
                <Link
                  key={item.id}
                  to="/PublicLegalLibrary"
                  className="group rounded-3xl border border-white/10 bg-white/[.045] p-5 transition hover:-translate-y-1 hover:border-[#c8a96b]/45 hover:bg-white/[.07]"
                >
                  <span className="inline-flex rounded-full bg-[#c8a96b]/15 px-3 py-1 text-xs font-black text-[#e0c590]">{item.category}</span>
                  <h3 className="mt-4 text-base font-black leading-7 text-white group-hover:text-[#e0c590]">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm font-medium leading-7 text-[#bdb7ae]">{item.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e0d9cf] bg-[#faf8f4] px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm font-bold text-[#716a60]">
          <span>{officeName} © {new Date().getFullYear()}</span>
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#9a793d]" /> HELM PORTAL — Legal Workspace</span>
        </div>
      </footer>
    </div>
  )
}
