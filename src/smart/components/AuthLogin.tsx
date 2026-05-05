import React from 'react';
import { getSupabase, isSupabaseConfigured } from '../services/supabase';

type Mode = 'login' | 'register';

export default function AuthLogin() {
  const [mode, setMode] = React.useState<Mode>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError('Supabase غير مُعد: ضع VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY ثم أعد التشغيل.');
      return;
    }
    if (!email || !password) {
      setError('أدخل البريد وكلمة المرور.');
      return;
    }

    setLoading(true);
    try {
      const sb = getSupabase();
      if (mode === 'login') {
        const { error: e } = await sb.auth.signInWithPassword({ email, password });
        if (e) throw e;
      } else {
        const { error: e } = await sb.auth.signUp({ email, password });
        if (e) throw e;
        // In Supabase, signUp may require email confirmation based on project settings.
      }
    } catch (e: any) {
      setError(e?.message ?? 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dir-rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 border border-slate-200">
        <h1 className="text-xl font-bold text-slate-800">حلم سمارت</h1>
        <p className="text-sm text-slate-500 mt-1">دخول متعدد المستخدمين + مزامنة بين الأجهزة</p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <div className="text-xs text-slate-600 mb-1">البريد الإلكتروني</div>
            <input className="w-full px-3 py-2 rounded-xl border border-slate-200" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-xs text-slate-600 mb-1">كلمة المرور</div>
            <input type="password" className="w-full px-3 py-2 rounded-xl border border-slate-200" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? '...' : (mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب')}
          </button>

          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {mode === 'login' ? 'إنشاء حساب جديد' : 'لدي حساب بالفعل'}
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          ملاحظة: قد يتطلب إنشاء الحساب تأكيد البريد حسب إعدادات Supabase.
        </div>
      </div>
    </div>
  );
}
