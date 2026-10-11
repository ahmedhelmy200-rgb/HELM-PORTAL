import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Briefcase, FileText, Gavel, Landmark, LockKeyhole, Scale, ShieldCheck } from 'lucide-react'
import OfficeBrandMark from '@/components/helm/OfficeBrandMark'
import { useAuth } from '@/lib/AuthContext'

const GUIDES = [
  { href: '/uae-legal-guides', title: 'دليل القانون الإماراتي', desc: 'أدلة عملية في التنفيذ والعمل والعقود والإثبات والمنازعات.' },
  { href: '/uae-criminal-guides', title: 'القضايا الجزائية', desc: 'الكفالة والاستئناف والمضبوطات والعفو ومنع السفر الجزائي.' },
  { href: '/judgment-execution-uae', title: 'تنفيذ الأحكام', desc: 'من السند التنفيذي إلى الإجراءات والطلبات المرتبطة بالتنفيذ.' },
  { href: '/labour-dispute-uae', title: 'النزاعات العمالية', desc: 'المستندات والمسار الإجرائي للمطالبات العمالية في الإمارات.' },
  { href: '/contracts-uae', title: 'العقود', desc: 'صياغة ومراجعة الالتزامات والجزاءات وشروط السداد والاختصاص.' },
  { href: '/international-legal-services', title: 'ملفات دولية', desc: 'تنسيق الملفات القانونية العابرة للحدود والعقود والمطالبات الدولية.' },
]


function PublicMeta({ title, description, path = '/' }) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const fullTitle = title.includes('HELM Legal') ? title : `${title} | HELM Legal`
    document.title = fullTitle

    const setMeta = (selector, attrs) => {
      let node = document.head.querySelector(selector)
      if (!node) {
        node = document.createElement('meta')
        document.head.appendChild(node)
      }
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value))
    }

    setMeta('meta[name="description"]', { name: 'description', content: description })
    setMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1' })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description })

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', `https://helm-protal.vercel.app${path === '/' ? '/' : path}`)

    return undefined
  }, [title, description, path])
  return null
}

const SERVICES = [
  { icon: Scale, title: 'مدني وتجاري', text: 'مطالبات مالية، عقود، مسؤولية وتعويض، ونزاعات تجارية.' },
  { icon: Gavel, title: 'قضايا وإجراءات', text: 'قراءة الموقف الإجرائي وتجهيز المستندات والطلبات وفق مرحلة الملف.' },
  { icon: Landmark, title: 'تنفيذ', text: 'مراجعة السند التنفيذي، المبالغ، والطلبات المرتبطة بملف التنفيذ.' },
  { icon: Briefcase, title: 'عمل وعقود', text: 'مراجعة علاقة العمل والعقود والمستحقات والمراسلات المرتبطة بها.' },
]

function PublicHeader() {
  const { appPublicSettings } = useAuth()
  const officeName = appPublicSettings?.office_name || 'أحمد حلمي للاستشارات القانونية'
  const officeLogo = appPublicSettings?.logo_url || null
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link to="/" aria-label="الرئيسية">
          <OfficeBrandMark logoUrl={officeLogo} officeName={officeName} subtitle="HELM Legal Consultancy" compact tone="dark" />
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-black text-slate-700" aria-label="التنقل العام">
          <Link className="rounded-xl px-3 py-2 hover:bg-slate-100" to="/about">عن المكتب</Link>
          <Link className="rounded-xl px-3 py-2 hover:bg-slate-100" to="/PublicLegalLibrary">المكتبة القانونية</Link>
          <Link className="rounded-xl px-3 py-2 hover:bg-slate-100" to="/contact">تواصل</Link>
          <Link className="rounded-xl bg-slate-950 px-4 py-2.5 text-white" to="/portal">دخول البوابة</Link>
        </nav>
      </div>
    </header>
  )
}

function PublicFooter() {
  return (
    <footer className="mt-14 border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.3fr,1fr,1fr] md:px-8">
        <div>
          <p className="text-lg font-black text-white">HELM Legal Consultancy</p>
          <p className="mt-3 max-w-xl text-sm leading-7">محتوى قانوني توعوي وخدمات استشارية قانونية. لا تُعد المعلومات المنشورة رأيًا قانونيًا خاصًا بملف بعينه دون مراجعة الوقائع والمستندات.</p>
        </div>
        <div>
          <p className="font-black text-white">الموقع</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/about">عن المكتب</Link>
            <Link to="/contact">تواصل معنا</Link>
            <Link to="/editorial-policy">سياسة التحرير والمراجعة</Link>
          </div>
        </div>
        <div>
          <p className="font-black text-white">السياسات</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/privacy">سياسة الخصوصية</Link>
            <Link to="/terms">شروط الاستخدام</Link>
            <Link to="/portal">بوابة الموكلين</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">© HELM Legal Consultancy — دولة الإمارات العربية المتحدة</div>
    </footer>
  )
}

