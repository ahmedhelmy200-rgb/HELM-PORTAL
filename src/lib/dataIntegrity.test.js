import { describe, it, expect } from 'vitest'
import {
  normalizeEmail,
  normalizeIdNumber,
  normalizePhone,
  normalizeText,
  findClientDuplicates,
  findInvoiceDuplicates,
  defaultCaseSuccessPercentage,
  caseSuccessStats,
} from './dataIntegrity'

describe('normalizePhone (توحيد أرقام الإمارات)', () => {
  it('يحوّل الصيغة المحلية 05x إلى الصيغة الدولية 9715x', () => {
    expect(normalizePhone('0501234567')).toBe('971501234567')
  })

  it('يحوّل بادئة 00971', () => {
    expect(normalizePhone('00971501234567')).toBe('971501234567')
  })

  it('يُبقي بادئة 971 كما هي', () => {
    expect(normalizePhone('+971 50 123 4567')).toBe('971501234567')
  })

  it('يتجاهل الرموز والمسافات والشرطات', () => {
    expect(normalizePhone('(050) 123-4567')).toBe('971501234567')
  })

  it('يعيد نصًا فارغًا لغير الأرقام', () => {
    expect(normalizePhone('')).toBe('')
    expect(normalizePhone('غير متوفر')).toBe('')
  })

  it('يطابق رقمًا محليًا برقم دولي لنفس الموكّل', () => {
    expect(normalizePhone('0501234567')).toBe(normalizePhone('+971501234567'))
  })
})

describe('normalizeText و normalizeEmail و normalizeIdNumber', () => {
  it('يوحّد اختلافات الكتابة العربية', () => {
    expect(normalizeText('شركة الأمل')).toBe(normalizeText('شركه الامل'))
    expect(normalizeText('مُحَمَّد')).toBe('محمد')
  })

  it('يقلم البريد ويوحّد الحالة', () => {
    expect(normalizeEmail('  Client@Example.COM ')).toBe('client@example.com')
  })

  it('يجرّد فواصل رقم الهوية', () => {
    expect(normalizeIdNumber('784-1985-1234567-1')).toBe('784198512345671')
  })
})

describe('findClientDuplicates (منع تكرار الموكلين)', () => {
  const existing = [
    { id: 'c1', full_name: 'أحمد حلمي', phone: '0501234567', email: 'a@x.com' },
    { id: 'c2', full_name: 'شركة النور', phone: '0509999999', email: 'n@x.com' },
  ]

  it('يرصد التطابق برقم الهاتف حتى مع اختلاف الصيغة', () => {
    const result = findClientDuplicates(
      { full_name: 'اسم مختلف', phone: '+971501234567' },
      existing
    )
    expect(result).toHaveLength(1)
    expect(result[0].record.id).toBe('c1')
    expect(result[0].matchedFields).toContain('رقم الهاتف')
  })

  it('يرصد التطابق بالبريد الإلكتروني', () => {
    const result = findClientDuplicates({ full_name: 'آخر', email: 'A@X.com' }, existing)
    expect(result.map((r) => r.record.id)).toEqual(['c1'])
  })

  it('لا يعتبر تطابق الاسم وحده تكرارًا مؤكدًا', () => {
    expect(findClientDuplicates({ full_name: 'أحمد حلمي' }, existing)).toEqual([])
  })

  it('يعتبر تطابق الاسم + الهاتف تكرارًا', () => {
    const result = findClientDuplicates(
      { full_name: 'أحمد حلمي', phone: '0501234567' },
      existing
    )
    expect(result[0].matchedFields).toEqual(expect.arrayContaining(['الاسم', 'رقم الهاتف']))
  })

  it('يستثني السجل الحالي عند التعديل (ignoreId)', () => {
    const result = findClientDuplicates(
      { id: 'c1', full_name: 'أحمد حلمي', phone: '0501234567' },
      existing,
      'c1'
    )
    expect(result).toEqual([])
  })

  it('يعيد مصفوفة فارغة لموكّل بلا أي بيانات تعريف', () => {
    expect(findClientDuplicates({}, existing)).toEqual([])
    expect(findClientDuplicates(null, existing)).toEqual([])
  })

  it('لا ينهار مع قائمة سجلات فارغة', () => {
    expect(findClientDuplicates({ phone: '0501234567' }, [])).toEqual([])
  })
})

