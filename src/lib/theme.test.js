import { describe, expect, it } from 'vitest'
import {
  AVAILABLE_APP_FONTS,
  getGoogleFontStylesheetUrl,
  hexToHsl,
  mixHex,
  normalizeAppFont,
} from './theme'

describe('هوية HELM البصرية', () => {
  it('يسمح فقط بالخطوط المعتمدة ويعود إلى Cairo للقيم غير الآمنة', () => {
    expect(normalizeAppFont('Tajawal')).toBe('Tajawal')
    expect(normalizeAppFont('  Amiri  ')).toBe('Amiri')
    expect(normalizeAppFont('https://attacker.example/font.css')).toBe('Cairo')
    expect(normalizeAppFont('')).toBe('Cairo')
  })

  it('ينشئ رابط Google Fonts لخط واحد فقط', () => {
    const url = getGoogleFontStylesheetUrl('IBM Plex Sans Arabic')
    expect(url).toContain('family=IBM+Plex+Sans+Arabic')
    expect(url).not.toContain('&family=')
    expect(url).toContain('display=swap')
  })

  it('تبقى قائمة الخطوط فريدة', () => {
    expect(new Set(AVAILABLE_APP_FONTS).size).toBe(AVAILABLE_APP_FONTS.length)
  })

  it('يحوّل ويمزج الألوان بقيم مستقرة', () => {
    expect(hexToHsl('#ff0000')).toBe('0 100% 50%')
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080')
  })
})
