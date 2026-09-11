import { describe, it, expect } from 'vitest'
import {
  CASE_RESULT_SCHEMA_FIELDS,
  isMissingCaseResultSchema,
  stripCaseResultFields,
} from './caseResultSchema'
import {
  generatePaymentToken,
  parsePaymentToken,
  buildPaymentUrl,
  buildPaymentWhatsAppMessage,
} from './paymentLinks'

describe('caseResultSchema (توافق النسخة القديمة من قاعدة البيانات)', () => {
  it('يرصد خطأ عدم وجود عمود نتيجة القضية', () => {
    expect(
      isMissingCaseResultSchema({
        message: "column cases.case_result does not exist",
      })
    ).toBe(true)
    expect(
      isMissingCaseResultSchema({
        message: "Could not find the 'success_percentage' column of 'cases' in the schema cache",
      })
    ).toBe(true)
  })

  it('لا يعتبر الأخطاء العامة أخطاء مخطط', () => {
    expect(isMissingCaseResultSchema({ message: 'network error' })).toBe(false)
    expect(isMissingCaseResultSchema(null)).toBe(false)
    expect(isMissingCaseResultSchema(new Error('row level security'))).toBe(false)
  })

  it('لا يخلط بين خطأ العمود وخطأ عام يذكر كلمة column فقط', () => {
    expect(isMissingCaseResultSchema({ message: 'invalid column count' })).toBe(false)
  })

  it('يُبقي الحقول الأخرى ويزيل حقول نتيجة القضية', () => {
    const payload = {
      id: 'x',
      title: 'قضية',
      case_result: 'نجاح جزئي',
      success_percentage: 50,
      result_notes: 'ملاحظة',
    }
    expect(stripCaseResultFields(payload)).toEqual({ id: 'x', title: 'قضية' })
  })

  it('يتعامل مع قيم فارغة', () => {
    expect(stripCaseResultFields()).toEqual({})
    expect(stripCaseResultFields(null)).toEqual({})
  })

  it('يعلن أسماء الأعمدة الثلاثة المتوقعة', () => {
    expect(CASE_RESULT_SCHEMA_FIELDS).toEqual(['case_result', 'success_percentage', 'result_notes'])
  })
})

describe('paymentLinks (رموز روابط الدفع)', () => {
  it('يولّد رمزًا بصيغة URL-safe بدون = أو + أو /', () => {
    const token = generatePaymentToken('inv-123')
    expect(token).not.toMatch(/[=+/]/)
    expect(token.length).toBeGreaterThan(0)
  })

  it('يعيد قراءة نفس المعرّف من الرمز', () => {
    const token = generatePaymentToken('inv-123')
    expect(parsePaymentToken(token)?.id).toBe('inv-123')
  })

  it('يتعامل مع معرّفات UUID', () => {
    const id = '3f2b8c14-9a7e-4d61-b2f0-8c1d5e6a7b90'
    expect(parsePaymentToken(generatePaymentToken(id))?.id).toBe(id)
  })

  it('يعيد null للرموز التالفة بدل أن ينهار', () => {
    expect(parsePaymentToken('not-a-valid-token!!')).toBe(null)
    expect(parsePaymentToken('')).toBe(null)
    expect(parsePaymentToken(null)).toBe(null)
  })

  // اختبار انحدار: كان الحشو يُضاف '==' دائمًا فيفشل فك ترميز معظم المعرّفات،
  // فيرى الموكّل رسالة "رابط الدفع غير صالح أو منتهي" ولا يستطيع الدفع.
  it.each([
    'inv-123',
    'inv-9',
    'a',
    'ab',
    'abc',
    'inv-1234',
    'INV-2026-001',
    '42',
    '3f2b8c14-9a7e-4d61-b2f0-8c1d5e6a7b90',
  ])('يفكّ ترميز المعرّف %s بغضّ النظر عن طول الرمز', (invoiceId) => {
    expect(parsePaymentToken(generatePaymentToken(invoiceId))?.id).toBe(invoiceId)
  })

  it('يفكّ ترميز رابط دفع لرقم فاتورة نصي', () => {
    const url = buildPaymentUrl('INV-2026-001', 'https://helm.example')
    const token = new URL(url).searchParams.get('token')
    expect(parsePaymentToken(token)?.id).toBe('INV-2026-001')
  })

  it('يبني رابط دفع على الأصل المحدد', () => {
    const url = buildPaymentUrl('inv-9', 'https://helm.example')
    expect(url.startsWith('https://helm.example/Payment?token=')).toBe(true)
    expect(parsePaymentToken(url.split('token=')[1])?.id).toBe('inv-9')
  })
})

describe('buildPaymentWhatsAppMessage', () => {
  it('يضمّ المبلغ المتبقي بعد الخصم والضريبة', () => {
    const message = buildPaymentWhatsAppMessage(
      { invoice_number: 'INV-1', client_name: 'أحمد', total_fees: 1000, vat_rate: 5, paid_amount: 300 },
      'https://pay.example/t',
      { office_name: 'مكتب حلمي' }
    )
    expect(message).toContain('INV-1')
    expect(message).toContain('https://pay.example/t')
    expect(message).toContain('مكتب حلمي')
    // 1000 + 5% = 1050، مدفوع 300 => متبقٍ 750
    expect(message).toContain((750).toLocaleString('ar'))
  })

  it('يستخدم قيمًا افتراضية عند غياب بيانات الفاتورة', () => {
    const message = buildPaymentWhatsAppMessage({}, 'https://pay.example/t')
    expect(message).toContain('الموكّل الكريم')
    expect(message).toContain('المكتب القانوني')
  })
})
