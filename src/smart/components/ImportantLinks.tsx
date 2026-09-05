import React from 'react';

type LinkCategory = 'قضاء' | 'نيابة' | 'شرطة' | 'تشريعات' | 'خدمات قانونية';

type LegalLink = {
  id: string;
  title: string;
  description: string;
  url: string;
  emirate: string;
  categories: LinkCategory[];
  keywords: string[];
  featured?: boolean;
};

const LEGAL_LINKS: LegalLink[] = [
  {
    id: 'uae-legislation',
    title: 'منصة تشريعات الإمارات',
    description: 'المنصة الرسمية للتشريعات الاتحادية واللوائح والقرارات والتعديلات النافذة في دولة الإمارات.',
    url: 'https://uaelegislation.gov.ae/',
    emirate: 'اتحادي',
    categories: ['تشريعات'],
    keywords: ['قوانين', 'تشريعات', 'لوائح', 'قرارات', 'الجريدة الرسمية'],
    featured: true,
  },
  {
    id: 'moj-services',
    title: 'وزارة العدل – الخدمات العدلية',
    description: 'المحاكم وإدارة القضايا والتنفيذ والكاتب العدل والأحوال الشخصية والمحامين والخبراء والمترجمين.',
    url: 'https://www.moj.gov.ae/ar/services',
    emirate: 'اتحادي',
    categories: ['قضاء', 'خدمات قانونية'],
    keywords: ['وزارة العدل', 'محاكم اتحادية', 'تنفيذ', 'كاتب عدل', 'توثيق', 'محامين', 'خبراء'],
    featured: true,
  },
  {
    id: 'federal-pp',
    title: 'النيابة العامة الاتحادية',
    description: 'البوابة الرسمية للنيابة العامة الاتحادية وخدمات القضايا والطلبات الجزائية الإلكترونية.',
    url: 'https://www.pp.gov.ae/',
    emirate: 'اتحادي',
    categories: ['نيابة'],
    keywords: ['نيابة', 'بلاغ', 'قضية جزائية', 'طلبات النيابة', 'النائب العام'],
    featured: true,
  },
  {
    id: 'uae-services',
    title: 'المنصة الرسمية لحكومة الإمارات – دليل الخدمات',
    description: 'دليل موحد للوصول إلى الخدمات الرقمية للجهات الاتحادية والمحلية في دولة الإمارات.',
    url: 'https://u.ae/ar/Services-Directory',
    emirate: 'اتحادي',
    categories: ['خدمات قانونية'],
    keywords: ['حكومة الإمارات', 'دليل الخدمات', 'خدمات حكومية'],
  },
  {
    id: 'adjd',
    title: 'دائرة القضاء – أبوظبي',
    description: 'المحاكم والتنفيذ والنيابات والمحاكم الجزائية والكاتب العدل والتوثيق والخدمات القضائية الرقمية.',
    url: 'https://www.adjd.gov.ae/AR/Pages/EServiceDirectory.aspx',
    emirate: 'أبوظبي',
    categories: ['قضاء', 'نيابة', 'خدمات قانونية'],
    keywords: ['أبوظبي', 'العين', 'محكمة', 'نيابة', 'تنفيذ', 'كاتب العدل', 'استئناف', 'نقض'],
    featured: true,
  },
  {
    id: 'dubai-courts',
    title: 'محاكم دبي',
    description: 'دليل خدمات محاكم دبي: الدعاوى والأوامر والطعون والتنفيذ والكاتب العدل والإشهادات والاستعلامات.',
    url: 'https://dcsmart.dc.gov.ae/PublicServices/ServicesDirectory.aspx?lang=ar-AE',
    emirate: 'دبي',
    categories: ['قضاء'],
    keywords: ['دبي', 'محاكم', 'تمييز', 'استئناف', 'ابتدائي', 'تنفيذ', 'كاتب العدل'],
    featured: true,
  },
  {
    id: 'dubai-pp',
    title: 'النيابة العامة – دبي',
    description: 'الموقع الرسمي للنيابة العامة في دبي والخدمات والطلبات والاستعلامات المرتبطة بالقضايا الجزائية.',
    url: 'https://www.dxbpp.gov.ae/',
    emirate: 'دبي',
    categories: ['نيابة'],
    keywords: ['دبي', 'نيابة', 'بلاغ', 'قضية جزائية', 'طلبات'],
    featured: true,
  },
  {
    id: 'sharjah-judiciary',
    title: 'منصة قضاء الشارقة',
    description: 'المنصة القضائية الرقمية الموحدة لخدمات المحاكم ودائرة القضاء والنيابة العامة في إمارة الشارقة.',
    url: 'https://sjd.ae/ar',
    emirate: 'الشارقة',
    categories: ['قضاء', 'نيابة'],
    keywords: ['الشارقة', 'محاكم', 'نيابة', 'مجلس القضاء', 'دائرة القضاء'],
    featured: true,
  },
  {
    id: 'rak-courts',
    title: 'محاكم رأس الخيمة',
    description: 'الموقع الرسمي لدائرة محاكم رأس الخيمة وخدمات الدعاوى والاستئناف والطلبات والإعلانات والأحكام المنشورة.',
    url: 'https://courts.rak.ae/ar/',
    emirate: 'رأس الخيمة',
    categories: ['قضاء'],
    keywords: ['رأس الخيمة', 'محاكم', 'دعوى', 'استئناف', 'تنفيذ', 'أحكام'],
  },
  {
    id: 'rak-pp',
    title: 'النيابة العامة – رأس الخيمة',
    description: 'الموقع الرسمي للنيابة العامة في رأس الخيمة والخدمات الإلكترونية والطلبات والاستعلامات.',
    url: 'https://rakpp.rak.ae/',
    emirate: 'رأس الخيمة',
    categories: ['نيابة'],
    keywords: ['رأس الخيمة', 'نيابة', 'بلاغ', 'قضية جزائية', 'طلبات'],
  },
  {
    id: 'ad-police',
    title: 'شرطة أبوظبي',
    description: 'الموقع الرسمي للقيادة العامة لشرطة أبوظبي وخدمات البلاغات والاستعلامات والخدمات الشرطية.',
    url: 'https://www.adpolice.gov.ae/',
    emirate: 'أبوظبي',
    categories: ['شرطة'],
    keywords: ['أبوظبي', 'شرطة', 'بلاغ', 'مرور', 'استعلام'],
  },
  {
    id: 'dubai-police',
    title: 'شرطة دبي',
    description: 'الموقع الرسمي للقيادة العامة لشرطة دبي والخدمات الذكية والبلاغات والاستعلامات الشرطية.',
    url: 'https://www.dubaipolice.gov.ae/',
    emirate: 'دبي',
    categories: ['شرطة'],
    keywords: ['دبي', 'شرطة', 'بلاغ', 'مرور', 'استعلام', 'جنائي'],
  },
  {
    id: 'sharjah-police',
    title: 'شرطة الشارقة',
    description: 'الموقع الرسمي للقيادة العامة لشرطة الشارقة والخدمات العامة والشرطية والمرورية والاستعلامات.',
    url: 'https://www.shjpolice.gov.ae/',
    emirate: 'الشارقة',
    categories: ['شرطة'],
    keywords: ['الشارقة', 'شرطة', 'بلاغ', 'مرور', 'استعلام'],
  },
  {
    id: 'ajman-police',
    title: 'شرطة عجمان',
    description: 'الموقع الرسمي للقيادة العامة لشرطة عجمان وخدمات البلاغات والاستعلام والخدمات الأمنية والمرورية.',
    url: 'https://www.ajmanpolice.gov.ae/',
    emirate: 'عجمان',
    categories: ['شرطة'],
    keywords: ['عجمان', 'شرطة', 'بلاغ', 'مرور', 'استعلام'],
  },
  {
    id: 'uaq-police',
    title: 'شرطة أم القيوين',
    description: 'الموقع الرسمي للقيادة العامة لشرطة أم القيوين والخدمات والمعلومات الشرطية للإمارة.',
    url: 'http://www.uaqpolice.gov.ae/',
    emirate: 'أم القيوين',
    categories: ['شرطة'],
    keywords: ['أم القيوين', 'شرطة', 'بلاغ', 'مرور'],
  },
  {
    id: 'rak-police',
    title: 'شرطة رأس الخيمة',
    description: 'الموقع الرسمي للقيادة العامة لشرطة رأس الخيمة والخدمات الإلكترونية للأفراد وقطاع الأعمال.',
    url: 'https://www.rakpolice.gov.ae/',
    emirate: 'رأس الخيمة',
    categories: ['شرطة'],
    keywords: ['رأس الخيمة', 'شرطة', 'بلاغ', 'مرور', 'استعلام'],
  },
  {
    id: 'fujairah-police',
    title: 'شرطة الفجيرة',
    description: 'الموقع الرسمي للقيادة العامة لشرطة الفجيرة والخدمات الرقمية والبلاغات والخدمات الشرطية.',
    url: 'https://fujairahpolice.gov.ae/',
    emirate: 'الفجيرة',
    categories: ['شرطة'],
    keywords: ['الفجيرة', 'شرطة', 'بلاغ', 'مرور', 'استعلام'],
  },
  {
    id: 'moi',
    title: 'وزارة الداخلية',
    description: 'البوابة الاتحادية لخدمات وزارة الداخلية والخدمات الشرطية والمرورية والخدمات المشتركة.',
    url: 'https://moi.gov.ae/',
    emirate: 'اتحادي',
    categories: ['شرطة', 'خدمات قانونية'],
    keywords: ['وزارة الداخلية', 'شرطة', 'مرور', 'بلاغات', 'خدمات اتحادية'],
  },
  {
    id: 'mohre',
    title: 'وزارة الموارد البشرية والتوطين',
    description: 'دليل خدمات علاقات العمل والعمال وأصحاب العمل والعقود والشكاوى والمنازعات العمالية.',
    url: 'https://www.mohre.gov.ae/ar/services/services-directory',
    emirate: 'اتحادي',
    categories: ['خدمات قانونية'],
    keywords: ['عمالي', 'عمل', 'شكوى عمالية', 'عقد عمل', 'موارد بشرية', 'MOHRE'],
  },
  {
    id: 'icp',
    title: 'الهوية والجنسية والجمارك وأمن المنافذ',
    description: 'خدمات الهوية والإقامة وأذونات الدخول والجنسية والمغادرة والمعاملات المرتبطة بالإقامة.',
    url: 'https://icp.gov.ae/services/services-for-individuals/',
    emirate: 'اتحادي',
    categories: ['خدمات قانونية'],
    keywords: ['هوية', 'إقامة', 'تأشيرة', 'جنسية', 'مغادرة', 'ICP'],
  },
  {
    id: 'fta',
    title: 'الهيئة الاتحادية للضرائب',
    description: 'الخدمات الضريبية الرسمية بما فيها التسجيل والطلبات والتوضيحات وإعادة النظر والخدمات المرتبطة بالنزاعات الضريبية.',
    url: 'https://www.tax.gov.ae/ar/',
    emirate: 'اتحادي',
    categories: ['خدمات قانونية'],
    keywords: ['ضرائب', 'ضريبة الشركات', 'قيمة مضافة', 'إعادة نظر', 'FTA'],
  },
  {
    id: 'dubai-legal-affairs',
    title: 'دائرة الشؤون القانونية لحكومة دبي',
    description: 'خدمات شؤون المحامين والمستشارين القانونيين والخدمات القانونية للجمهور والجهات الحكومية في دبي.',
    url: 'https://legal.dubai.gov.ae/',
    emirate: 'دبي',
    categories: ['خدمات قانونية'],
    keywords: ['محامين', 'مستشارين قانونيين', 'ترخيص', 'دبي', 'شؤون قانونية'],
  },
  {
    id: 'dubai-land',
    title: 'دائرة الأراضي والأملاك – دبي',
    description: 'الخدمات العقارية الرقمية والتسجيل والتصرفات العقارية والتأجير والاستعلامات العقارية.',
    url: 'https://dubailand.gov.ae/ar/eservices/',
    emirate: 'دبي',
    categories: ['خدمات قانونية'],
    keywords: ['عقارات', 'ملكية', 'إيجار', 'دبي', 'أراضي', 'DLD'],
  },
  {
    id: 'difc-courts',
    title: 'محاكم مركز دبي المالي العالمي – DIFC',
    description: 'المحاكم والخدمات القضائية الخاصة باختصاص مركز دبي المالي العالمي والقضايا التجارية ذات الصلة.',
    url: 'https://www.difccourts.ae/',
    emirate: 'دبي',
    categories: ['قضاء'],
    keywords: ['DIFC', 'مركز دبي المالي', 'محكمة', 'تجاري', 'تنفيذ'],
  },
  {
    id: 'adgm-courts',
    title: 'محاكم سوق أبوظبي العالمي – ADGM',
    description: 'منصة محاكم ADGM الرقمية للقضايا والأحكام والتشريعات والإجراءات والنماذج والرسوم.',
    url: 'https://www.adgm.com/adgm-courts',
    emirate: 'أبوظبي',
    categories: ['قضاء'],
    keywords: ['ADGM', 'سوق أبوظبي العالمي', 'محكمة', 'تجاري', 'أحكام'],
  },
];

