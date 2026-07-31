# تشغيل HELM Legal Office كبرنامج Windows

## الوضع المعتمد حاليًا

يعمل البرنامج المكتبي باستخدام **Tauri 2** مع نفس Supabase المستخدمة في النسخة الأونلاين. هذا هو الوضع الافتراضي والمستقر، ويحتاج إلى اتصال بالإنترنت.

طبقة SQLite والمزامنة دون اتصال ما زالت تجريبية، ولذلك لا تعمل تلقائيًا. لا تفعّلها أثناء الاختبار العادي.

## المتطلبات على Windows

1. Node.js 22.
2. Rust stable مع MSVC.
3. Microsoft Visual Studio Build Tools مع **Desktop development with C++**.
4. Microsoft Edge WebView2 Runtime.

## إعداد Supabase

أنشئ ملف `.env.local` في جذر المشروع، ولا ترفعه إلى GitHub:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_PUBLIC_SITE_URL=http://localhost:5173
VITE_SUPABASE_STORAGE_BUCKET=uploads
```

استخدم `anon key` فقط. لا تستخدم `service_role` داخل التطبيق.

## تشغيل النسخة المحلية المستقرة

```powershell
npm ci
npm run desktop:dev
```

في التشغيل اليومي بعد تثبيت المكتبات يكفي:

```powershell
npm run desktop:dev
```

## إنشاء مثبت Windows

```powershell
npm run desktop:build
```

بعد نجاح البناء ستوجد الملفات في:

```text
src-tauri\target\release\bundle\nsis\*.exe
src-tauri\target\release\bundle\msi\*.msi
```

## البناء من GitHub Actions

شغّل Workflow باسم:

```text
Build Windows Desktop
```

ثم نزّل Artifact باسم:

```text
HELM-Legal-Office-Windows
```

يجب إضافة القيم التالية إلى GitHub Repository Secrets:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_PUBLIC_SITE_URL
VITE_SUPABASE_STORAGE_BUCKET
```

## المزامنة المحلية التجريبية

لا تفعّل هذا الخيار في النسخة المستقرة. عند الحاجة للاختبار التقني فقط أضف إلى `.env.local`:

```env
VITE_DESKTOP_OFFLINE_SYNC=true
```

عند تفعيله يستخدم البرنامج SQLite محلية وطبقة مزامنة تجريبية. احذف السطر أو اجعله `false` للرجوع إلى الوضع المستقر المتصل بالسحابة.

## قواعد الأمان

- لا تضع Supabase `service_role` داخل التطبيق.
- لا ترفع ملفات `.env*` أو قاعدة SQLite إلى GitHub.
- استخدم البريد وكلمة المرور في أول اختبار لنسخة Windows.
- احتفظ بنسخة احتياطية من Supabase قبل أي تغيير كبير في قاعدة البيانات.
