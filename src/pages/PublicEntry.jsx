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
  return (
    <aside id="login" className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/12 md:p-6">
      <div className="mb-5 rounded-3xl bg-slate-950 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black">دخول البوابة</h2>
            <p className="mt-1 text-sm font-bold text-slate-300">للمكتب، الموكلين، الموظفين، والبروكر</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
        <button type="button" onClick={() => setAuthMode('login')} className={`h-11 rounded-xl text-sm font-black transition ${authMode === 'login' ? 'bg-slate-950 text-white shadow' : 'text-slate-700 hover:bg-white'}`}>تسجيل دخول</button>
        <button type="button" onClick={() => setAuthMode('signup')} className={`h-11 rounded-xl text-sm font-black transition ${authMode === 'signup' ? 'bg-slate-950 text-white shadow' : 'text-slate-700 hover:bg-white'}`}>إنشاء حساب</button>
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
                <input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-300 bg-white pr-11 pl-4 text-sm font-bold text-slate-950 outline-none focus:border-slate-950" placeholder="الاسم كما يظهر داخل النظام" />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-800">البريد الإلكتروني</span>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-300 bg-white pr-11 pl-4 text-sm font-bold text-slate-950 outline-none focus:border-slate-950" placeholder="name@example.com" />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-800">كلمة المرور</span>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input type={showPassword ? 'text' : 'password'} required autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-300 bg-white pr-11 pl-11 text-sm font-bold text-slate-950 outline-none focus:border-slate-950" placeholder="••••••••" />
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
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="بوابة المكتب والموكلين" compact />
          <nav className="hidden items-center gap-2 md:flex">
            <a href="#services" className="rounded-xl px-4 py-2 text-sm font-black text-white hover:bg-white/10">الخدمات</a>
            <a href="#library" className="rounded-xl px-4 py-2 text-sm font-black text-white hover:bg-white/10">المكتبة القانونية</a>
            <a href="#login" className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">دخول البوابة</a>
          </nav>
          <a href="#login" className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 md:hidden">دخول</a>
        </div>
      </header>

      <main>
        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-8 lg:grid-cols-[1fr,430px] lg:py-14">
            <div className="space-y-7">
              <div className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-slate-950">بوابة قانونية واضحة للمكتب والموكلين</div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black leading-tight text-slate-950 md:text-6xl">
                  مكتب قانوني منظم. ملف موكل واضح. متابعة بلا فوضى.
                </h1>
                <p className="max-w-3xl text-lg font-medium leading-9 text-slate-700">
                  {officeName} يقدّم بوابة موحدة لإدارة القضايا والمستندات والجلسات والتواصل. كل مستخدم يرى ما يخصه فقط: الإدارة ترى النظام، الموكل يرى ملفه، والبروكر يرى الملفات المرتبطة به دون حسابات مالية.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a href="#login" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-lg shadow-slate-900/20">دخول المكتب والموكلين <ChevronLeft className="h-4 w-4" /></a>
                <Link to="/PublicLegalLibrary" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 text-sm font-black text-slate-950">تصفح المكتبة القانونية <ArrowLeft className="h-4 w-4" /></Link>
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
            <h2 className="mt-2 text-3xl font-black text-slate-950">واجهة عملية بدل الكلام العام</h2>
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
                <h2 className="mt-2 text-3xl font-black">محتوى واضح قبل فتح الملف</h2>
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
