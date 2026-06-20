# تشغيل مشروع HELM Portal كبرنامج Desktop على Windows

تم تجهيز هذا الفرع `desktop-exe` ليحوّل مشروع React/Vite الحالي إلى برنامج سطح مكتب بصيغة Windows EXE باستخدام Electron و electron-builder.

## 1) تحميل النسخة على جهازك

افتح PowerShell داخل المكان الذي تريد حفظ المشروع فيه، ثم نفذ:

```powershell
git clone -b desktop-exe https://github.com/ahmedhelmy200-rgb/HELM-PORTAL.git
cd HELM-PORTAL
```

## 2) تثبيت المتطلبات

يشترط وجود Node.js إصدار 20 أو أحدث.

```powershell
npm install
```

## 3) تشغيل البرنامج محليًا بدون إنشاء Installer

```powershell
npm run desktop
```

## 4) إنشاء ملف EXE للتثبيت على ويندوز

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

## 5) البناء التلقائي من GitHub

تمت إضافة ملف Workflow باسم:

```text
.github/workflows/windows-exe.yml
```

يمكن تشغيله يدويًا من GitHub Actions، وبعد انتهاء التشغيل ستجد Artifact باسم:

```text
HELM-Portal-Windows-EXE
```

## ملاحظات مهمة

- التطبيق ما زال يعتمد على نفس كود المشروع الحالي.
- إذا كان تسجيل الدخول أو البيانات متصلة بـ Supabase فسيظل البرنامج يحتاج اتصال إنترنت للوصول إلى Supabase.
- لم يتم حذف أو تعديل صفحات المشروع الأساسية؛ تم فقط إضافة غلاف Desktop وسكربتات بناء EXE.
