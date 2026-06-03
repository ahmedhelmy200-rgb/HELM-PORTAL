import { BADAYAT_APPROVED_LOGO_DATA_URI } from '@/lib/badayatLogoData'

export const BADAYAT_TEMPLATE_DRAFTS_KEY = 'helm_badayat_template_drafts_v4_final_header'
export const BADAYAT_PRINT_HEADER_KEY = 'helm_badayat_print_header_v4_final_header'

const todayAr = () => new Date().toLocaleDateString('ar-AE')
const issuedAtAr = () => new Date().toLocaleString('ar-AE')

export const defaultBadayatPrintHeader = {
  companyName: 'بداية الخير لتجارة السيارات المستعملة',
  companyNameEn: 'BDAYT ALKHIR CAR SHOWROOM',
  subtitle: '58 معرض بداية الخير، سوق سيارات الحراج، الشارقة',
  logoUrl: BADAYAT_APPROVED_LOGO_DATA_URI,
  address: '58 معرض بداية الخير، سوق سيارات الحراج، الشارقة',
  phone: '',
  email: '',
  licenseNo: '',
  footerNote: 'مستند صادر من نظام HELM Portal - قسم بداية الخير',
}

export const badayatTemplatePlaceholders = [
  'companyName','companyNameEn','branchName','today','issuedAt','fullName','nationality','emiratesId','passportNo','phone','email','jobTitle','department','workLocation','contractType','contractStart','contractEnd','basicSalary','allowances','deductions','netSalary','residencyStatus','residencyExpiry','workPermitExpiry','passportHeldVoluntarily','rating','notes','amount','reason','assetDescription','leaveStart','leaveEnd'
]

const contractBody = `عقد عمل مبدئي

تم هذا العقد في يوم ............/........../.......... الموافق ............/........../.......... بين كل من:

الطرف الأول: {{companyName}}، ومقرها {{workLocation}}، ويمثلها المفوض بالتوقيع أدناه.
الطرف الثاني: الموظف الموضح بياناته أدناه، ويقر الطرفان بأهليتهما القانونية للتعاقد، واتفقا على البنود التالية:

أولاً: بيانات الطرفين
الطرف الأول: {{companyName}}
العنوان: {{workLocation}}
الطرف الثاني: {{fullName}}
الجنسية: {{nationality}}
رقم جواز السفر: {{passportNo}}
رقم الهوية/الرقم المسجل: {{emiratesId}}
المسمى الوظيفي بالعقد: {{jobTitle}}
القسم: {{department}}
مدة العقد: {{contractType}}
فترة التجربة: 6 أشهر
الراتب الإجمالي: {{netSalary}} درهم
العمولة: نسبة متغيرة بحسب كل بيعة وفق سياسة الشركة واعتماد الإدارة، ولا تستحق إلا بعد إتمام البيع والتحصيل وإقفال العملية.

ثانياً: طبيعة العمل والأجر
1. يلتزم الطرف الثاني بالعمل لدى الطرف الأول بوظيفة {{jobTitle}}، وبأداء أعماله بجدية وأمانة وحسن نية، ووفقاً لتعليمات الإدارة واللوائح الداخلية وسياسات العمل المعتمدة لدى الشركة.
2. يكون الراتب الإجمالي مبلغ {{netSalary}} درهم شهرياً، ويجوز منح الطرف الثاني عمولة متغيرة بحسب كل بيعة وفق سياسة الشركة واعتماد الإدارة.

ثالثاً: مدة العقد وفترة التجربة
3. مدة هذا العقد {{contractType}} تبدأ من تاريخ مباشرة العمل الفعلية أو التاريخ المثبت كتابة بين الطرفين، ويجوز تجديده أو تعديله باتفاق كتابي.
4. يخضع الطرف الثاني لفترة تجربة مدتها 6 أشهر من تاريخ مباشرة العمل، ويجوز للطرف الأول تقييم أدائه وسلوكه والتزامه خلال هذه الفترة وفقاً للقانون واللوائح الداخلية.

رابعاً: مدة الإنذار
5. مدة الإنذار في حال إنهاء العقد من أي من الطرفين هي 3 أشهر كاملة، تبدأ من تاريخ تسليم إشعار الإنهاء للطرف الآخر، ما لم يقرر القانون أو اتفاق مكتوب غير ذلك.

خامساً: السرية والعهد ومصالح الشركة
6. يلتزم الطرف الثاني بالمحافظة على سرية بيانات ومستندات وأسعار وملفات العملاء والموردين وأي معلومات يطلع عليها بسبب العمل.
7. يلتزم الطرف الثاني برد جميع العهد والأدوات والمفاتيح والمستندات والصلاحيات التي تسلمها بسبب العمل عند طلب الشركة أو عند انتهاء العلاقة.

سادساً: أحكام عامة وحل النزاعات
8. يلتزم الطرف الثاني بجميع اللوائح الداخلية وتعليمات الإدارة، ويخضع هذا العقد لأحكام قانون العمل الاتحادي لدولة الإمارات العربية المتحدة والقرارات المنفذة له، وتختص الجهات والمحاكم المختصة في إمارة الشارقة عند النزاع.`

