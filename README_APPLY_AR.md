# دمج نسخة HELM Smart الجديدة داخل HELM Portal

هذه الحزمة Patch فقط، وليست مشروعًا كاملًا.

## طريقة التطبيق

انسخ مجلد `src` الموجود داخل هذا الملف فوق مشروع Portal الحالي:

`C:\Users\AHMED HELMY\Downloads\HELM_STAGE4_FIXED_DEV`

وافق على الاستبدال.

ثم نفذ:

```powershell
cd "C:\Users\AHMED HELMY\Downloads\HELM_STAGE4_FIXED_DEV"
npm install
npm run build
git add .
git commit -m "Merge new HELM Smart into Portal"
git push origin main
```

## ماذا يفعل هذا التحديث؟

- يستبدل وحدة `src/smart` بنسخة HELM Smart الجديدة المرفوعة.
- يحدث صفحة `src/pages/HelmSmart.jsx` لتشغيل Smart داخل Portal.
- يمنع ظهور تسجيل دخول مستقل داخل Smart عند فتحه من Portal.
- يعتمد على مستخدم Portal الحالي ويفتح Smart مباشرة.

## ملاحظة

هذه مرحلة دمج تشغيل وواجهة. توحيد بيانات Smart بالكامل مع جداول Portal في Supabase يحتاج مرحلة لاحقة منفصلة.
