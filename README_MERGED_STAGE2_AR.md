# HELM Unified - Stage 2

تم تنفيذ مرحلة الدمج الثانية بين HELM Portal وHELM Smart على مستوى التشغيل الفعلي للبيانات.

## ما تم توحيده

1. **نظام تسجيل الدخول**
   - تم إلغاء تسجيل الدخول المستقل داخل Smart.
   - Smart الآن يستخدم نفس جلسة Portal من `src/lib/AuthContext.jsx`.
   - لا توجد جلسة Supabase ثانية داخل Smart.

2. **الصلاحيات**
   - مصدر الدور أصبح `user_profiles.role` داخل Portal.
   - الأدوار المعتمدة للإدارة: `admin`, `staff`, `lawyer`, `assistant`, `secretary`.
   - العميل لا يرى إلا بياناته المرتبطة ببريده/اسمه.

3. **الجداول**
   - Smart لم يعد يستخدم جداول `payload` القديمة.
   - العملاء والقضايا والفواتير والمستندات والمصاريف أصبحت تستخدم نفس جداول Portal:
     - `clients`
     - `cases`
     - `invoices`
     - `documents`
     - `expenses`
     - `future_debts`

4. **RLS**
   - تمت إضافة ملف موحد:
     - `supabase/migrations/009_unified_smart_portal_auth_rls_storage.sql`
   - وتم نسخه أيضًا في جذر المشروع باسم:
     - `UNIFIED_SUPABASE_SETUP.sql`

5. **التخزين**
   - Smart يرفع المستندات إلى bucket باسم `uploads` بدل حفظها كـ Base64 داخل قاعدة البيانات.
   - Bucket `brand` مخصص للشعار/الختم/الهوية البصرية.
   - الملفات خاصة وليست public، وتفتح عبر signed URL.

6. **العملاء والقضايا والفواتير**
   - أي عميل/قضية/فاتورة تُنشأ من Smart تحفظ في نفس جداول Portal.
   - أي بيانات موجودة في Portal تظهر داخل Smart بعد التحديث.

## المطلوب في Supabase

نفذ SQL التالي داخل Supabase SQL Editor مرة واحدة فقط بعد تشغيل migrations القديمة:

```sql
-- افتح الملف التالي وانسخ محتواه كاملاً:
-- UNIFIED_SUPABASE_SETUP.sql
```

## التشغيل المحلي

```bash
npm install
npm run dev
```

## البناء

```bash
npm run build
```
