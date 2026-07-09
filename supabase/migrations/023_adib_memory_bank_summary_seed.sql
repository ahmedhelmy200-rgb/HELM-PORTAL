-- ADIB bank statement memory-summary seed for HELM Portal
-- Period: 2026-01-01 to 2026-05-01
-- Known totals from prior prepared import files:
-- total transactions: 296 | expenses: 252 | income: 27 | review: 17
-- expenses: AED 45,015.14 | income: AED 38,520.66 | net: AED -6,494.48
-- This seed preserves known totals/category breakdown only. It does not fabricate the missing row-level 296 transactions.

create extension if not exists pgcrypto;

create table if not exists public.income_transactions (
  id text primary key,
  title text not null,
  amount numeric not null default 0,
  category text default 'دخل آخر',
  income_date date not null,
  source text default 'تحويل/إيداع بنكي',
  notes text,
  status text default 'محصل',
  bank_reference text,
  created_date timestamptz not null default timezone('utc', now()),
  updated_date timestamptz not null default timezone('utc', now()),
  created_by text
);

insert into public.expenses (
  title, amount, category, expense_date, client_name, case_title, payment_method, notes, is_billable, status
)
select * from (
  values
    ('ADIB ملخص مصروفات: اشتراكات وتطبيقات', 5331.87::numeric, 'اشتراكات وتطبيقات', '2026-05-01'::date, '', '', 'بطاقة/تحويل بنكي', 'ADIB-MEM-EXP-SUBSCRIPTIONS | ملخص 29 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01. أُدخل كصف ملخص لأن تفاصيل العمليات غير موجودة في الريبو.', false, 'مدفوع'),
    ('ADIB ملخص مصروفات: تحويلات وسحوبات نقدية', 26220.00::numeric, 'تحويلات وسحوبات نقدية', '2026-05-01'::date, '', '', 'بطاقة/تحويل بنكي', 'ADIB-MEM-EXP-CASH-TRANSFERS | ملخص 24 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01. راجع قبل اعتبار السحوبات مصروفات تشغيلية نهائية.', false, 'مدفوع'),
    ('ADIB ملخص مصروفات: تسوق إلكتروني/أقساط', 1493.87::numeric, 'تسوق إلكتروني/أقساط', '2026-05-01'::date, '', '', 'بطاقة/تحويل بنكي', 'ADIB-MEM-EXP-ECOM-INSTALLMENTS | ملخص 14 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', false, 'مدفوع'),
    ('ADIB ملخص مصروفات: رسوم بنكية', 709.31::numeric, 'رسوم بنكية', '2026-05-01'::date, '', '', 'بطاقة/تحويل بنكي', 'ADIB-MEM-EXP-BANK-FEES | ملخص 28 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', false, 'مدفوع'),
    ('ADIB ملخص مصروفات: رسوم حكومية/قضائية', 3264.12::numeric, 'رسوم حكومية/قضائية', '2026-05-01'::date, '', '', 'بطاقة/تحويل بنكي', 'ADIB-MEM-EXP-GOV-COURT | ملخص 24 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', false, 'مدفوع'),
    ('ADIB ملخص مصروفات: صحة وصيدليات', 1213.00::numeric, 'صحة وصيدليات', '2026-05-01'::date, '', '', 'بطاقة/تحويل بنكي', 'ADIB-MEM-EXP-HEALTH | ملخص 10 عمليات من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', false, 'مدفوع'),
    ('ADIB ملخص مصروفات: مرافق وخدمات', 541.22::numeric, 'مرافق وخدمات', '2026-05-01'::date, '', '', 'بطاقة/تحويل بنكي', 'ADIB-MEM-EXP-UTILITIES | ملخص عمليتين من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', false, 'مدفوع'),
    ('ADIB ملخص مصروفات: مشتريات عامة', 2251.20::numeric, 'مشتريات عامة', '2026-05-01'::date, '', '', 'بطاقة/تحويل بنكي', 'ADIB-MEM-EXP-GENERAL-PURCHASES | ملخص 43 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', false, 'مدفوع'),
    ('ADIB ملخص مصروفات: أخرى', 273.19::numeric, 'أخرى', '2026-05-01'::date, '', '', 'بطاقة/تحويل بنكي', 'ADIB-MEM-EXP-OTHER | ملخص 5 عمليات من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', false, 'مدفوع'),
    ('ADIB ملخص مصروفات: غير مصنفة تفصيلياً', 3717.36::numeric, 'أخرى', '2026-05-01'::date, '', '', 'بطاقة/تحويل بنكي', 'ADIB-MEM-EXP-UNCLASSIFIED-BALANCE | فرق المصاريف المعروف من إجمالي 45,015.14 بعد التصنيفات الظاهرة؛ يمثل 73 عملية غير مفصلة في الذاكرة الحالية. مطلوب الرجوع للملف التفصيلي قبل الاعتماد المحاسبي النهائي.', false, 'مدفوع')
) as rows(title, amount, category, expense_date, client_name, case_title, payment_method, notes, is_billable, status)
where not exists (
  select 1 from public.expenses e
  where e.title = rows.title
    and e.amount = rows.amount
    and e.expense_date = rows.expense_date
    and e.notes like '%' || split_part(rows.notes, ' | ', 1) || '%'
);

