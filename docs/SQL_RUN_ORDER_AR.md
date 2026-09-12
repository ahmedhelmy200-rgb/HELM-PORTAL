# ترتيب تنفيذ ملفات SQL — HELM Portal

> **القاعدة الذهبية:** نفّذ ملفات `supabase/migrations/` بالترتيب الرقمي. السلسلة المعتمدة الآن هي **001 → 025**. لا تُعد تشغيل هجرة قديمة على قاعدة إنتاج لمجرد تغيّر اسمها أو رقمها؛ افحص الحالة الفعلية أولًا.

## لماذا هذا الملف موجود؟

كانت أرقام ملفات الهجرة تحتوي تكرارات (`003` و`010` و`022`) وفجوات، وكان ذلك يمنع Supabase Preview و`supabase db push`. أُعيد ترتيب السلسلة 001–023، ثم أضيف إصلاحان أمنيان مستقلان:

- `024_lock_down_operations_manager_predicate.sql`: إزالة آخر بريد مُثبّت من مسند مدير التشغيل بعد تجسيد الصفة في قاعدة البيانات.
- `025_close_storage_cross_tenant_leak.sql`: إغلاق سياسات Storage القديمة المتسامحة التي كانت تسمح بتجاوز أفقي بين الموكّلين.

## الترتيب المعتمد

| # | الملف | ماذا يفعل |
|---|---|---|
| 001 | `001_init.sql` | الجداول الأساسية + `handle_new_user` + `set_updated_date` |
| 002 | `002_client_portal_security.sql` | فصل صلاحيات الموكّل + `is_staff_email` |
| 003 | `003_harden_client_onboarding.sql` | تقوية تسجيل الموكّل |
| 004 | `004_portal_scope_separation.sql` | فصل نطاق البوابة |
| 005 | `005_client_self_signup_fix.sql` | إصلاح التسجيل الذاتي |
| 006 | `006_client_contact_and_profile_fix.sql` | بيانات الاتصال والملف الشخصي |
| 007 | `007_payment_settings.sql` | إعدادات الدفع |
| 008 | `008_unified_smart_portal_auth_rls_storage.sql` | RLS + حاويات التخزين |
| 009 | `009_email_password_auth_support.sql` | دعم الدخول بالبريد |
| 010 | `010_portal_security_client_id_rls.sql` | RLS على `client_id` |
| 011 | `011_final_security_hardening.sql` | تقوية أمنية شاملة + `prevent_self_role_escalation` |
| 012 | `012_archived_records.sql` | سجل الأرشيف |
| 013 | `013_contacts_brokers.sql` | جهات الاتصال والوسطاء |
| 014 | `014_income_transactions.sql` | الإيرادات |
| 015 | `015_adib_memory_bank_summary_seed.sql` | Seed بيانات ADIB |
| 016 | `016_broker_role_permissions.sql` | صلاحيات الوسيط |
| 017 | `017_client_portal_integrity_upgrade.sql` | تكامل بوابة الموكّل |
| 018 | `018_case_result_schema_hotfix.sql` | إصلاح مخطط نتيجة القضية |
| 019 | `019_disable_broker_feature.sql` | تعطيل ميزة الوسيط |
| 020 | `020_operations_manager_and_activity_audit.sql` | مدير التشغيل + سجل النشاط |
| 021 | `021_mahmoud_general_manager.sql` | صلاحيات المدير العام |
| 022 | `022_meta_social_publishing.sql` | نشر Meta الاجتماعي |
| 023 | `023_operations_manager_flag.sql` | عمود `is_operations_manager` |
| 024 | `024_lock_down_operations_manager_predicate.sql` | إزالة البريد الثابت من مسند الصلاحيات |
| 025 | `025_close_storage_cross_tenant_leak.sql` | إغلاق تجاوز Storage بين الموكّلين |

## قبل أي `db push`

تحقق من سجل Supabase الحالي:

```sql
select version, name
  from supabase_migrations.schema_migrations
 order by version;
```

> ملاحظة: لا تفترض أن جدولًا فارغًا يعني أن القاعدة لم تُعدّل يدويًا. افحص المخطط الفعلي والسياسات أيضًا.

## التطبيق

على قاعدة جديدة: طبّق 001 → 025 بالترتيب.

على قاعدة قائمة: لا تعِد 001 → 023 عشوائيًا. طبّق فقط الهجرات غير المنفذة بعد التحقق من الحالة الحية.

بعد التطبيق شغّل دائمًا:

```sql
supabase/verify_deployment.sql
```

المطلوب: **الملخص = PASS و0 FAIL**. قد تظهر WARN تحتاج مراجعة، لكنها لا تعني أن الهجرة فشلت.

## 024 و025 تحديدًا

`024` يحافظ على نفس نتيجة الصلاحيات ثم يحذف البريد النصي من `app_is_operations_manager()`، فتكون الصفة قابلة للسحب فعلًا من قاعدة البيانات.

`025` يطبّع مراجع `documents.file_url` عند الحاجة، ويتأكد أولًا من وجود عائلة `unified storage *`، ثم يحذف جميع السياسات القديمة المتسامحة المعروفة، ويُفشل الهجرة إذا بقيت أي سياسة `PERMISSIVE` للـ`authenticated` بلا قيد هوية/ملكية.

## ملفات SQL القديمة في جذر المشروع

لا تعتمد عليها كسلسلة هجرات. المصدر المعتمد للتغييرات الجديدة هو `supabase/migrations/` فقط.
