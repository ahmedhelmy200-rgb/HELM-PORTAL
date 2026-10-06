import { describe, it, expect } from 'vitest'
import { normalizeArabicText, includesNormalized, searchInFields } from './search'

describe('normalizeArabicText', () => {
  it('يجرّد التشكيل', () => {
    expect(normalizeArabicText('مُحَمَّد')).toBe('محمد')
  })

  it('يوحّد الألف بأشكالها (ا / أ / إ / آ)', () => {
    expect(normalizeArabicText('أحمد')).toBe('احمد')
    expect(normalizeArabicText('إبراهيم')).toBe('ابراهيم')
    expect(normalizeArabicText('آدم')).toBe('ادم')
  })

  it('يوحّد الياء والتاء المربوطة', () => {
    expect(normalizeArabicText('مصطفى')).toBe('مصطفي')
    expect(normalizeArabicText('شركة')).toBe('شركه')
  })

  it('يزيل المحارف الصفرية والعرضية غير المرئية', () => {
    expect(normalizeArabicText('أحمد\u200cحلمي')).toBe('احمدحلمي')
  })

  it('يضمّ المسافات المتكررة ويقلم الأطراف', () => {
    expect(normalizeArabicText('  أحمد    حلمي  ')).toBe('احمد حلمي')
  })

  it('يوحّد حالة الأحرف اللاتينية', () => {
    expect(normalizeArabicText('HELM Legal')).toBe('helm legal')
  })

  it('يعيد نصًا فارغًا للقيم الفارغة', () => {
    expect(normalizeArabicText(null)).toBe('')
    expect(normalizeArabicText(undefined)).toBe('')
  })
})

describe('includesNormalized', () => {
  it('يطابق رغم اختلاف التشكيل في البحث', () => {
    expect(includesNormalized('عقد عمل مُبدئي', 'مبدئي')).toBe(true)
  })

  it('يطابق رغم اختلاف شكل الألف', () => {
    expect(includesNormalized('أحمد حلمي', 'احمد')).toBe(true)
  })

  it('يعيد true لبحث فارغ (لا يُخفي النتائج)', () => {
    expect(includesNormalized('أي نص', '')).toBe(true)
    expect(includesNormalized('أي نص', null)).toBe(true)
  })

  it('يعيد false عند عدم التطابق', () => {
    expect(includesNormalized('قضية عمالية', 'تجاري')).toBe(false)
  })
})

describe('searchInFields', () => {
  const record = {
    full_name: 'شركة النور للمقاولات',
    phone: '0501234567',
    notes: 'قضية عمالية مُعلّقة',
  }

  it('يبحث في كل الحقول المطلوبة', () => {
    expect(searchInFields(record, ['full_name'], 'النور')).toBe(true)
    expect(searchInFields(record, ['phone'], '0501')).toBe(true)
    expect(searchInFields(record, ['notes'], 'معلقه')).toBe(true)
  })

  it('يعيد false إذا لم يطابق أي حقل', () => {
    expect(searchInFields(record, ['full_name', 'notes'], 'عقاري')).toBe(false)
  })

  it('يتجاوز الحقول المفقودة دون كسر', () => {
    expect(searchInFields(record, ['غير_موجود'], 'نور')).toBe(false)
    expect(searchInFields(record, ['غير_موجود'], '')).toBe(true)
  })

  it('يعيد true لاستعلام فارغ', () => {
    expect(searchInFields(record, ['full_name'], '')).toBe(true)
  })

  it('يتعامل مع سجل فارغ', () => {
    expect(searchInFields(null, ['full_name'], 'أحمد')).toBe(false)
  })
})