const CATEGORY_OPTIONS: Array<'الكل' | LinkCategory> = ['الكل', 'قضاء', 'نيابة', 'شرطة', 'تشريعات', 'خدمات قانونية'];
const EMIRATE_OPTIONS = ['الكل', 'اتحادي', 'أبوظبي', 'دبي', 'الشارقة', 'عجمان', 'أم القيوين', 'رأس الخيمة', 'الفجيرة'];

const categoryStyle: Record<LinkCategory, { badge: string; icon: string }> = {
  'قضاء': { badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: 'bg-slate-900 text-white' },
  'نيابة': { badge: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: 'bg-indigo-700 text-white' },
  'شرطة': { badge: 'bg-blue-50 text-blue-700 border-blue-100', icon: 'bg-blue-700 text-white' },
  'تشريعات': { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: 'bg-emerald-700 text-white' },
  'خدمات قانونية': { badge: 'bg-amber-50 text-amber-800 border-amber-100', icon: 'bg-amber-500 text-slate-950' },
};

const LinkIcon: React.FC<{ category: LinkCategory }> = ({ category }) => {
  if (category === 'شرطة') {
    return (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 5-3.1 8.8-7 10-3.9-1.2-7-5-7-10V6l7-3z" />
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    );
  }

  if (category === 'تشريعات') {
    return (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 3h8l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 3v5h5M9 13h6M9 17h6" />
      </svg>
    );
  }

  if (category === 'نيابة') {
    return (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5 7h14M7 7l-3 6h6L7 7zm10 0l-3 6h6l-3-6zM8 21h8" />
      </svg>
    );
  }

  if (category === 'خدمات قانونية') {
    return (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
        <circle cx="18" cy="18" r="2" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 10v9M9 10v9M15 10v9M19 10v9M3 19h18M12 3l9 5H3l9-5z" />
    </svg>
  );
};

const ImportantLinks: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<'الكل' | LinkCategory>('الكل');
  const [emirate, setEmirate] = React.useState('الكل');

  const filteredLinks = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return LEGAL_LINKS.filter((link) => {
      const categoryMatch = category === 'الكل' || link.categories.includes(category);
      const emirateMatch = emirate === 'الكل' || link.emirate === emirate;
      const haystack = [link.title, link.description, link.emirate, ...link.categories, ...link.keywords]
        .join(' ')
        .toLowerCase();
      const searchMatch = !normalized || haystack.includes(normalized);
      return categoryMatch && emirateMatch && searchMatch;
    });
  }, [query, category, emirate]);

  const resetFilters = () => {
    setQuery('');
    setCategory('الكل');
    setEmirate('الكل');
  };

  return (
    <div dir="rtl" className="p-4 md:p-8 xl:p-12 space-y-7 page-transition">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white border border-white/10 shadow-2xl">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #d4af37 0, transparent 22%), radial-gradient(circle at 85% 15%, #2563eb 0, transparent 20%)' }} />
        <div className="relative p-6 md:p-9 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-7">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[#d4af37] text-xs font-black mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              دليل الجهات الرسمية – دولة الإمارات العربية المتحدة
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">المواقع الإلكترونية القانونية والقضائية</h2>
            <p className="mt-3 text-slate-300 font-medium leading-8">
              وصول سريع إلى المحاكم والنيابات والشرطة والتشريعات وأهم بوابات الخدمات القانونية الحكومية من مكان واحد.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 min-w-[300px]">
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-center">
              <div className="text-2xl font-black text-[#d4af37]">{LEGAL_LINKS.length}</div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">جهة ورابط</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-center">
              <div className="text-2xl font-black text-[#d4af37]">7</div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">إمارات</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-center">
              <div className="text-2xl font-black text-[#d4af37]">5</div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">تصنيفات</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
          <div className="relative">
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="M20 20l-4-4" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث: محاكم دبي، تنفيذ، نيابة، بلاغ، عمالي، عقارات..."
              className="w-full h-13 rounded-2xl border border-slate-200 bg-slate-50 pr-12 pl-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:border-[#d4af37]"
            />
          </div>

          <select
            value={emirate}
            onChange={(e) => setEmirate(e.target.value)}
            className="h-13 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-[#d4af37]/30"
            aria-label="تصفية حسب الإمارة"
          >
            {EMIRATE_OPTIONS.map((item) => (
              <option key={item} value={item}>{item === 'الكل' ? 'كل الإمارات' : item}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_OPTIONS.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                category === item
                  ? 'bg-slate-950 text-white border-slate-950 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#d4af37] hover:text-slate-900'
              }`}
            >
              {item}
            </button>
          ))}

          {(query || category !== 'الكل' || emirate !== 'الكل') && (
            <button onClick={resetFilters} className="mr-auto px-4 py-2 rounded-xl text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100">
              مسح التصفية
            </button>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900">الجهات المتاحة</h3>
          <p className="text-xs text-slate-500 font-bold mt-1">{filteredLinks.length} نتيجة مطابقة</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          روابط جهات رسمية
        </div>
      </div>

      {filteredLinks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredLinks.map((link) => {
            const primaryCategory = link.categories[0];
            const style = categoryStyle[primaryCategory];
            let domain = link.url;
            try {
              domain = new URL(link.url).hostname.replace(/^www\./, '');
            } catch {
              // Keep original URL if parsing fails.
            }

            return (
              <article key={link.id} className="group bg-white rounded-[1.7rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col min-h-[300px]">
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${style.icon}`}>
                      <LinkIcon category={primaryCategory} />
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {link.featured && (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-[#d4af37]/15 text-amber-800 border border-[#d4af37]/30">أساسي</span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-slate-50 text-slate-500 border border-slate-100">{link.emirate}</span>
                    </div>
                  </div>

                  <h4 className="mt-5 text-lg font-black text-slate-900 leading-7 group-hover:text-[#9a7617] transition-colors">{link.title}</h4>
                  <p className="mt-2 text-xs font-semibold text-slate-500 leading-6">{link.description}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {link.categories.map((item) => (
                      <span key={item} className={`px-2.5 py-1 rounded-lg text-[9px] font-black border ${categoryStyle[item].badge}`}>{item}</span>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-6 mt-auto">
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-700">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                          <circle cx="12" cy="12" r="9" strokeWidth="2" />
                        </svg>
                        موقع رسمي
                      </div>
                      <div dir="ltr" className="mt-1 text-[10px] text-slate-400 font-bold truncate max-w-[180px] text-left">{domain}</div>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-black hover:bg-[#d4af37] hover:text-slate-950 transition-colors"
                    >
                      فتح الموقع
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M10 14L19 5M19 14v5H5V5h5" />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="M20 20l-4-4" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h4 className="mt-4 font-black text-slate-800">لا توجد نتائج مطابقة</h4>
          <p className="mt-2 text-xs font-bold text-slate-500">غيّر كلمة البحث أو الإمارة أو نوع الجهة.</p>
          <button onClick={resetFilters} className="mt-5 px-5 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-black">عرض كل المواقع</button>
        </div>
      )}

      <div className="rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4 text-xs font-bold text-amber-900 leading-6">
        ملاحظة: بعض الخدمات تتطلب تسجيل الدخول بالهوية الرقمية UAE PASS أو حساب الجهة الحكومية، وقد تنقلك الجهة إلى بوابة خدمات منفصلة تابعة لها.
      </div>
    </div>
  );
};

export default ImportantLinks;