export const defaultBadayatTemplateBodies = {
  'عقد عمل شامل': contractBody,
  'عرض عمل': `عرض عمل\n\nالسيد/ {{fullName}}\n\nيسر {{companyName}} أن تعرض عليكم العمل بوظيفة {{jobTitle}} ضمن قسم {{department}}، بمقر العمل {{workLocation}}، براتب إجمالي {{netSalary}} درهم، وذلك اعتباراً من تاريخ {{contractStart}}.`,
  'تعديل مسمى وظيفي': `قرار تعديل مسمى وظيفي\n\nبتاريخ {{today}}، تقرر تعديل المسمى الوظيفي للسيد/ {{fullName}} إلى: {{jobTitle}}، داخل قسم {{department}} وفرع {{branchName}}.`,
  'ترقية وظيفية': `قرار ترقية وظيفية\n\nتقرر ترقية السيد/ {{fullName}} إلى وظيفة {{jobTitle}} بقسم {{department}}، وذلك اعتباراً من تاريخ {{today}}.`,
  'إقرار مباشرة عمل': `إقرار مباشرة عمل\n\nأقر أنا/ {{fullName}} بأنني باشرت العمل لدى {{companyName}} بوظيفة {{jobTitle}} اعتباراً من تاريخ {{contractStart}}.`,
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[ch]))
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback } catch { return fallback }
}

function titleForPrint(title) {
  return title === 'عقد عمل شامل' ? 'عقد عمل مبدئي' : (title || 'مستند بداية الخير')
}

function genericTemplateBody(templateName) {
  return `${templateName || 'مستند إداري'}\n\nالسيد/ {{fullName}}\nالوظيفة: {{jobTitle}}\nالفرع: {{branchName}}\nالتاريخ: {{today}}\n\nالموضوع: {{reason}}\n\n........................................................................\n........................................................................\n\nيعتمد هذا المستند ويحفظ في ملف الموظف.`
}

export function loadBadayatTemplateDrafts() {
  return readJson(BADAYAT_TEMPLATE_DRAFTS_KEY, {})
}

export function saveBadayatTemplateDraft(templateName, body) {
  const next = { ...loadBadayatTemplateDrafts(), [templateName]: body }
  localStorage.setItem(BADAYAT_TEMPLATE_DRAFTS_KEY, JSON.stringify(next))
  return next
}

export function resetBadayatTemplateDraft(templateName) {
  const drafts = loadBadayatTemplateDrafts()
  delete drafts[templateName]
  localStorage.setItem(BADAYAT_TEMPLATE_DRAFTS_KEY, JSON.stringify(drafts))
  return drafts
}

export function getBadayatTemplateBody(templateName) {
  const drafts = loadBadayatTemplateDrafts()
  return drafts[templateName] || defaultBadayatTemplateBodies[templateName] || genericTemplateBody(templateName)
}

export function loadBadayatPrintHeader() {
  return { ...defaultBadayatPrintHeader, ...readJson(BADAYAT_PRINT_HEADER_KEY, {}), logoUrl: BADAYAT_APPROVED_LOGO_DATA_URI }
}

export function saveBadayatPrintHeader(settings = {}) {
  const next = { ...loadBadayatPrintHeader(), ...settings, logoUrl: BADAYAT_APPROVED_LOGO_DATA_URI }
  localStorage.setItem(BADAYAT_PRINT_HEADER_KEY, JSON.stringify(next))
  return next
}