insert into public.income_transactions (
  id, title, amount, category, income_date, source, notes, status, bank_reference
)
values
  ('adib-mem-income-mahmoud-majli-1300', 'ADIB دخل/إيداع: محمود مجلي', 1300.00, 'دخل/تحصيل من عملاء أو أطراف', '2026-05-01', 'إيداع/تحويل بنكي', 'وفق تعليمات سابقة: إيداع 1300 يربط بالموكل محمود مجلي. ضمن ملخص ADIB للفترة 2026-01-01 إلى 2026-05-01.', 'محصل', 'ADIB-MEM-INC-MAHMOUD-MAJLI-1300'),
  ('adib-mem-income-yahya-zakaria-5300', 'ADIB دخل/إيداع: يحيى زكريا', 5300.00, 'دخل/تحصيل من عملاء أو أطراف', '2026-05-01', 'إيداع/تحويل بنكي', 'وفق تعليمات سابقة: إيداع 5300 يربط بيحيى زكريا. ضمن ملخص ADIB للفترة 2026-01-01 إلى 2026-05-01.', 'محصل', 'ADIB-MEM-INC-YAHYA-ZAKARIA-5300'),
  ('adib-mem-income-other-client-collections', 'ADIB دخل/تحصيلات أخرى من عملاء وأطراف', 31920.66, 'دخل/تحصيل من عملاء أو أطراف', '2026-05-01', 'إيداع/تحويل بنكي', 'باقي إجمالي الدخل المعروف 38,520.66 بعد 1,300 محمود مجلي و5,300 يحيى زكريا. يشمل تعليمات سابقة أن أي إيداع باسم رامي يربط بالموكل أمين دياب مع ملاحظة رامي، وأي إيداع مجهول آخر يراجع كخدمات مذكرات فردية أو مستحقات عملاء قدامى.', 'محصل', 'ADIB-MEM-INC-OTHER-COLLECTIONS')
on conflict (id) do update set
  title = excluded.title,
  amount = excluded.amount,
  category = excluded.category,
  income_date = excluded.income_date,
  source = excluded.source,
  notes = excluded.notes,
  status = excluded.status,
  bank_reference = excluded.bank_reference,
  updated_date = timezone('utc', now());

select
  (select coalesce(sum(amount), 0) from public.expenses where notes like 'ADIB-MEM-EXP-%') as seeded_expense_total,
  (select coalesce(sum(amount), 0) from public.income_transactions where bank_reference like 'ADIB-MEM-INC-%') as seeded_income_total;
