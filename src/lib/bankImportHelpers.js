import { supabase } from '@/integrations/supabase/client'
import { base44 } from '@/api/base44Client'

export const HELM_BANK_INCOME_KEY = 'helm_bank_income_transactions_v1'

const EXPENSE_CATEGORIES = new Set([
  'رسوم قضائية','مواصلات','طباعة ومستلزمات','رسوم تسجيل','أتعاب خبراء','إيجار','رواتب','اتصالات','أخرى',
  'رسوم حكومية/قضائية','مواصلات ووقود','مطاعم وضيافة','مشتريات عامة','اشتراكات وتطبيقات','رسوم بنكية','تحويلات وسحوبات نقدية','تسوق إلكتروني/أقساط','صحة وصيدليات','مرافق وخدمات'
])

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try { resolve(JSON.parse(String(reader.result || '{}'))) } catch { reject(new Error('الملف ليس JSON صحيح.')) }
    }
    reader.onerror = () => reject(new Error('تعذر قراءة الملف.'))
    reader.readAsText(file, 'utf-8')
  })
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export function normalizeExpenseForPortal(row = {}) {
  const ref = cleanText(row.bank_reference || row.reference || '')
  const desc = cleanText(row.bank_description || row.description || row.title || 'مصروف من كشف البنك')
  const notes = cleanText(row.notes || '')
  return {
    title: cleanText(row.title || desc).slice(0, 250),
    amount: Number(row.amount || row.debit || 0),
    category: EXPENSE_CATEGORIES.has(row.category) ? row.category : 'أخرى',
    expense_date: row.expense_date || row.date || new Date().toISOString().slice(0, 10),
    case_title: row.case_title || '',
    client_name: row.client_name || '',
    payment_method: row.payment_method || 'بطاقة/تحويل بنكي',
    notes: notes || `استيراد كشف بنك ADIB${ref ? ` - مرجع: ${ref}` : ''}`,
    is_billable: Boolean(row.is_billable),
    status: row.status || 'مدفوع',
  }
}

export function normalizeIncomeForPortal(row = {}) {
  const ref = cleanText(row.bank_reference || row.reference || '')
  const desc = cleanText(row.bank_description || row.description || row.title || 'دخل من كشف البنك')
  return {
    id: row.id || `income-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: cleanText(row.title || desc).slice(0, 250),
    amount: Number(row.amount || row.credit || 0),
    category: row.category || 'دخل آخر',
    income_date: row.income_date || row.date || new Date().toISOString().slice(0, 10),
    source: row.source || 'تحويل/إيداع بنكي',
    notes: cleanText(row.notes || `استيراد كشف بنك ADIB${ref ? ` - مرجع: ${ref}` : ''}`),
    status: row.status || 'محصل',
    bank_reference: ref,
    created_date: row.created_date || new Date().toISOString(),
    updated_date: new Date().toISOString(),
  }
}

export function readLocalIncome() {
  try {
    const rows = JSON.parse(localStorage.getItem(HELM_BANK_INCOME_KEY) || '[]')
    return Array.isArray(rows) ? rows : []
  } catch { return [] }
}

export function writeLocalIncome(rows = []) {
  localStorage.setItem(HELM_BANK_INCOME_KEY, JSON.stringify(rows))
  return rows
}

export async function loadIncomeTransactions() {
  const local = readLocalIncome()
  try {
    const { data, error } = await supabase.from('income_transactions').select('*').order('income_date', { ascending: false }).limit(1000)
    if (error) throw error
    return { items: data?.length ? data : local, source: data?.length ? 'supabase' : 'local' }
  } catch {
    return { items: local, source: 'local' }
  }
}

export async function importExpensesToPortal(expenses = []) {
  const rows = expenses.map(normalizeExpenseForPortal).filter((e) => e.amount > 0 && e.title)
  if (!rows.length) return { imported: 0, source: 'none' }
  try {
    const created = await base44.entities.Expense.bulkCreate(rows)
    return { imported: created?.length || rows.length, source: 'supabase' }
  } catch (error) {
    const old = JSON.parse(localStorage.getItem('helm_expenses_local_fallback_v2') || '[]')
    const merged = [...rows.map((r, i) => ({ ...r, id: `expense-bank-${Date.now()}-${i}`, created_date: new Date().toISOString(), updated_date: new Date().toISOString() })), ...(Array.isArray(old) ? old : [])]
    localStorage.setItem('helm_expenses_local_fallback_v2', JSON.stringify(merged))
    return { imported: rows.length, source: 'local', error: error?.message || String(error) }
  }
}

export async function importIncomeToPortal(income = []) {
  const rows = income.map(normalizeIncomeForPortal).filter((e) => e.amount > 0 && e.title)
  if (!rows.length) return { imported: 0, source: 'none' }
  try {
    const { data, error } = await supabase.from('income_transactions').insert(rows).select()
    if (error) throw error
    return { imported: data?.length || rows.length, source: 'supabase' }
  } catch (error) {
    const old = readLocalIncome()
    writeLocalIncome([...rows, ...old])
    return { imported: rows.length, source: 'local', error: error?.message || String(error) }
  }
}

export function bankImportSummary(data = {}) {
  const expenses = Array.isArray(data.expenses) ? data.expenses : []
  const income = Array.isArray(data.income) ? data.income : []
  const review = Array.isArray(data.excluded_review) ? data.excluded_review : Array.isArray(data.review) ? data.review : []
  return {
    expenses,
    income,
    review,
    expenseTotal: expenses.reduce((s, x) => s + Number(x.amount || 0), 0),
    incomeTotal: income.reduce((s, x) => s + Number(x.amount || 0), 0),
  }
}