export function getEmployeeTemplateValues(employee = {}, branchName = 'بداية الخير') {
  const basicSalary = Number(employee.basicSalary || 0)
  const allowances = Number(employee.allowances || 0)
  const deductions = Number(employee.deductions || 0)
  return {
    companyName: defaultBadayatPrintHeader.companyName,
    companyNameEn: defaultBadayatPrintHeader.companyNameEn,
    branchName,
    today: todayAr(),
    issuedAt: issuedAtAr(),
    fullName: employee.fullName || '................',
    nationality: employee.nationality || '................',
    emiratesId: employee.emiratesId || '................',
    passportNo: employee.passportNo || '................',
    phone: employee.phone || '................',
    email: employee.email || '................',
    jobTitle: employee.jobTitle || '................',
    department: employee.department || '................',
    workLocation: employee.workLocation || defaultBadayatPrintHeader.address,
    contractType: employee.contractType || 'سنتان',
    contractStart: employee.contractStart || '................',
    contractEnd: employee.contractEnd || '................',
    basicSalary: basicSalary.toLocaleString('ar-AE'),
    allowances: allowances.toLocaleString('ar-AE'),
    deductions: deductions.toLocaleString('ar-AE'),
    netSalary: (basicSalary + allowances - deductions).toLocaleString('ar-AE'),
    residencyStatus: employee.residencyStatus || '................',
    residencyExpiry: employee.residencyExpiry || '................',
    workPermitExpiry: employee.workPermitExpiry || '................',
    passportHeldVoluntarily: employee.passportHeldVoluntarily || 'لا',
    rating: employee.rating || '0',
    notes: employee.notes || '',
    amount: '................',
    reason: '................',
    assetDescription: '................',
    leaveStart: '................',
    leaveEnd: '................',
  }
}

export function renderBadayatTemplate(body, employee, branchName) {
  const values = getEmployeeTemplateValues(employee, branchName)
  return String(body || '').replace(/{{\s*([\w]+)\s*}}/g, (_, key) => values[key] ?? `{{${key}}}`)
}

function bodyToHtml(body, title) {
  const printedTitle = titleForPrint(title)
  return String(body || '')
    .split('\n')
    .filter((line, index) => !(index === 0 && line.trim() === printedTitle))
    .map((raw) => {
      const line = raw.trim()
      if (!line) return '<div class="gap"></div>'
      const safe = escapeHtml(line)
      if (/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|ثامناً|تاسعاً|عاشراً)[:：]/.test(line)) return `<div class="sec">${safe}</div>`
      if (/^\d+\./.test(line)) return `<p class="clause">${safe}</p>`
      if (line.includes(':') && line.length < 120) {
        const idx = line.indexOf(':')
        return `<div class="row"><span>${escapeHtml(line.slice(0, idx + 1))}</span><b>${escapeHtml(line.slice(idx + 1).trim()) || '................'}</b></div>`
      }
      return `<p>${safe}</p>`
    }).join('')
}

