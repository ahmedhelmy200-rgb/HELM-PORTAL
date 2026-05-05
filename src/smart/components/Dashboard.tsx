
import React from 'react';
import { LegalCase, Client, Invoice, CaseStatus, UserRole, SystemSettings } from '../types'; // Import SystemSettings
import { ICONS, STATUS_COLORS } from '../constants';

interface DashboardProps {
  cases: LegalCase[];
  clients: Client[];
  invoices: Invoice[];
  userRole: UserRole;
  onNavigate: (tab: string) => void;
  logo?: string;
  primaryColor: string; // Add primaryColor prop
}

const Dashboard: React.FC<DashboardProps> = ({ cases, clients, invoices, userRole, onNavigate, logo, primaryColor }) => {
  const activeCases = cases.filter(c => c.status !== CaseStatus.WON && c.status !== CaseStatus.LOST && c.status !== CaseStatus.ARCHIVED).length;
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.paidAmount, 0);
  const pendingAmount = invoices.filter(i => i.status !== 'Paid').reduce((s,i) => s + (i.amount - i.paidAmount), 0);

  return (
    <div className="min-h-screen flex flex-col font-sans animate-fade-in p-4">
      {/* Header Info Bar */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 relative overflow-hidden">
        {/* [FIX]: Use rgba for background color with transparency string */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl" style={{ backgroundColor: `${primaryColor}10` }}></div> {/* Apply primary color */}
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-6">
              {/* [FIX]: Apply primary color directly */}
              <div className="w-24 h-24 shrink-0 p-2 bg-slate-50 rounded-3xl shadow-inner border border-slate-200 flex items-center justify-center" style={{ color: primaryColor }}> {/* Apply primary color */}
                 {logo ? <img src={logo} className="w-full h-full object-contain" alt="Office Logo" /> : <ICONS.Logo />}
              </div>
              <div>
                 <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">مكتب المستشار أحمد حلمي</h1>
                 {/* [FIX]: Changed text color for better contrast on light background */}
                 <p className="text-[13px] font-bold tracking-widest uppercase text-slate-800">نظام الإدارة الرقمية المتكامل - الإصدار 3.5</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
             <a 
               href="https://ahmed-helmy-legal.vercel.app/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[11px] transition-all hover:bg-blue-600 shadow-xl hover:-translate-y-0.5"
               style={{ backgroundColor: primaryColor }} // Apply primary color
             >
               الموقع الرسمي للمكتب
             </a>
             {userRole === 'admin' && (
                <button onClick={() => onNavigate('settings')} className="bg-white border border-slate-200 text-slate-600 px-8 py-3.5 rounded-2xl font-black text-[11px] hover:bg-slate-50 transition-all shadow-sm">الإعدادات</button>
             )}
           </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
           {[
             { label: 'القضايا المتداولة', value: activeCases, color: 'text-slate-800' },
             { label: 'إجمالي الموكلين', value: clients.length, color: 'text-slate-800' },
             { label: 'المحصل المالي', value: `${totalRevenue.toLocaleString()} د.إ`, color: 'text-green-600' },
             { label: 'المستحقات المعلقة', value: `${pendingAmount.toLocaleString()} د.إ`, color: 'text-red-500' }
           ].map((stat, idx) => (
             <div key={idx} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 hover:bg-white hover:shadow-md transition-all group">
                {/* [FIX]: Use direct color for hover, remove custom property */}
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest group-hover:text-blue-600" style={{ color: 'rgba(100, 116, 139, 1)' }}>{stat.label}</p> {/* Use actual text color, but for primary highlight, it will be in hover */}
                <h3 className={`text-2xl font-black ${stat.color}`}>{stat.value}</h3>
             </div>
           ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">
        {/* Recent Cases Section */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                 <span className="w-1.5 h-6 bg-blue-600 rounded-full" style={{ backgroundColor: primaryColor }}></span> {/* Apply primary color */}
                 آخر القضايا المحدثة
              </h2>
              {/* [FIX]: Changed text color for better contrast on light background */}
              <button onClick={() => onNavigate('cases')} className="text-xs font-black text-slate-800 underline">عرض الكل</button>
           </div>
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-right">
                 <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                    <tr>
                       <th className="p-6">عنوان القضية</th>
                       <th className="p-6">الموكل</th>
                       <th className="p-6">الحالة</th>
                       <th className="p-6">الإجراء</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {cases.slice(0, 5).map(c => (
                       <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-6">
                             <p className="font-bold text-slate-700 text-sm">{c.title}</p>
                             <p className="text-[10px] text-slate-400 mt-1 font-bold">#{c.caseNumber}</p>
                          </td>
                          <td className="p-6 text-sm font-bold text-slate-500">{c.clientName}</td>
                          <td className="p-6">
                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${STATUS_COLORS[c.status]}`}>
                                {c.status}
                             </span>
                          </td>
                          <td className="p-6">
                             {/* [FIX]: Removed custom CSS properties, use direct values for hover effect if desired */}
                             <button onClick={() => onNavigate('cases')} className="p-2.5 bg-slate-100 rounded-xl hover:text-white transition-all" style={{ backgroundColor: 'white', borderColor: 'rgb(226, 232, 240)', color: 'rgb(51, 65, 85)' }}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Financial Shortcut Section */}
        <div className="space-y-6">
           <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-red-400 rounded-full"></span>
              تنبيهات مالية
           </h2>
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="space-y-4">
                 {invoices.filter(i => i.status === 'Unpaid').slice(0, 3).map(inv => (
                    <div key={inv.id} className="p-5 bg-red-50 rounded-3xl border border-red-100 flex justify-between items-center group hover:bg-white hover:border-blue-600 transition-all">
                       <div>
                          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">فاتورة مستحقة</p>
                          <p className="text-sm font-bold text-slate-700">{clients.find(cl => cl.id === inv.clientId)?.name}</p>
                       </div>
                       <p className="font-black text-red-600 text-lg">{(inv.amount - inv.paidAmount).toLocaleString()} <span className="text-[10px]">د.إ</span></p>
                    </div>
                 ))}
                 <button onClick={() => onNavigate('accounting')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl hover:bg-blue-600 transition-all" style={{ backgroundColor: primaryColor }}>الذهاب للحسابات</button> {/* Apply primary color */}
              </div>
           </div>
           
           {/* Smart AI Consultant Shortcut */}
           {/* [FIX]: Use direct rgba values for gradient and background with transparency */}
           <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => onNavigate('ai-consultant')} style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColor}cc)` }}> {/* Apply primary color gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" style={{ backgroundColor: `${primaryColor}10` }}></div> {/* Apply primary color */}
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.05)' }}>
                 <ICONS.AI className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black mb-2">المستشار الذكي (3.0)</h3>
              <p className="text-slate-400 text-xs font-bold leading-relaxed">اسأل الذكاء الاصطناعي عن أي مادة قانونية أو اطلب تحليل ملف قضية فورياً.</p>
              <div className="mt-8 flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest" style={{ color: primaryColor }}> {/* Apply primary color */}
                 ابدأ المحادثة الآن
                 <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
