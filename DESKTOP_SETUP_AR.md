# تشغيل HELM Legal Office كبرنامج Windows

## البنية

يعمل المشروع بنسختين من قاعدة كود واحدة:

- **النسخة السحابية:** React/Vite مع Supabase، وتستمر في العمل من المتصفح.
- **نسخة Windows:** Tauri 2 مع SQLite محلية ومزامنة Supabase.

لا تستبدل نسخة Windows السحابة، بل تحفظ نسخة محلية من البيانات المنظمة وتزامن العمليات المعلقة عند عودة الإنترنت.

## المتطلبات على Windows

1. Node.js 22.
2. Rust stable مع MSVC.
3. Microsoft Visual Studio Build Tools مع Desktop development with C++.
4. Microsoft Edge WebView2 Runtime.

## متغيرات Supabase

أنشئ ملف `.env.local` في جذر المشروع، ولا ترفعه إلى GitHub:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_PUBLIC_SITE_URL=https://YOUR_PUBLIC_SITE
VITE_SUPABASE_STORAGE_BUCKET=uploads
```

## التشغيل أثناء التطوير

```powershell
npm ci
npm run desktop:dev
```

## إنشاء مثبت Windows

```powershell
npm ci
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

## مكان قاعدة البيانات المحلية

يضع البرنامج قاعدة SQLite داخل مجلد بيانات التطبيق الخاص بالمستخدم، واسم الملف:

```text
helm-office.sqlite3
```

يظهر المسار الفعلي عند تمرير المؤشر فوق حالة المزامنة أسفل يسار البرنامج.

## آلية المزامنة

- القراءة مع الإنترنت: تُقرأ البيانات من Supabase ثم تُخزن محليًا.
- القراءة دون إنترنت: تُقرأ البيانات المحفوظة من SQLite.
- الكتابة مع الإنترنت: تُرسل إلى Supabase ثم تُثبت محليًا.
- الكتابة دون إنترنت: تُحفظ محليًا وتدخل جدول `sync_outbox`.
- عند عودة الإنترنت: تُرسل العمليات المعلقة تلقائيًا كل 30 ثانية، ويمكن تشغيل المزامنة يدويًا بالضغط على مؤشر الحالة.

## حدود النسخة الحالية

تعمل بيانات الموكلين والقضايا والجلسات والفواتير والمصروفات وبقية السجلات دون اتصال بعد تحميلها مرة واحدة على الجهاز.

أما الملفات الثنائية المرفوعة مثل PDF وWord والصور، فما زالت عملية رفعها تعتمد على Supabase Storage والإنترنت. دعم اختيار ملف وحفظه محليًا ثم رفعه لاحقًا يحتاج طبقة مزامنة ملفات مستقلة قبل اعتماد العمل الكامل على المستندات دون اتصال.

## قواعد الأمان

- لا تضع Supabase service role key داخل التطبيق.
- استخدم anon key مع Supabase Auth وRLS.
- لا ترفع ملفات `.env*` أو قاعدة SQLite إلى GitHub.
- احتفظ بنسخ احتياطية دورية من Supabase ومن قاعدة الجهاز قبل أي ترقية رئيسية.