function TrustStrip() {
  return (
    <section className="mx-auto mt-8 grid max-w-7xl gap-3 px-4 md:grid-cols-3 md:px-8">
      {[
        [ShieldCheck, 'محتوى عام دون بيانات موكلين'],
        [BookOpen, 'مراجعة وتحديث للمحتوى القانوني'],
        [LockKeyhole, 'بوابة منفصلة للملفات الخاصة'],
      ].map(([Icon, text]) => (
        <div key={text} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-700 shadow-sm">
          <Icon className="h-5 w-5 text-blue-900" /><span>{text}</span>
        </div>
      ))}
    </section>
  )
}

export function PublicHome() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-950">
      <PublicMeta
        title="أحمد حلمي للاستشارات القانونية | الإمارات ومصر ودوليًا | HELM Legal"
        description="محتوى قانوني وأدلة عملية في الإمارات والعقود والتنفيذ والمنازعات، مع بوابة منفصلة وآمنة لمتابعة ملفات الموكلين."
        path="/"
      />
      <PublicHeader />
      <main>
        <section className="bg-[radial-gradient(circle_at_15%_10%,rgba(30,64,175,.22),transparent_34%),linear-gradient(135deg,#020617,#102a56_60%,#07152e)] text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
            <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-200">HELM Legal Consultancy</span>
            <h1 className="mt-6 max-w-5xl text-4xl font-black leading-tight md:text-6xl">محتوى قانوني واضح، وتنظيم مهني للملف قبل اتخاذ الإجراء.</h1>
            <p className="mt-6 max-w-4xl text-lg font-medium leading-9 text-blue-100">موقع قانوني عام يضم أدلة عملية ومعلومات توعوية في القانون الإماراتي والعقود والتنفيذ والمنازعات، مع بوابة منفصلة وآمنة لمتابعة ملفات الموكلين.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/PublicLegalLibrary" className="rounded-2xl bg-amber-300 px-5 py-3.5 text-sm font-black text-slate-950">فتح المكتبة القانونية</Link>
              <Link to="/portal" className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-black text-white">دخول بوابة الموكلين</Link>
            </div>
          </div>
        </section>

        <TrustStrip />

        <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black text-amber-700">مجالات العمل</p>
            <h2 className="mt-2 text-3xl font-black">ابدأ بفهم نوع الملف والمستندات المؤثرة فيه</h2>
            <p className="mt-4 text-base font-medium leading-8 text-slate-600">الغرض من المحتوى العام هو مساعدة القارئ على ترتيب الوقائع والمستندات والأسئلة الصحيحة قبل الاستشارة أو الإجراء.</p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-950 text-amber-300"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black text-amber-700">أدلة مختارة</p>
                <h2 className="mt-2 text-3xl font-black">موضوعات قانونية عملية</h2>
              </div>
              <Link to="/PublicLegalLibrary" className="text-sm font-black text-blue-900 underline underline-offset-4">عرض المكتبة كاملة</Link>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {GUIDES.map((item) => (
                <a key={item.href} href={item.href} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-900 hover:shadow-lg">
                  <FileText className="h-6 w-6 text-blue-900" />
                  <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-7 text-slate-600">{item.desc}</p>
                  <span className="mt-4 inline-block text-sm font-black text-blue-900">قراءة الدليل</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <div className="grid gap-6 rounded-[32px] bg-blue-950 p-7 text-white md:grid-cols-[1fr,auto] md:items-center md:p-10">
            <div>
              <h2 className="text-2xl font-black md:text-3xl">هل لديك ملف قائم بالفعل؟</h2>
              <p className="mt-3 max-w-3xl text-base font-medium leading-8 text-blue-100">استخدم بوابة الموكلين فقط لمتابعة الملفات والمستندات والمعلومات المصرح بها. المحتوى العام يظل منفصلًا عن بيانات القضايا الخاصة.</p>
            </div>
            <Link to="/portal" className="rounded-2xl bg-amber-300 px-6 py-3.5 text-center text-sm font-black text-slate-950">فتح البوابة الآمنة</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}

function InfoPage({ eyebrow, title, description, path, children }) {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-950">
      <PublicMeta title={title} description={description} path={path} />
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-16">
        <p className="text-sm font-black text-amber-700">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">{title}</h1>
        <div className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-base font-medium leading-8 text-slate-700 shadow-sm md:p-8">{children}</div>
      </main>
      <PublicFooter />
    </div>
  )
}

export function AboutPage() {
  return <InfoPage eyebrow="عن HELM Legal" title="عن المكتب" description="تعرف على HELM Legal Consultancy وطبيعة الموقع العام والبوابة المنفصلة للملفات القانونية الخاصة." path="/about"><p>HELM Legal Consultancy منصة استشارات وتنظيم ملفات قانونية في دولة الإمارات العربية المتحدة، وتركز على تقديم قراءة عملية للوقائع والمستندات والعقود والمنازعات والإجراءات ذات الصلة.</p><p>الموقع العام مخصص للمحتوى القانوني التوعوي. أما بيانات الموكلين والقضايا والمرفقات الخاصة فتظل داخل بوابة منفصلة بصلاحيات وصول محددة.</p><p>عند الحاجة إلى تمثيل قضائي أو عمل مهني منظم يتطلب ترخيصًا محليًا خاصًا، يتم التعامل معه وفق القواعد والاختصاصات المهنية المطبقة.</p></InfoPage>
}

export function ContactPage() {
  return <InfoPage eyebrow="التواصل" title="تواصل مع HELM Legal" description="طرق التواصل والوصول إلى المكتبة القانونية العامة وبوابة الموكلين الآمنة في HELM Legal." path="/contact"><p>للاستفسارات العامة، ابدأ من القنوات الرسمية للمكتب أو من بوابة الموكلين إذا كان لديك حساب وملف قائم.</p><div className="grid gap-3 sm:grid-cols-2"><Link to="/portal" className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 font-black text-blue-950"><LockKeyhole className="h-5 w-5" /> دخول بوابة الموكلين</Link><Link to="/PublicLegalLibrary" className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 font-black text-blue-950"><BookOpen className="h-5 w-5" /> المكتبة القانونية العامة</Link></div><p>لا ترسل كلمات مرور أو بيانات مصرفية أو مستندات سرية عبر نماذج أو قنوات عامة. الملفات الخاصة تُرفع فقط من خلال المسار الآمن المعتمد.</p></InfoPage>
}

export function PrivacyPage() {
  return <InfoPage eyebrow="السياسات" title="سياسة الخصوصية" description="سياسة خصوصية HELM Legal وفصل بيانات التصفح العامة عن بيانات الموكلين والملفات القانونية الخاصة." path="/privacy"><p>نحترم خصوصية الزوار والموكلين ونفصل بين بيانات التصفح العامة وبيانات الملفات القانونية الخاصة. بيانات القضايا والمرفقات لا تُعرض ضمن صفحات المحتوى العام.</p><p>قد تُستخدم تقنيات أساسية لازمة لتشغيل الموقع، مثل التخزين المحلي وملفات تعريف الارتباط المرتبطة بتسجيل الدخول والأمان. وإذا فُعّلت خدمات تحليل أو إعلانات خارجية مستقبلًا، يتم تحديث هذه السياسة بما يوضح طبيعة تلك الخدمات واستخداماتها.</p><p>لا نبيع بيانات الموكلين أو محتوى الملفات القانونية. ويقتصر الوصول إلى المعلومات الخاصة على الحسابات والصلاحيات المرتبطة بالملف.</p><p>يمكن تحديث هذه السياسة عند تطوير الموقع أو إضافة خدمات جديدة، ويُعتمد أحدث نص منشور في هذه الصفحة.</p></InfoPage>
}

export function TermsPage() {
  return <InfoPage eyebrow="السياسات" title="شروط الاستخدام" description="شروط استخدام موقع HELM Legal والمحتوى القانوني العام وبوابة الموكلين." path="/terms"><p>المحتوى المنشور في الصفحات العامة لأغراض التوعية والمعلومات العامة ولا يُعد استشارة قانونية مخصصة لواقعة بعينها.</p><p>يجب مراجعة الوقائع والمستندات والمواعيد والجهة المختصة قبل اتخاذ أي إجراء قانوني. لا يجوز الاعتماد على مقال عام كبديل عن تقييم ملف محدد.</p><p>بوابة الموكلين مخصصة للمستخدمين المصرح لهم فقط. يحظر محاولة الوصول إلى ملفات أو بيانات لا تخص المستخدم أو تجاوز الصلاحيات التقنية الممنوحة للحساب.</p><p>قد تتغير القوانين والإجراءات، لذلك يراعى تاريخ نشر أو تحديث المحتوى والمصادر الرسمية الأحدث عند التطبيق.</p></InfoPage>
}

export function EditorialPolicyPage() {
  return <InfoPage eyebrow="الثقة والمراجعة" title="سياسة التحرير والمراجعة القانونية" description="منهج HELM Legal في إعداد ومراجعة وتحديث المحتوى القانوني العام والاعتماد على المصادر الرسمية." path="/editorial-policy"><p>يهدف محتوى HELM Legal إلى تقديم معلومات قانونية عملية بلغة واضحة، مع الفصل بين التوعية العامة والرأي القانوني الخاص بملف محدد.</p><p>يُراجع المحتوى قبل النشر من منظور الدقة القانونية، وضوح المصطلحات، وتجنب الجزم في المسائل التي تعتمد على وقائع أو مستندات غير معروضة. وعند ذكر قاعدة أو إجراء قابل للتغير، تكون الأولوية للمصادر الرسمية والتشريعات والجهات الحكومية ذات الصلة.</p><p>تُحدّث المواد عند وجود تعديل تشريعي أو إجرائي مؤثر، أو عند اكتشاف نقطة تحتاج إلى تصحيح أو توضيح. ولا تُستخدم بيانات موكلين حقيقية في الأمثلة المنشورة للعامة.</p><p>المواد المنشورة لا تحل محل دراسة الملف. أي تقييم لمسؤولية أو حق أو ميعاد أو إجراء يجب أن يبنى على المستندات والمرحلة الإجرائية الفعلية.</p></InfoPage>
}
