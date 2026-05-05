
import React, { useState } from 'react';
import { ICONS } from '../constants'; // Import ICONS
import { SystemSettings } from '../types'; // Import SystemSettings

interface LawsLibraryProps {
  onBack: () => void;
  settings: SystemSettings; // Add settings prop
}

const LAWS_DATA = [
  {
    id: 1,
    title: 'قانون العقوبات الاتحادي (مرسوم بقانون اتحادي رقم 31 لسنة 2021)',
    category: 'جنائي',
    description: 'يحدد الجرائم والعقوبات المقررة لها في دولة الإمارات العربية المتحدة.',
    articles: [
      { number: '1', text: 'لا جريمة ولا عقوبة إلا بنص قانوني، ولا عقوبة على الفعل إلا إذا كان مجرماً وقت ارتكابه.' },
      { number: '52', text: 'تسري أحكام هذا القانون على كل من يرتكب جريمة في إقليم الدولة.' }
    ]
  },
  {
    id: 2,
    title: 'قانون الأحوال الشخصية (قانون اتحادي رقم 28 لسنة 2005)',
    category: 'أحوال شخصية',
    description: 'ينظم مسائل الزواج، الطلاق، الحضانة، المواريث، والوصايا.',
    articles: [
      { number: '18', text: 'الزواج عقد يفيد حل استمتاع كل من الزوجين بالآخر شرعاً، وغايته الإحصان وبناء أسرة مستقرة.' },
      { number: '146', text: 'الحضانة حفظ الولد وتربيته ورعايته بما لا يتعارض مع حق الولي في الولاية على النفس في الولاية على النفس.' }
    ]
  },
  {
    id: 3,
    title: 'قانون تنظيم علاقات العمل (مرسوم بقانون اتحادي رقم 33 لسنة 2021)',
    category: 'عمالي',
    description: 'ينظم العلاقة بين أصحاب العمل والعمال في القطاع الخاص.',
    articles: [
      { number: '8', text: 'تحدد أنواع عقود العمل (الدوام الكامل، الجزئي، المؤقت، المرن) وفق اللائحة التنفيذية.' },
      { number: '51', text: 'يستحق العامل الأجنبي الذي يعمل بنمط الدوام الكامل مكافأة نهاية الخدمة عند انتهاء خدمته.' }
    ]
  },
  {
    id: 4,
    title: 'قانون المعاملات المدنية (قانون اتحادي رقم 5 لسنة 1985)',
    category: 'مدني',
    description: 'القانون الأساسي الذي ينظم الالتزامات والعقود والحقوق العينية.',
    articles: [
      { number: '125', text: 'العقد هو ارتباط الإيجاب الصادر من أحد المتعاقدين بقبول الآخر وتوافقهما على وجه يثبت أثره في المعقود عليه.' },
      { number: '282', text: 'كل إضرار بالغير يلزم فاعله ولو غير مميز بضمان الضرر.' }
    ]
  },
  {
    id: 5,
    title: 'قانون الإجراءات المدنية (مرسوم بقانون اتحادي رقم 42 لسنة 2022)',
    category: 'إجراءات',
    description: 'ينظم إجراءات التقاضي أمام المحاكم المدنية وطرق الطعن في الأحكام.',
    articles: []
  },
  {
    id: 6,
    title: 'قانون الشركات التجارية (مرسوم بقانون اتحادي رقم 32 لسنة 2021)',
    category: 'تجاري',
    description: 'ينظم تأسيس الشركات التجارية وإدارتها وحوكمتها.',
    articles: []
  }
];

const LawsLibrary: React.FC<LawsLibraryProps> = ({ onBack, settings }) => { // Destructure settings
  const { primaryColor } = settings; // Get primaryColor from settings
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedLaw, setExpandedLaw] = useState<number | null>(null);

  const categories = Array.from(new Set(LAWS_DATA.map(l => l.category)));

  const filteredLaws = LAWS_DATA.filter(law => {
    const matchesSearch = law.title.includes(searchTerm) || law.description.includes(searchTerm);
    const matchesCategory = selectedCategory ? law.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-slate-50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-6 mb-10">
        <button onClick={onBack} className="bg-white border border-slate-200 p-4 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm group">
          <svg className="w-6 h-6 text-slate-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">مكتبة القوانين الإماراتية</h2>
          <p className="text-slate-400 font-bold text-sm mt-1">المرجع القانوني الشامل والمحدث</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 mb-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            {/* [FIX]: Removed unsupported focusRingColor and focusBorderColor */}
            <input 
              type="text" 
              placeholder="ابحث عن قانون، مرسوم، أو مادة قانونية..." 
              className="w-full h-16 bg-slate-50 border border-slate-200 rounded-3xl px-12 text-sm font-bold outline-none transition-all placeholder:text-slate-400 text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 custom-scroll">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-8 h-16 rounded-3xl text-sm font-black whitespace-nowrap transition-all ${!selectedCategory ? 'text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              style={!selectedCategory ? { backgroundColor: primaryColor, color: 'white' } : {}}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-8 h-16 rounded-3xl text-sm font-black whitespace-nowrap transition-all ${selectedCategory === cat ? 'text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={selectedCategory === cat ? { backgroundColor: primaryColor, color: 'white' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Laws Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredLaws.length > 0 ? (
          filteredLaws.map(law => (
            <div key={law.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div 
                className="p-8 cursor-pointer flex justify-between items-center bg-white group-hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedLaw(expandedLaw === law.id ? null : law.id)}
              >
                <div className="flex items-center gap-6">
                   {/* [FIX]: Changed icon color for better contrast on light background */}
                   <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 transition-all" style={{ backgroundColor: `${primaryColor}10` }}>
                      <ICONS.Law className="w-7 h-7" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 leading-tight transition-colors group-hover:text-slate-900">{law.title}</h3>
                      <p className="text-sm text-slate-500 font-bold mt-2">{law.description}</p>
                      <span className="inline-block mt-3 bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-200">{law.category}</span>
                   </div>
                </div>
                <div className={`w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 transform transition-transform duration-300 ${expandedLaw === law.id ? 'rotate-180 text-white' : ''}`} style={expandedLaw === law.id ? { backgroundColor: primaryColor, color: 'white' } : {}}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              
              {expandedLaw === law.id && (
                <div className="bg-slate-50 p-8 border-t border-slate-100 animate-in slide-in-from-top-2">
                   <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">أبرز المواد القانونية</h4>
                   <div className="space-y-4">
                      {law.articles.length > 0 ? law.articles.map((art, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-colors hover:border-slate-300">
                           {/* [FIX]: Changed text color for better contrast on light background */}
                           <p className="text-xs font-black mb-2 text-slate-800">المادة ({art.number})</p>
                           <p className="text-sm font-bold text-slate-700 leading-relaxed">{art.text}</p>
                        </div>
                      )) : (
                        <p className="text-center text-slate-500 text-sm font-bold py-4">سيتم إضافة نصوص المواد قريباً.</p>
                      )}
                   </div>
                   <button className="text-white w-full mt-8 py-4 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-lg" style={{ backgroundColor: primaryColor }}>
                      عرض النص الكامل للقانون (PDF)
                   </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="lg:col-span-3 text-center py-24 bg-white rounded-[3rem] border border-slate-200 border-dashed">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <p className="text-slate-500 font-black">لا توجد نتائج مطابقة لبحثك.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LawsLibrary;
