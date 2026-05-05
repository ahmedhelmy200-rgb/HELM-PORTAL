
import React, { useState } from 'react';
import { SystemSettings, AppLanguage } from '../types';
import { ICONS } from '../constants';

interface AdminSettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (s: SystemSettings) => void;
  onBack: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onUpdateSettings, onBack }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleFileUpload = (field: keyof SystemSettings, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500 min-h-screen bg-slate-50 font-sans">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-6">
           <button onClick={onBack} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
           </button>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">إعدادات النظام الفائقة</h2>
        </div>
        <button onClick={() => onUpdateSettings(localSettings)} className="text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-600 transition-all" style={{ backgroundColor: localSettings.primaryColor }}>حفظ التغييرات</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Branding */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
           <h3 className="text-xl font-black mb-8 border-b border-slate-100 pb-4 text-slate-800 flex items-center gap-3">
              <span className="w-1 h-5 rounded-full" style={{ backgroundColor: localSettings.primaryColor }}></span>
              الهوية البصرية
           </h3>
           <div className="space-y-8">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">شعار المكتب (Logo)</label>
                 <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden shadow-inner" style={{ color: localSettings.primaryColor }}>
                       {localSettings.logo ? <img src={localSettings.logo} className="w-full h-full object-contain" alt="Current Logo" /> : <ICONS.Logo className="w-16 h-16 opacity-30" />}
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-xs font-black text-blue-500 hover:underline">تحديث الشعار</span>
                      <input type="file" onChange={(e) => handleFileUpload('logo', e)} className="hidden" accept="image/*" />
                    </label>
                 </div>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">الختم الرسمي (Stamp)</label>
                 <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                       {localSettings.stamp ? <img src={localSettings.stamp} className="w-full h-full object-contain opacity-50" alt="Current Stamp" /> : <span className="text-[10px] font-bold text-slate-300">No Stamp</span>}
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-xs font-black text-red-500 hover:underline">تحديث الختم</span>
                      <input type="file" onChange={(e) => handleFileUpload('stamp', e)} className="hidden" accept="image/*" />
                    </label>
                 </div>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">التوقيع الرسمي (Signature)</label>
                 <div className="flex items-center gap-6">
                    <div className="w-48 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                       {localSettings.signature ? <img src={localSettings.signature} className="w-full h-full object-contain" alt="Current Signature" /> : <span className="text-[10px] font-bold text-slate-300">No Signature</span>}
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-xs font-black text-green-500 hover:underline">تحديث التوقيع</span>
                      <input type="file" onChange={(e) => handleFileUpload('signature', e)} className="hidden" accept="image/*" />
                    </label>
                 </div>
              </div>
           </div>
        </div>

        {/* System Config */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
           <h3 className="text-xl font-black mb-8 border-b border-slate-100 pb-4 text-slate-800 flex items-center gap-3">
              <span className="w-1 h-5 rounded-full" style={{ backgroundColor: localSettings.primaryColor }}></span>
              إعدادات اللغة والثيم
           </h3>
           <div className="space-y-8">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">لغة النظام الافتراضية</label>
                 <div className="flex gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button 
                      onClick={() => setLocalSettings(prev => ({...prev, language: 'ar' as AppLanguage}))} 
                      className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${localSettings.language === 'ar' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      العربية
                    </button>
                    <button 
                      onClick={() => setLocalSettings(prev => ({...prev, language: 'en' as AppLanguage}))} 
                      className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${localSettings.language === 'en' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      English
                    </button>
                 </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">لون الهوية الرئيسي</label>
                <div className="flex gap-4">
                   {['#007bff', '#1e3a8a', '#22c55e', '#ef4444'].map(color => ( // Updated color options
                     <button 
                       key={color} 
                       onClick={() => setLocalSettings(prev => ({...prev, primaryColor: color}))} 
                       className={`w-12 h-12 rounded-2xl transition-all shadow-sm ${localSettings.primaryColor === color ? 'ring-4 ring-offset-2 ring-slate-200 scale-110' : 'hover:scale-105 opacity-80'}`} 
                       style={{ backgroundColor: color }}
                       aria-label={`Select ${color} as primary color`}
                     />
                   ))}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
