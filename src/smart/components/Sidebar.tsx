
import React from 'react';
import { ICONS } from '../constants';
import { UserRole, SystemSettings } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  logo?: string;
  primaryColor: string; // Add primaryColor prop
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole, isOpen, onClose, onLogout, logo, primaryColor }) => {
  const allMenuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: ICONS.Dashboard, roles: ['admin', 'staff'] },
    { id: 'cases', label: (userRole === 'admin' || userRole === 'staff') ? 'إدارة القضايا' : 'قضاياي', icon: ICONS.Cases, roles: ['admin', 'staff', 'client'] },
    { id: 'clients', label: 'الموكلين', icon: ICONS.Clients, roles: ['admin', 'staff'] },
    { id: 'documents', label: 'المستندات الرقمية', icon: ICONS.Document, roles: ['admin', 'staff', 'client'] }, // New Documents Tab
    { id: 'accounting', label: (userRole === 'admin' || userRole === 'staff') ? 'الحسابات والمالية' : 'حساباتي', icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2-2v14a2 2 0 002 2z" />
      </svg>
    ), roles: ['admin', 'staff', 'client'] },
    { id: 'ai-consultant', label: 'المستشار الذكي', icon: ICONS.AI, roles: ['admin', 'staff', 'visitor', 'client'] },
    { id: 'laws', label: 'المكتبة القانونية', icon: ICONS.Law, roles: ['admin', 'staff', 'visitor', 'client'] },
    { id: 'settings', label: 'إعدادات النظام', icon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, roles: ['admin'] }, // Settings only for admin
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={onClose}></div>
      )}

      <div className={`h-screen w-72 bg-white text-slate-600 flex flex-col fixed right-0 top-0 shadow-2xl z-50 border-l border-slate-200 overflow-hidden transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-10 flex flex-col items-center gap-4 border-b border-slate-100 bg-slate-50/50">
          <div className="w-24 h-24 flex items-center justify-center p-2 relative group" style={{ color: primaryColor }}> {/* Apply primary color here */}
             {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain" /> : <ICONS.Logo />}
          </div>
          <div className="text-center">
            <h1 className="text-lg font-black text-slate-800 leading-tight">
              {userRole === 'staff' ? 'سمر العبد' : 'أحمد حلمي'}
            </h1>
            {/* [FIX]: Changed text color to a darker shade for better contrast on light background */}
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold mt-1 text-slate-700">Law & Consultation</p> 
            <div className="mt-3 inline-block px-4 py-1 rounded-full bg-white text-[9px] text-slate-400 font-bold border border-slate-200 shadow-sm uppercase tracking-widest">
              {userRole === 'admin' ? 'Super Admin' : userRole === 'staff' ? 'Manager' : 'User Access'}
            </div>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="lg:hidden absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-800 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 overflow-y-auto custom-scroll">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => { setActiveTab(item.id); onClose(); }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                    activeTab === item.id 
                      ? 'text-white shadow-xl shadow-blue-200/50 scale-[1.02]' // Shadow adjusted for blue
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  style={activeTab === item.id ? { backgroundColor: primaryColor, color: 'white' } : {}} // Active background is primaryColor, text is white
                >
                  {/* [FIX]: Changed icon color for better contrast on light/dark background depending on active state */}
                  <span className={`${activeTab === item.id ? 'text-white' : 'text-slate-600 group-hover:text-slate-900'}`} > 
                    <item.icon className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-black tracking-wide">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-4 rounded-2xl transition-all duration-300 text-[11px] font-black border border-red-100 hover:border-red-500 shadow-sm"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                تسجيل الخروج
            </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