function buildBadayatPrintHtml(title, renderedBody, printSettings = {}) {
  const settings = { ...loadBadayatPrintHeader(), ...printSettings, logoUrl: BADAYAT_APPROVED_LOGO_DATA_URI }
  const finalTitle = titleForPrint(title)
  const safeTitle = escapeHtml(finalTitle)
  const company = escapeHtml(settings.companyName)
  const subtitle = escapeHtml(settings.subtitle)
  const logoUrl = settings.logoUrl
  const bodyHtml = bodyToHtml(renderedBody, finalTitle)
  const footerNote = escapeHtml(settings.footerNote || '')
  const issuedAt = escapeHtml(issuedAtAr())

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${safeTitle}</title><style>
@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#e5e7eb;color:#111827;font-family:Arial,Tahoma,'Segoe UI',sans-serif;direction:rtl;text-align:right}.actions{max-width:210mm;margin:12px auto;display:flex;gap:8px}.actions button{border:0;border-radius:12px;padding:10px 18px;font-weight:900;background:#111827;color:white}.page{width:210mm;min-height:297mm;margin:0 auto 18px;background:white;position:relative;padding:13mm 16mm 16mm;overflow:hidden}.corner{position:absolute;width:27mm;height:27mm;border-color:#111827}.c1{top:8mm;right:8mm;border-top:3px solid;border-right:3px solid}.c2{top:8mm;left:8mm;border-top:3px solid;border-left:3px solid}.c3{bottom:8mm;right:8mm;border-bottom:3px solid;border-right:3px solid}.c4{bottom:8mm;left:8mm;border-bottom:3px solid;border-left:3px solid}.head{position:relative;min-height:37mm;margin-bottom:8mm;text-align:center}.logo{position:absolute;left:3mm;top:0;width:28mm;height:28mm;object-fit:contain}.company{margin:0;font-size:27px;font-weight:900}.addr{margin-top:3mm;font-size:15px;font-weight:600;color:#374151}.orn{width:104mm;margin:7mm auto 0;border-top:1.8px solid #111827;position:relative}.orn:after{content:'';position:absolute;top:-4.3mm;left:50%;width:7mm;height:7mm;background:#111827;transform:translateX(-50%) rotate(45deg)}.title{text-align:center;font-size:28px;font-weight:900;margin:7mm auto 6mm}.body{position:relative;z-index:1;font-size:14.7px;line-height:1.9}.wm{position:absolute;top:52%;left:50%;transform:translate(-50%,-50%);font-size:78px;font-weight:900;color:rgba(17,24,39,.045);letter-spacing:7px;white-space:nowrap}.wms{position:absolute;top:58%;left:50%;transform:translate(-50%,-50%);font-size:28px;color:rgba(17,24,39,.035);letter-spacing:6px;white-space:nowrap}.sec{display:block;width:fit-content;margin:5mm 0 3mm;background:#111827;color:white;border-radius:5px;padding:2mm 6mm;font-weight:900;font-size:17px}.row{display:grid;grid-template-columns:48mm 1fr;gap:4mm;border-bottom:1px solid #d6d6d6;min-height:7.5mm;align-items:center}.row span{font-weight:900}.row b{font-weight:600;text-align:center}.clause{margin:0 0 2mm;text-align:justify}.gap{height:2.2mm}.sig{display:grid;grid-template-columns:repeat(3,1fr);gap:7mm;margin-top:9mm}.box h3{margin:0 0 4mm;border-top:1.8px solid #111827;padding-top:2.5mm;text-align:center;font-size:15px}.box div{border-bottom:1px solid #a3a3a3;height:8mm;font-size:12px;color:#374151}.foot{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;align-items:center;justify-content:center;gap:9mm;font-size:12px}.foot:before,.foot:after{content:'';height:1px;background:#111827;flex:1;max-width:34mm}.note{position:absolute;right:16mm;bottom:3mm;font-size:9px;color:#6b7280}.meta{position:absolute;left:16mm;bottom:3mm;font-size:9px;color:#6b7280}@media print{html,body{background:white}.actions{display:none}.page{margin:0;box-shadow:none}}
</style></head><body><div class="actions"><button onclick="window.print()">طباعة المستند</button><button onclick="window.close()">إغلاق</button></div><main class="page"><div class="corner c1"></div><div class="corner c2"></div><div class="corner c3"></div><div class="corner c4"></div><header class="head"><img class="logo" src="${logoUrl}" alt="${company}"/><h1 class="company">${company}</h1><div class="addr">${subtitle}</div><div class="orn"></div></header><div class="wm">BK</div><div class="wms">BDAYT ALKHIR</div><h2 class="title">${safeTitle}</h2><section class="body">${bodyHtml}</section><section class="sig"><div class="box"><h3>الطرف الأول / الشركة</h3><div>الاسم:</div><div>التوقيع:</div><div>التاريخ:</div><div>الختم:</div></div><div class="box"><h3>الطرف الثاني / الموظف</h3><div>الاسم:</div><div>التوقيع:</div><div>التاريخ:</div></div><div class="box"><h3>الشهود إن وجدوا</h3><div>الاسم:</div><div>التوقيع:</div><div>الاسم:</div><div>التوقيع:</div></div></section><div class="foot">1</div><div class="note">${footerNote}</div><div class="meta">وقت الإصدار: ${issuedAt}</div></main></body></html>`
}

export function printBadayatDocument(title, renderedBody, printSettings = {}) {
  const html = buildBadayatPrintHtml(title, renderedBody, printSettings)
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=980,height=900')
  if (!printWindow) return false
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  setTimeout(() => {
    try { printWindow.focus(); printWindow.print() } catch (error) { console.error('[Badayat Print] failed', error) }
  }, 650)
  return true
}
