# HELM Unified App

هذه نسخة مدمجة من:

1. `helm-portal-v10-final` كأساس رئيسي.
2. `HELM_SMART_MULTIUSER_SYNC_READY` كوحدة داخلية داخل المسار: `src/smart`.

## التشغيل السريع على ويندوز

اضغط مرتين على:

```text
RUN_LOCAL.cmd
```

أو من PowerShell/CMD:

```bash
npm install
npm run dev
```

## البناء للإنتاج

```bash
npm run build
```

أو اضغط:

```text
RUN_BUILD.cmd
```

## المتغيرات المطلوبة

انسخ `.env.example` إلى `.env.local` ثم ضع القيم:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_STORAGE_BUCKET=uploads
VITE_GEMINI_API_KEY=
```

## مكان حُلم سمارت داخل البرنامج

تمت إضافة صفحة جديدة باسم:

```text
HelmSmart
```

وتظهر من القائمة الجانبية باسم:

```text
حُلم سمارت
```

## ملاحظات

- لم يتم تضمين `node_modules` أو `dist` داخل الملف المضغوط.
- لم يتم تضمين أي ملف `.env.local`.
- تم إصلاح خطأ نحوي في `src/Layout.jsx`.
