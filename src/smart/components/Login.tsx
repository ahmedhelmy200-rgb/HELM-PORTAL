
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, clientId?: string) => void;
  clients: any[];
}

const Login: React.FC<LoginProps> = ({ onLogin, clients }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'visitor') {
      onLogin('visitor');
    } else if (activeTab === 'admin') {
      // المستشار احمد حلمي  التحقق من بيانات المدير العام
      if (password === 'admin123') {
        onLogin('admin');
      } 
      // التحقق من بيانات االمديرة سمر (يتم الدخول من تبويب الإدارة)
      else if (email === 'samarelabed90@gmail.com' && password === '123456') {
        onLogin('staff');
      }
      else {
        setError('بيانات الدخول غير صحيحة');
      }
    } else if (activeTab === 'client') {
      const client = clients.find(c => c.email === email && c.emiratesId === password);
      if (client) {
        onLogin('client', client.id);
      } else {
        setError('البريد الإلكتروني أو رقم الهوية غير مطابق لسجلاتنا');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d4af37] opacity-5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
      
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 p-4">
                <ICONS.Logo />
            </div>
        </div>
        
        <div className="text-center mb-6">
            <h1 className="text-xl font-black text-white mb-1">LegalMaster UAE</h1>
            <p className="text-slate-400 text-xs">نظام إدارة مكاتب المحاماة والاستشارات</p>
        </div>

        <div className="flex bg-[#1a1a2e] p-1 rounded-2xl mb-6">
            <button 
                onClick={() => { setActiveTab('admin'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'admin' ? 'bg-[#d4af37] text-[#1a1a2e]' : 'text-slate-400 hover:text-white'}`}
            >
                إدارة المكتب
            </button>
            <button 
                onClick={() => { setActiveTab('client'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'client' ? 'bg-[#d4af37] text-[#1a1a2e]' : 'text-slate-400 hover:text-white'}`}
            >
                دخول الموكل
            </button>
            <button 
                onClick={() => { setActiveTab('visitor'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'visitor' ? 'bg-[#d4af37] text-[#1a1a2e]' : 'text-slate-400 hover:text-white'}`}
            >
                زائر
            </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            {/* إظهار حقل الإيميل في حالة الموكل أو في حالة رغبة المساعد في الدخول */}
            {(activeTab === 'client' || activeTab === 'admin') && (
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 mr-2">البريد الإلكتروني</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#d4af37] text-center dir-ltr"
                    />
                </div>
            )}

            {(activeTab === 'admin' || activeTab === 'client') && (
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 mr-2">
                        {activeTab === 'admin' ? 'كلمة المرور' : 'رقم الهوية الإماراتية'}
                    </label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={activeTab === 'admin' ? "******" : "784-XXXX-XXXXXXX-X"}
                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#d4af37] text-center dir-ltr"
                    />
                </div>
            )}

            {error && <p className="text-red-500 text-[10px] font-bold text-center mt-2 bg-red-500/10 py-2 rounded-lg">{error}</p>}

            <button 
                type="submit"
                className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8960c] text-[#1a1a2e] py-3.5 rounded-xl font-black text-xs shadow-xl hover:scale-[1.02] transition-all"
            >
                دخول النظام
            </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-[9px] text-slate-600 font-bold tracking-widest">مكتب المستشار أحمد حلمي للمحاماة &copy; 2024</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
