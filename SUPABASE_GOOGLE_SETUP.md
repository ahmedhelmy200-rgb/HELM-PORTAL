# إعداد Google OAuth في Supabase — HELM Portal

## ما تم إصلاحه في الكود

- تسجيل الدخول على الويب يستخدم عنوان الصفحة المفتوحة فعلياً بدل الاعتماد على قيمة قديمة مثل `http://localhost:5173`.
- OAuth يستخدم PKCE.
- نسخة Windows تفتح Google في المتصفح الافتراضي وتستقبل رمز الرجوع عبر خادم محلي آمن على `127.0.0.1`، بدل فتح Google داخل نافذة Electron.

## 1. إعداد Google Cloud Console

1. افتح Google Cloud Console.
2. اختر المشروع المستخدم مع Supabase.
3. اذهب إلى **APIs & Services → Credentials**.
4. افتح **OAuth 2.0 Client ID** من نوع **Web application**.
5. تحت **Authorized redirect URIs** أضف رابط Supabase فقط بالشكل التالي:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

استبدل `YOUR_PROJECT_REF` بمعرّف مشروع Supabase الحقيقي.

> لا تضع رابط Vercel أو `localhost:5173` هنا كبديل عن رابط Supabase callback. Google يعيد المستخدم أولاً إلى Supabase، ثم Supabase يعيده إلى HELM Portal.

## 2. إعداد Google Provider في Supabase

من **Authentication → Providers → Google**:

- فعّل Google.
- ضع Client ID الصحيح.
- ضع Client Secret الصحيح.
- احفظ.

## 3. إعداد URL Configuration في Supabase

من **Authentication → URL Configuration**:

### Site URL
ضع رابط النسخة المنشورة الفعلي، مثال:

```text
https://YOUR-HELM-DOMAIN.example
```

### Redirect URLs
أضف النسخة المنشورة، التطوير المحلي، ونسخة Windows:

```text
https://YOUR-HELM-DOMAIN.example
https://YOUR-HELM-DOMAIN.example/**
http://localhost:5173
http://localhost:5173/**
http://127.0.0.1:41735
http://127.0.0.1:41735/**
```

إذا كان للمشروع نطاق Vercel ثابت ونطاق مخصص، أضف الاثنين.

## 4. متغيرات Vercel / .env.local

القيم الأساسية:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SUPABASE_STORAGE_BUCKET=uploads
VITE_PUBLIC_SITE_URL=https://YOUR-HELM-DOMAIN.example
```

`VITE_SUPABASE_GOOGLE_REDIRECT_URL` لم يعد مطلوباً على الويب؛ يفضل تركه فارغاً حتى لا تعيد قيمة localhost قديمة كسر تسجيل الدخول.

## 5. حسابات المكتب

بعد نجاح Google OAuth، HELM Portal يطابق البريد مع `user_profiles` وبيانات الموكلين. إذا لم يكن البريد معروفاً للنظام، قد يظهر الحساب كـ `pending_client` بدلاً من موظف.

مثال لإضافة موظف إداري يدوياً من SQL Editor:

```sql
INSERT INTO public.user_profiles (email, role, full_name)
VALUES ('your-email@gmail.com', 'admin', 'اسم المستخدم')
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;
```

## 6. تشخيص سريع

- `redirect_uri_mismatch` من Google: راجع أن Google Cloud يحتوي على رابط Supabase `/auth/v1/callback` الصحيح.
- `Redirect URL not allowed`: أضف رابط HELM Portal أو `127.0.0.1:41735` إلى Redirect URLs في Supabase.
- الرجوع إلى localhost بعد تسجيل الدخول على الموقع المنشور: احذف/اترك فارغاً متغير `VITE_SUPABASE_GOOGLE_REDIRECT_URL` القديم في Vercel ثم أعد النشر.
- ظهور `user_profiles` أو حساب غير مفعل: OAuth نجح لكن صلاحية البريد داخل قاعدة البيانات تحتاج مراجعة.

## 7. نسخة Windows

نسخة Windows الجديدة لا تستخدم `file://`. البرنامج يشغّل build المحلي على:

```text
http://127.0.0.1:41735
```

وهذا يمنع مشاكل BrowserRouter والمسارات والشاشة السوداء المرتبطة ببناء Electron القديم.

لبناء النسخة على Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\BUILD_DESKTOP_WINDOWS.ps1
```

الناتج يكون داخل مجلد `release` بنسختين: Installer وPortable.
