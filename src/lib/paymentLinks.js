// توليد روابط الدفع وإدارة حالات الدفع
import { getInvoiceTotals } from './invoiceMath'

export function generatePaymentToken(invoiceId) {
  const payload = { id: invoiceId, ts: Date.now() }
  return btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

// base64 في المتصفح يشترط أن يكون الطول من مضاعفات 4.
// الطريقة القديمة كانت تضيف '==' دائمًا، فتفشل الروابط التي لا يوافق طولها ذلك
// (مثال: معرّفات نصية مثل INV-2026-001) وتظهر للموكّل رسالة "رابط الدفع غير صالح".
// هنا نحسب الحشو الصحيح حسب الطول الفعلي.
function base64UrlToBase64(value) {
  const normalized = String(value || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/[^A-Za-z0-9+/]/g, '')

  const remainder = normalized.length % 4
  if (remainder === 1) return null // طول غير صالح في base64 ولا يمكن إكماله
  return remainder === 0 ? normalized : normalized + '='.repeat(4 - remainder)
}

export function parsePaymentToken(token) {
  try {
    const padded = base64UrlToBase64(token)
    if (!padded) return null
    const parsed = JSON.parse(atob(padded))
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function buildPaymentUrl(invoiceId, baseUrl) {
  const token = generatePaymentToken(invoiceId)
  const base  = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/Payment?token=${token}`
}

// رسالة واتساب مع رابط الدفع
export function buildPaymentWhatsAppMessage(invoice, paymentUrl, officeSettings = {}) {
  const { remaining } = getInvoiceTotals(invoice)
  const office = officeSettings.office_name || 'المكتب القانوني'
  const phone  = officeSettings.phone || ''

  return `مرحباً ${invoice.client_name || 'الموكّل الكريم'}،

💳 رابط الدفع الإلكتروني لفاتورتك:

• رقم الفاتورة: ${invoice.invoice_number || '—'}
• المبلغ المستحق: *${remaining.toLocaleString('ar')} ${invoice.currency || 'د.إ'}*

🔗 ادفع الآن بأمان:
${paymentUrl}

يدعم البطاقات الائتمانية والمدى وApple Pay وGoogle Pay.

${phone}
${office}`
}

// رسالة إيميل مع رابط الدفع
export function buildPaymentEmailBody(invoice, paymentUrl, officeSettings = {}) {
  const { remaining } = getInvoiceTotals(invoice)
  const office = officeSettings.office_name || 'المكتب القانوني'

  return {
    subject: `رابط الدفع — فاتورة ${invoice.invoice_number || ''}`,
    body: `مرحباً ${invoice.client_name || ''},\n\nيسعدنا إعلامك بأن فاتورتك جاهزة للدفع الإلكتروني:\n\nرقم الفاتورة: ${invoice.invoice_number || '—'}\nالمبلغ المستحق: ${remaining.toLocaleString()} ${invoice.currency || 'د.إ'}\n\nرابط الدفع:\n${paymentUrl}\n\nيمكنك الدفع بأي بطاقة ائتمانية أو مدى أو Apple Pay أو Google Pay.\n\n${office}`,
  }
}
