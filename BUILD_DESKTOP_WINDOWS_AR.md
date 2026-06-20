# تشغيل مشروع HELM Portal كبرنامج Desktop على Windows

هذا الفرع `desktop-exe` مخصص لتحويل مشروع React/Vite الحالي إلى برنامج سطح مكتب بصيغة Windows EXE باستخدام Electron و electron-builder.

## 1) تحميل النسخة الصحيحة

افتح PowerShell داخل المكان الذي تريد حفظ المشروع فيه، ثم نفذ:

```powershell
git clone -b desktop-exe https://github.com/ahmedhelmy200-rgb/HELM-PORTAL.git
cd HELM-PORTAL
```

إذا كانت النسخة موجودة عندك بالفعل:

```powershell
git checkout desktop-exe
git pull origin desktop-exe
```

إذا كانت النسخة ZIP وليست Git clone، فلا تستخدم `git pull`. حمّل ZIP جديد من فرع `desktop-exe` أو استخدم أمر `git clone` أعلاه.

## 2) ضبط Supabase قبل بناء EXE

التطبيق لن يعمل تشغيلًا كاملًا إذا لم تكن قيم Supabase موجودة وقت البناء. أنشئ ملفًا باسم `.env.local` في جذر المشروع بجوار `package.json` وضع بداخله القيم الحقيقية:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

يمكن نسخ الملف المبدئي:

```powershell
copy .env.example .env.local
notepad .env.local
```

ثم عدّل القيم داخل Notepad واحفظ الملف.

## 3) البناء السريع بسكربت واحد

تمت إضافة سكربت PowerShell يفحص Node وملف `.env.local` ثم يبني EXE:

```powershell
powershell -ExecutionPolicy Bypass -File .\BUILD_EXE_WINDOWS.ps1
```

## 4) الطريقة اليدوية

```powershell
npm install
npm run desktop
```

ولإنشاء ملف EXE:

```powershell
npm run dist:win
```

بعد اكتمال الأمر ستجد الملفات داخل مجلد:

```text
release
```

سيتم إنشاء نوعين:

- Installer بصيغة `.exe` للتثبيت الطبيعي.
- Portable EXE يعمل مباشرة بدون تثبيت.

## 5) ملاحظات تشخيص مهمة

- إذا ظهرت رسالة: `إعدادات Supabase غير مكتملة`، فالمشكلة من ملف `.env.local` أو من أن EXE بُني قبل وضع قيم Supabase.
- بعد تعديل `.env.local` يجب إعادة البناء بالأمر `npm run dist:win`.
- إذا فتح البرنامج صفحة 404 أو شاشة بيضاء، استخدم آخر نسخة من فرع `desktop-exe` لأن الراوتر تم تعديله ليستخدم HashRouter داخل Electron.
- إذا فتح البرنامج شاشة سوداء فقط، استخدم آخر نسخة من فرع `desktop-exe` ثم أعد البناء؛ تم تعطيل GPU acceleration وإضافة شاشة تشخيص بدل السواد.
- إذا بقيت الشاشة سوداء، اضغط `Ctrl + Shift + I` داخل نافذة البرنامج لفتح أدوات المطور ونسخ الخطأ الظاهر في Console.
- التطبيق لا يحفظ قاعدة البيانات محليًا؛ إذا كان متصلًا بـ Supabase فسيحتاج اتصال إنترنت للوصول للبيانات.
