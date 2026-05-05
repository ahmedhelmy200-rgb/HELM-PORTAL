-- HELM Legal Office Manager - Supabase minimal schema
--
-- الفكرة: كل جدول يخزن السجل كاملاً داخل عمود JSONB اسمه payload.
-- هذا يقلل زمن التعديل على الكود ويجعل التوسع لاحقاً أسهل.
--
-- ⚠️ تحذير مهني (سرية بيانات الموكلين):
-- تشغيل الجداول بدون سياسات وصول (RLS) أو بسياسة "Allow All" يعني أن أي شخص يمكنه القراءة/الكتابة إذا حصل على بيانات مشروعك.
-- لا تستخدم الإعدادات المفتوحة لبيانات حقيقية.

-- 1) Tables
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS future_debts (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) QUICK TEST ONLY (غير آمن):
-- إذا أردت أن يعمل التطبيق فورًا من المتصفح باستخدام anon key بدون Auth، فعليك فتح الوصول.
-- اختر أحد الخيارين التاليين (ولا تستخدمهما لبيانات حقيقية):

-- الخيار (A): تعطيل RLS بالكامل (الأبسط)
-- ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE future_debts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- الخيار (B): تفعيل RLS مع سياسة Allow All (يعادل الفتح عمليًا)
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "demo allow all" ON clients FOR ALL USING (true) WITH CHECK (true);
--
-- كرر نفس السياسة لباقي الجداول إذا استخدمت هذا الخيار.

-- 3) SECURE SETUP (مستحسن):
-- فعّل Supabase Auth ثم اكتب سياسات RLS تربط البيانات بالمستخدم/المكتب.
-- هذا يحتاج تعديل بسيط لاحقًا في شاشة الدخول لاستخدام Auth (يمكنني تنفيذه لك عند تحديد حسابات الدخول).
