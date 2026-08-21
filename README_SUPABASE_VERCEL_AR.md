# تحويل النظام إلى React + Vite + Supabase + Vercel

هذه النسخة تفصل المشروع عن Base44 وتحافظ على نفس الواجهة قدر الإمكان عبر Adapter محلي يحافظ على API القديمة `base44.*` لكن ينفذها فعليًا فوق Supabase.

## المطلوب قبل التشغيل
1. أنشئ مشروع Supabase.
2. فعّل Google provider من Auth > Providers.
3. نفّذ ملفات SQL المطلوبة للمشروع بالترتيب الموجود داخل `supabase/migrations`.
4. أنشئ Storage bucket باسم:
   - `uploads`
5. ضع القيم داخل `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_STORAGE_BUCKET`
   - `VITE_PUBLIC_SITE_URL` عند الحاجة لروابط البريد ونسخة Windows

> تسجيل Google على الويب يستخدم عنوان الصفحة المفتوحة فعلياً. لا تضبط `VITE_SUPABASE_GOOGLE_REDIRECT_URL` على `http://localhost:5173` في Vercel، لأن ذلك كان سبباً شائعاً لإرجاع مستخدم النسخة المنشورة إلى localhost.

## التشغيل المحلي
```powershell
npm install
npm run dev
```

## النشر على Vercel
1. ارفع المشروع إلى GitHub.
2. اربط المشروع بـ Vercel.
3. أضف متغيرات البيئة:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_STORAGE_BUCKET=uploads`
   - `VITE_PUBLIC_SITE_URL=https://YOUR-PRODUCTION-DOMAIN`
4. Build Command = `npm run build`
5. Output Directory = `dist`
6. في Supabase → Authentication → URL Configuration اجعل **Site URL** هو رابط Vercel/الدومين المنشور، وأضف ضمن **Redirect URLs**:
   - رابط الموقع المنشور
   - رابط الموقع المنشور مع `/**`
   - `http://localhost:5173/**` للتطوير
   - `http://127.0.0.1:41735/**` لنسخة Windows

## Google Cloud
داخل OAuth Client من نوع Web application، رابط الرجوع المطلوب لـ Google هو رابط Supabase:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

ولا تستخدم رابط Vercel أو localhost بدلاً منه.

## ملاحظات مهمة
- تم حذف اعتماد Base44 من `package.json` و `vite.config.js`.
- تم الإبقاء على اسم الملف `src/api/base44Client.js` فقط لتجنب تعديل جميع الصفحات.
- `UploadFile` يعمل عبر Supabase Storage.
- `ExtractDataFromUploadedFile` يعمل عبر Supabase Edge Function اسمها الافتراضي `extract-ocr`.
- Google OAuth يستخدم PKCE.
- نسخة Windows تشغّل الواجهة عبر HTTP محلي على `127.0.0.1:41735` بدلاً من `file://` لتفادي مشاكل Router والمسارات.

## فصل البوابات
- تم فصل فواتير `حلمي بروتال` عن فواتير `بداية الخير` عبر حقلي:
  - `portal_scope`
  - `business_unit`
- القيم المعتمدة:
  - `helm_portal`
  - `badayat_al_khair`
- فواتير حلمي بروتال تطبع بهيدر المكتب القانوني.
- فواتير بداية الخير تطبع بهيدر بداية الخير فقط.
