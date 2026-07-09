// Summary-level ADIB bank import data recovered from prior HELM work.
// The detailed 296 transaction rows were not present in the repository, so this dataset preserves the known totals
// and category breakdown instead of inventing row-level transactions.

export const adibMemoryBankData = {
  source: 'ADIB bank statement memory summary',
  period_start: '2026-01-01',
  period_end: '2026-05-01',
  summary: {
    total_transactions: 296,
    expense_count: 252,
    income_count: 27,
    review_count: 17,
    expense_total: 45015.14,
    income_total: 38520.66,
    net_total: -6494.48,
    accuracy: 'summary-level totals from prior prepared import files; not row-level transaction detail',
  },
  expenses: [
    { title: 'ADIB ملخص مصروفات: اشتراكات وتطبيقات', amount: 5331.87, category: 'اشتراكات وتطبيقات', expense_date: '2026-05-01', notes: 'ملخص 29 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01. أُدخل كصف ملخص لأن تفاصيل العمليات غير موجودة في الريبو.', bank_reference: 'ADIB-MEM-EXP-SUBSCRIPTIONS' },
    { title: 'ADIB ملخص مصروفات: تحويلات وسحوبات نقدية', amount: 26220.00, category: 'تحويلات وسحوبات نقدية', expense_date: '2026-05-01', notes: 'ملخص 24 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01. راجع قبل اعتبار السحوبات مصروفات تشغيلية نهائية.', bank_reference: 'ADIB-MEM-EXP-CASH-TRANSFERS' },
    { title: 'ADIB ملخص مصروفات: تسوق إلكتروني/أقساط', amount: 1493.87, category: 'تسوق إلكتروني/أقساط', expense_date: '2026-05-01', notes: 'ملخص 14 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', bank_reference: 'ADIB-MEM-EXP-ECOM-INSTALLMENTS' },
    { title: 'ADIB ملخص مصروفات: رسوم بنكية', amount: 709.31, category: 'رسوم بنكية', expense_date: '2026-05-01', notes: 'ملخص 28 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', bank_reference: 'ADIB-MEM-EXP-BANK-FEES' },
    { title: 'ADIB ملخص مصروفات: رسوم حكومية/قضائية', amount: 3264.12, category: 'رسوم حكومية/قضائية', expense_date: '2026-05-01', notes: 'ملخص 24 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', bank_reference: 'ADIB-MEM-EXP-GOV-COURT' },
    { title: 'ADIB ملخص مصروفات: صحة وصيدليات', amount: 1213.00, category: 'صحة وصيدليات', expense_date: '2026-05-01', notes: 'ملخص 10 عمليات من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', bank_reference: 'ADIB-MEM-EXP-HEALTH' },
    { title: 'ADIB ملخص مصروفات: مرافق وخدمات', amount: 541.22, category: 'مرافق وخدمات', expense_date: '2026-05-01', notes: 'ملخص عمليتين من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', bank_reference: 'ADIB-MEM-EXP-UTILITIES' },
    { title: 'ADIB ملخص مصروفات: مشتريات عامة', amount: 2251.20, category: 'مشتريات عامة', expense_date: '2026-05-01', notes: 'ملخص 43 عملية من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', bank_reference: 'ADIB-MEM-EXP-GENERAL-PURCHASES' },
    { title: 'ADIB ملخص مصروفات: أخرى', amount: 273.19, category: 'أخرى', expense_date: '2026-05-01', notes: 'ملخص 5 عمليات من كشف ADIB للفترة 2026-01-01 إلى 2026-05-01.', bank_reference: 'ADIB-MEM-EXP-OTHER' },
    { title: 'ADIB ملخص مصروفات: غير مصنفة تفصيلياً', amount: 3717.36, category: 'أخرى', expense_date: '2026-05-01', notes: 'فرق المصاريف المعروف من إجمالي 45,015.14 بعد التصنيفات الظاهرة؛ يمثل 73 عملية غير مفصلة في الذاكرة الحالية. مطلوب الرجوع للملف التفصيلي قبل الاعتماد المحاسبي النهائي.', bank_reference: 'ADIB-MEM-EXP-UNCLASSIFIED-BALANCE' },
  ],
  income: [
    { id: 'adib-mem-income-mahmoud-majli-1300', title: 'ADIB دخل/إيداع: محمود مجلي', amount: 1300.00, category: 'دخل/تحصيل من عملاء أو أطراف', income_date: '2026-05-01', source: 'إيداع/تحويل بنكي', notes: 'وفق تعليمات سابقة: إيداع 1300 يربط بالموكل محمود مجلي. ضمن ملخص ADIB للفترة 2026-01-01 إلى 2026-05-01.', bank_reference: 'ADIB-MEM-INC-MAHMOUD-MAJLI-1300' },
    { id: 'adib-mem-income-yahya-zakaria-5300', title: 'ADIB دخل/إيداع: يحيى زكريا', amount: 5300.00, category: 'دخل/تحصيل من عملاء أو أطراف', income_date: '2026-05-01', source: 'إيداع/تحويل بنكي', notes: 'وفق تعليمات سابقة: إيداع 5300 يربط بيحيى زكريا. ضمن ملخص ADIB للفترة 2026-01-01 إلى 2026-05-01.', bank_reference: 'ADIB-MEM-INC-YAHYA-ZAKARIA-5300' },
    { id: 'adib-mem-income-other-client-collections', title: 'ADIB دخل/تحصيلات أخرى من عملاء وأطراف', amount: 31920.66, category: 'دخل/تحصيل من عملاء أو أطراف', income_date: '2026-05-01', source: 'إيداع/تحويل بنكي', notes: 'باقي إجمالي الدخل المعروف 38,520.66 بعد 1,300 محمود مجلي و5,300 يحيى زكريا. يشمل تعليمات سابقة أن أي إيداع باسم رامي يربط بالموكل أمين دياب مع ملاحظة رامي، وأي إيداع مجهول آخر يراجع كخدمات مذكرات فردية أو مستحقات عملاء قدامى.', bank_reference: 'ADIB-MEM-INC-OTHER-COLLECTIONS' },
  ],
  excluded_review: [
    { title: 'ADIB عمليات للمراجعة', amount: 0, category: 'مراجعة', date: '2026-05-01', notes: 'عدد 17 عملية مستبعدة من المصروفات والدخل التشغيلي: تحويلات داخلية، شيكات مرتدة، أو عمليات تحتاج تصنيف يدوي حسب ملف المراجعة السابق.' },
  ],
}

export default adibMemoryBankData
