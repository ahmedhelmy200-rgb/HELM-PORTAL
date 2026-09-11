# ترتيب تنفيذ ملفات SQL — HELM Portal

> **القاعدة الذهبية:** نفّذ ملفات `supabase/migrations/` **بالترتيب الرقمي من 001 إلى 023**، مرة واحدة، ولا تكرر أي ملف نُفّذ بالفعل.

## لماذا هذا الملف موجود؟

كانت أرقام ملفات الهجرة تحتوي **تكرارات** (`003` و `010` و `022` كل منها مرتين) و**فجوات** (`004` و `005` و `013`–`019` و `028` مفقودة).

Supabase يعرّف كل هجرة **برقم البادئة قبل الشرطة السفلية**، ويخزّنها في جدول `supabase_migrations.schema_migrations` بمفتاح أساسي على هذا الرقم. وجود ملفين بالرقم `003` يعني أن الثاني يفشل دائمًا:

```
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
Key (version)=(003) already exists.
```

هذا كان **يمنع تشغيل Supabase Preview و `supabase db push` نهائيًا**. أُعيد ترقيم الملفات إلى سلسلة متصلة 001–023 **مع الحفاظ على الترتيب النسبي نفسه تمامًا** — أي أن محتوى القاعدة الناتج لا يتغير.

## الترتيب المعتمد

| # | الملف | ماذا يفعل |
|---|---|---|
| 001 | `001_init.sql` | الجداول الأساسية + `handle_new_user` + `set_updated_date` |
| 002 | `002_client_portal_security.sql` | فصل صلاحيات الموكّل + `is_staff_email` |
| 003 | `003_harden_client_onboarding.sql` | تقوية تسجيل الموكّل |
| 004 | `004_portal_scope_separation.sql` | فصل نطاق البوابة *(كان 003)* |
| 005 | `005_client_self_signup_fix.sql` | إصلاح التسجيل الذاتي *(كان 006)* |
| 006 | `006_client_contact_and_profile_fix.sql` | *(كان 007)* |
| 007 | `007_payment_settings.sql` | *(كان 008)* |
| 008 | `008_unified_smart_portal_auth_rls_storage.sql` | RLS + حاوية التخزين *(كان 009)* |
| 009 | `009_email_password_auth_support.sql` | دعم الدخول بالبريد *(كان 010)* |
| 010 | `010_portal_security_client_id_rls.sql` | RLS على `client_id` |
| 011 | `011_final_security_hardening.sql` | تقوية أمنية شاملة + `prevent_self_role_escalation` |
| 012 | `012_archived_records.sql` | سجل الأرشيف |
| 013 | `013_contacts_brokers.sql` | *(كان 022)* |
| 014 | `014_income_transactions.sql` | *(كان 022)* |
| 015 | `015_adib_memory_bank_summary_seed.sql` | *(كان 023)* |
| 016 | `016_broker_role_permissions.sql` | *(كان 024)* |
| 017 | `017_client_portal_integrity_upgrade.sql` | *(كان 025)* |
| 018 | `018_case_result_schema_hotfix.sql` | *(كان 026)* |
| 019 | `019_disable_broker_feature.sql` | *(كان 027)* |
| 020 | `020_operations_manager_and_activity_audit.sql` | دعامات مدير التشغيل + سجل النشاط *(كان 029)* |
| 021 | `021_mahmoud_general_manager.sql` | *(كان 030)* |
| 022 | `022_meta_social_publishing.sql` | *(كان 031)* |
| 023 | `023_operations_manager_flag.sql` | **عمود `is_operations_manager`** — يقرأ منه الكود *(كان 032)* |

## الطريقة الآمنة

### 1) تحقّق أولًا: هل قاعدة بياناتك مُدارة بالـ CLI أم يدويًا؟

```sql
select version, name, inserted_at
  from supabase_migrations.schema_migrations
 order by version;
```

- **الجدول فارغ أو غير موجود** ← قاعدتك مُدارة يدويًا. طبّق الجداول أعلاه يدويًا بالترتيب ولا يلزم شيء آخر.
- **يحتوي صفوفًا** ← قاعدتك مُدارة بـ `supabase db push`. **راجع الأرقام المخزَّنة** لأن إعادة الترقيم غيّرت أرقام الهجرات: أي رقم مخزَّن لا يطابق ملفًا حاليًا سيُعتبر «غير مُنفَّذ» وسيُعاد تنفيذه.

### 2) التطبيق

```bash
# بعد التأكد من الخطوة 1
supabase link --project-ref <PROJECT_REF>
supabase db push
```

أو نفّذ الملفات يدويًا من SQL Editor بالترتيب 001 → 023.

## ملفات SQL في جذر المشروع — للتنفيذ اليدوي فقط

هذه الملفات **ليست** جزءًا من `supabase/migrations/` عن قصد، حتى لا تُطبَّق مرتين:

| الملف | الاستخدام |
|---|---|
| `UNIFIED_SUPABASE_SETUP.sql` | إعداد شامل مبكر — غطّته الهجرات الآن |
| `FINAL_SECURITY_HARDENING.sql` | نسخة مطابقة لمحتوى `011`، للتنفيذ اليدوي |
| `EMAIL_PASSWORD_AUTH_SETUP.sql` | إعداد دخول البريد — يطابق `009` |

> ⚠️ لا تُنفّذ ملف الجذر وملف الهجرة المقابل له معًا إن كانا بنفس المحتوى.

## الهجرة 023 تحديدًا

`023_operations_manager_flag.sql` هو الملف الذي يجعل الكود الجديد يعمل: بعد إزالة البريد المُثبَّت من الواجهة، صار `App.jsx` و `ActionButtons.jsx` يقرآن `is_operations_manager` من الملف الشخصي. قبل تنفيذه:

- الزر يظهر، والخادم يرفض العملية (الدعامات في `020`/`021` فعّالة) ← لا ثغرة، لكن تجربة مستخدم سيئة.
- بعد تنفيذه ← الصفة مصدرها قاعدة البيانات، وتغييرها بأمر SQL واحد بلا إعادة نشر.
