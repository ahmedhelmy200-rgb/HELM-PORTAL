// أدوات تأمين بناء HTML الديناميكي (نوافذ الطباعة والمعاينة).
//
// السبب: بعض الشاشات تبني HTML نصيًا ثم تكتبه داخل نافذة منبثقة من نفس الأصل
// (window.open("", "_blank") + document.write). أي قيمة مصدرها المستخدم أو قاعدة
// البيانات تُدرج في هذا HTML بدون تهريب = ثغرة XSS مخزّنة تصل إلى جلسة الدخول.
// لذلك: كل قيمة ديناميكية تُمرَّر من escapeHtml قبل الإدراج.

const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
}

const ESCAPE_PATTERN = /[&<>"'`]/g

/**
 * يهرّب الأحرف الخاصة في HTML حتى تُعرض القيمة كنص لا كوسم.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(ESCAPE_PATTERN, (char) => HTML_ENTITIES[char])
}

/**
 * يقطع رجوع النافذة المنبثقة إلى نافذة البوابة (window.opener).
 * يقلّل أثر أي XSS متبقٍ داخل نافذة الطباعة من التحكم في التبويب الأصلي.
 * @param {Window | null | undefined} win
 * @returns {Window | null | undefined}
 */
export function detachOpener(win) {
  try {
    if (win) win.opener = null
  } catch {
    // بعض المتصفحات تمنع التعيين؛ نتجاهل الخطأ بدل إسقاط الطباعة.
  }
  return win
}