describe('findInvoiceDuplicates (منع تكرار الفواتير)', () => {
  const existing = [
    {
      id: 'i1',
      invoice_number: 'INV-100',
      portal_scope: 'helm',
      client_name: 'أحمد حلمي',
      case_title: 'قضية عمالية',
      issue_date: '2026-01-10',
      total_fees: 5000,
    },
  ]

  it('يرصد نفس رقم الفاتورة في نفس القسم', () => {
    const result = findInvoiceDuplicates({ invoice_number: 'INV-100', portal_scope: 'helm' }, existing)
    expect(result[0].matchedFields).toContain('رقم الفاتورة والقسم')
  })

  it('لا يعتبر نفس الرقم في قسم مختلف تكرارًا', () => {
    const result = findInvoiceDuplicates({ invoice_number: 'INV-100', portal_scope: 'other' }, existing)
    expect(result).toEqual([])
  })

  it('يرصد التطابق الكامل في المحتوى (موكل + قضية + تاريخ + مبلغ)', () => {
    const result = findInvoiceDuplicates(
      {
        client_name: 'احمد حلمي',
        case_title: 'قضيه عماليه',
        issue_date: '2026-01-10',
        total_fees: 5000,
      },
      existing
    )
    expect(result[0].matchedFields).toContain('الموكل والقضية والتاريخ والمبلغ')
  })

  it('لا يرصد التطابق إذا اختلف المبلغ', () => {
    const result = findInvoiceDuplicates(
      {
        client_name: 'أحمد حلمي',
        case_title: 'قضية عمالية',
        issue_date: '2026-01-10',
        total_fees: 9999,
      },
      existing
    )
    expect(result).toEqual([])
  })
})

describe('defaultCaseSuccessPercentage و caseSuccessStats', () => {
  it('يعطي النسب الافتراضية لكل نتيجة', () => {
    expect(defaultCaseSuccessPercentage('حكم لصالح الموكل')).toBe(100)
    expect(defaultCaseSuccessPercentage('تسوية لصالح الموكل')).toBe(85)
    expect(defaultCaseSuccessPercentage('نجاح جزئي')).toBe(50)
    expect(defaultCaseSuccessPercentage('حكم ضد الموكل')).toBe(0)
    expect(defaultCaseSuccessPercentage('غير محسومة')).toBe(null)
  })

  it('يحسب المعدل والتوزيع', () => {
    const stats = caseSuccessStats([
      { status: 'مكتملة', case_result: 'حكم لصالح الموكل' },
      { status: 'جارية', case_result: 'نجاح جزئي' },
      { status: 'جارية', case_result: 'غير محسومة' },
      { status: 'مغلقة', case_result: 'حكم ضد الموكل' },
    ])
    expect(stats.total).toBe(4)
    expect(stats.active).toBe(2)
    expect(stats.completed).toBe(2)
    expect(stats.decided).toBe(3)
    expect(stats.unrated).toBe(1)
    expect(stats.won).toBe(1)
    expect(stats.partial).toBe(1)
    expect(stats.lost).toBe(1)
    expect(stats.rate).toBe(50)
  })

  it('يحترم النسبة اليدوية ويحدّها بين 0 و 100', () => {
    const stats = caseSuccessStats([
      { case_result: 'نجاح جزئي', success_percentage: 150 },
      { case_result: 'حكم ضد الموكل', success_percentage: -20 },
    ])
    expect(stats.ratedCases[0].calculated_success_percentage).toBe(100)
    expect(stats.ratedCases[1].calculated_success_percentage).toBe(0)
    expect(stats.rate).toBe(50)
  })

  it('يعيد rate = null عند عدم وجود قضايا محسومة', () => {
    const stats = caseSuccessStats([{ status: 'جارية', case_result: 'غير محسومة' }])
    expect(stats.decided).toBe(0)
    expect(stats.rate).toBe(null)
  })

  it('يتعامل مع قائمة فارغة', () => {
    const stats = caseSuccessStats()
    expect(stats.total).toBe(0)
    expect(stats.rate).toBe(null)
    expect(stats.ratedCases).toEqual([])
  })
})
