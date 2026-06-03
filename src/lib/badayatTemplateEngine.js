import { BADAYAT_APPROVED_LOGO_DATA_URI } from '@/lib/badayatLogoData'

export const BADAYAT_TEMPLATE_DRAFTS_KEY = 'helm_badayat_template_drafts_v2'
export const BADAYAT_PRINT_HEADER_KEY = 'helm_badayat_print_header_v2'

const todayAr = () => new Date().toLocaleDateString('ar-AE')
const issuedAtAr = () => new Date().toLocaleString('ar-AE')

export const defaultBadayatPrintHeader = {
  companyName: 'شركة بداية الخير للتجارة ش.ذ.م.م',
  companyNameEn: 'BDAYT ALKHIR TRADING L.L.C',
  subtitle: 'إدارة شؤون الموظفين والعهد والنماذج الداخلية',
  logoUrl: BADAYAT_APPROVED_LOGO_DATA_URI,
  address: 'دبي - الإمارات العربية المتحدة',
  phone: '',
  email: '',
  licenseNo: '',
  footerNote: 'مستند داخلي صادر إلكترونياً من HELM Portal - قسم بداية الخير',
}

export const badayatTemplatePlaceholders = [
  'companyName', 'companyNameEn', 'branchName', 'today', 'fullName', 'nationality', 'emiratesId', 'passportNo', 'phone', 'email',
  'jobTitle', 'department', 'workLocation', 'contractType', 'contractStart', 'contractEnd', 'basicSalary', 'allowances',
  'deductions', 'netSalary', 'residencyStatus', 'residencyExpiry', 'workPermitExpiry', 'passportHeldVoluntarily', 'rating',
  'notes', 'amount', 'reason', 'assetDescription', 'leaveStart', 'leaveEnd', 'issuedAt',
]

export const defaultBadayatTemplateBodies = {
  'عقد عمل شامل': `عقد عمل داخلي شامل

إنه في يوم {{today}}، تم تحرير هذا العقد بين كل من:

أولاً: {{companyName}} - {{companyNameEn}}، ويشار إليها فيما بعد بـ "الشركة".
ثانياً: السيد/ {{fullName}}، الجنسية: {{nationality}}، رقم الهوية/الرقم المسجل: {{emiratesId}}، رقم جواز السفر: {{passportNo}}، ويشار إليه فيما بعد بـ "الموظف".

تمهيد
حيث إن الشركة ترغب في الاستعانة بخدمات الموظف، وحيث أبدى الموظف قبوله العمل لدى الشركة وفقاً للبيانات والشروط الموضحة أدناه، فقد اتفق الطرفان على ما يلي:

البند الأول: الوظيفة ومكان العمل
يلتحق الموظف بالعمل لدى الشركة بوظيفة: {{jobTitle}}، ضمن قسم: {{department}}، بمقر/فرع: {{branchName}}، ومكان العمل: {{workLocation}}، ويجوز تكليفه بما يتصل بطبيعة عمله طبقاً لمقتضيات التشغيل والإدارة.

البند الثاني: نوع العقد ومدته
نوع العقد: {{contractType}}.
تاريخ بداية العقد: {{contractStart}}.
تاريخ نهاية العقد: {{contractEnd}}.
وتخضع علاقة العمل للأنظمة واللوائح المعمول بها داخل دولة الإمارات العربية المتحدة، وما يصدر عن الشركة من سياسات داخلية لا تخالف النظام العام أو القانون.

البند الثالث: الأجر والمستحقات
الراتب الأساسي: {{basicSalary}} درهم.
العلاوات/البدلات الحالية: {{allowances}} درهم.
الخصومات الحالية إن وجدت: {{deductions}} درهم.
صافي المستحق الشهري الحالي: {{netSalary}} درهم.
ويتم إثبات أي تعديل لاحق على الأجر أو البدلات أو الخصومات بموجب قرار أو مستند كتابي صادر من الشركة.

البند الرابع: الالتزامات الوظيفية
يلتزم الموظف بأداء العمل المكلف به بأمانة وحسن نية، واحترام مواعيد العمل، والمحافظة على أموال ومستندات وأسرار وبيانات وعملاء الشركة، وعدم استعمال العهد أو المستندات أو الحسابات أو الصلاحيات المسلمة إليه في غير أغراض العمل.

البند الخامس: العهد والمستندات
يلتزم الموظف برد كافة العهد والمبالغ والمستندات والمفاتيح والبطاقات والأجهزة وأي ممتلكات تخص الشركة فور طلبها أو عند انتهاء علاقة العمل، ويقر بمسؤوليته عن أي عهدة تثبت كتابياً في ذمته وفقاً للإجراءات النظامية.

البند السادس: الجزاءات والتنبيهات
تطبق الشركة الجزاءات الإدارية أو الخصومات أو التنبيهات وفق اللوائح الداخلية والإجراءات القانونية المقررة، وبعد تمكين الموظف من إبداء أقواله متى اقتضى الأمر ذلك.

البند السابع: السرية وعدم الإفشاء
يلتزم الموظف بالحفاظ على سرية كافة البيانات والمعلومات التجارية والمالية والإدارية الخاصة بالشركة وعملائها، ولا يجوز له نسخها أو إفشاؤها أو استعمالها لمصلحته أو لمصلحة الغير.

البند الثامن: بيانات المتابعة
حالة الإقامة/التصريح: {{residencyStatus}}.
تاريخ انتهاء الإقامة: {{residencyExpiry}}.
تاريخ انتهاء تصريح العمل: {{workPermitExpiry}}.
ملاحظات الملف: {{notes}}.

البند التاسع: نسخ العقد
حرر هذا العقد من نسخة إلكترونية/ورقية للاحتفاظ بها في ملف الموظف، ويعمل به من تاريخ توقيعه أو من تاريخ المباشرة أيهما أسبق.

والله ولي التوفيق.` ,

  'عرض عمل': `عرض عمل

السيد/ {{fullName}}

يسر {{companyName}} / فرع {{branchName}} أن تعرض عليكم العمل بوظيفة {{jobTitle}} ضمن قسم {{department}}، بمقر العمل {{workLocation}}، براتب أساسي {{basicSalary}} درهم وعلاوات {{allowances}} درهم، وذلك اعتباراً من تاريخ {{contractStart}}.

يخضع العرض لاستكمال المستندات والإجراءات الإدارية والقانونية اللازمة، ولا يعد نهائياً إلا بعد اعتماد الشركة واستيفاء المتطلبات الرسمية.` ,

  'تعديل مسمى وظيفي': `قرار تعديل مسمى وظيفي

بتاريخ {{today}}، تقرر تعديل المسمى الوظيفي للسيد/ {{fullName}}، هوية/رقم مسجل {{emiratesId}}، إلى المسمى الوظيفي: {{jobTitle}}، وذلك داخل فرع {{branchName}} وقسم {{department}}.

ويستمر العمل بباقي شروط العلاقة الوظيفية كما هي ما لم يصدر تعديل كتابي آخر.` ,

  'ترقية وظيفية': `قرار ترقية وظيفية

تقرر ترقية السيد/ {{fullName}}، العامل لدى فرع {{branchName}}، إلى وظيفة {{jobTitle}} بقسم {{department}}، وذلك تقديراً لمستوى الأداء والتقييم الحالي {{rating}}%.

تسري الترقية اعتباراً من تاريخ {{today}}، مع بقاء باقي الشروط وفق الملف الوظيفي المعتمد.` ,

  'إقرار مباشرة عمل': `إقرار مباشرة عمل

أقر أنا/ {{fullName}}، جنسيتي {{nationality}}، هوية/رقم مسجل {{emiratesId}}، بأنني باشرت العمل لدى {{companyName}} / فرع {{branchName}} بوظيفة {{jobTitle}} اعتباراً من تاريخ {{contractStart}}.

وأقر بأن بيانات التواصل الخاصة بي هي: {{phone}} - {{email}}.` ,

  'إنذار أول': `إنذار أول

السيد/ {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}

نحيطكم علماً بأنه بتاريخ {{today}} تم توجيه هذا الإنذار بسبب: {{reason}}

وعليه نلفت نظركم إلى ضرورة عدم تكرار المخالفة والالتزام بتعليمات الإدارة واللوائح الداخلية للشركة.` ,

  'إنذار نهائي': `إنذار نهائي

السيد/ {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}

بالإشارة إلى المخالفة المنسوبة إليكم وسببها: {{reason}}، فقد تقرر توجيه إنذار نهائي لكم.

ويعد هذا الإنذار آخر تنبيه إداري قبل اتخاذ الإجراءات الأشد وفق اللوائح والإجراءات المقررة.` ,

  'نموذج تحقيق إداري': `محضر تحقيق إداري

اليوم والتاريخ: {{today}}
الموظف: {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}
رقم الهوية/الرقم المسجل: {{emiratesId}}

موضوع التحقيق: {{reason}}

سؤال: ما قولك فيما هو منسوب إليك؟
الإجابة: ........................................................................

سؤال: هل لديك مستندات أو شهود أو ملاحظات؟
الإجابة: ........................................................................

أقوال المحقق/التوصية:
........................................................................` ,

  'نموذج خصم بسبب غياب': `قرار خصم بسبب غياب

السيد/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}.

نظراً لغيابكم/مخالفتكم بتاريخ {{today}} بسبب: {{reason}}، فقد تقرر تطبيق خصم قدره {{amount}} درهم من مستحقاتكم، وفق الإجراءات الداخلية المعتمدة.` ,

  'نموذج خصم بسبب جزاء': `قرار خصم بسبب جزاء إداري

السيد/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}.

بناءً على المخالفة المنسوبة إليكم بشأن: {{reason}}، فقد تقرر توقيع جزاء خصم قدره {{amount}} درهم، ويتم تسجيله في ملفكم الوظيفي.` ,

  'نموذج فصل': `إخطار بإنهاء خدمة / فصل

السيد/ {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}

نفيدكم بأنه تقرر إنهاء خدمتكم/فصلكم من العمل لدى {{companyName}} اعتباراً من تاريخ {{today}}، وذلك للأسباب الآتية: {{reason}}.

على أن يتم تسليم ما بعهدتكم وإجراء المخالصة وفق الإجراءات المتبعة.` ,

  'إخطار مخالفة': `إخطار مخالفة

السيد/ {{fullName}}

نخطركم بوجود مخالفة إدارية منسوبة إليكم بتاريخ {{today}} وبيانها: {{reason}}.

يرجى تقديم ردكم كتابة خلال المدة المحددة من الإدارة، وسيتم حفظ هذا الإخطار في ملفكم الوظيفي.` ,

  'إقرار استلام مبلغ': `إقرار استلام مبلغ

أقر أنا/ {{fullName}}، هوية/رقم مسجل {{emiratesId}}، بأنني استلمت من {{companyName}} / فرع {{branchName}} مبلغاً وقدره {{amount}} درهم، وذلك عن/بسبب: {{reason}}.

وهذا إقرار مني بالاستلام الفعلي دون تحفظ.` ,

  'إقرار استلام عهدة': `إقرار استلام عهدة

أقر أنا/ {{fullName}}، هوية/رقم مسجل {{emiratesId}}، العامل بوظيفة {{jobTitle}} لدى فرع {{branchName}}، بأنني استلمت العهدة التالية:

{{assetDescription}}

وأتعهد بالمحافظة عليها واستعمالها في أغراض العمل فقط وردها فور طلب الشركة أو عند انتهاء العلاقة العمالية.` ,

  'استلام وتسليم عهدة': `محضر استلام وتسليم عهدة

بتاريخ {{today}} تم استلام/تسليم العهدة التالية الخاصة بالموظف/ {{fullName}}، وظيفته {{jobTitle}}، فرع {{branchName}}:

{{assetDescription}}

حالة العهدة وقت التسليم/الاستلام:
........................................................................` ,

  'تسليم جواز السفر للشركة طواعية بدلاً من سداد ضمان العهدة': `إقرار تسليم جواز السفر طواعية للحفظ الإداري

أقر أنا/ {{fullName}}، جنسيتي {{nationality}}، أحمل جواز سفر رقم {{passportNo}} وهوية/رقم مسجل {{emiratesId}}، بأنني سلمت جواز سفري إلى {{companyName}} / فرع {{branchName}} طواعية وبمحض إرادتي للحفظ الإداري المؤقت بناءً على طلبي، دون إكراه أو حجز غير مشروع.

وأقر بأنه يحق لي طلب استلام جواز سفري في أي وقت وفق الإجراءات النظامية، وأن هذا الإقرار لا يعد تنازلاً عن أي حق مقرر قانوناً.` ,

  'إقرار إرجاع عهدة': `إقرار إرجاع عهدة

أقر أنا/ {{fullName}} بأنني قمت بإرجاع العهدة التالية إلى {{companyName}} / فرع {{branchName}}:

{{assetDescription}}

وتمت معاينتها بمعرفة المختص بتاريخ {{today}}.` ,

  'طلب إجازة': `طلب إجازة

أتقدم أنا/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}، بطلب إجازة من تاريخ {{leaveStart}} إلى تاريخ {{leaveEnd}}، وذلك بسبب: {{reason}}.

وأتعهد بالعودة إلى العمل في الموعد المحدد.` ,

  'نموذج موافقة إجازة': `موافقة إجازة

توافق إدارة {{companyName}} / فرع {{branchName}} على منح السيد/ {{fullName}}، وظيفة {{jobTitle}}، إجازة من تاريخ {{leaveStart}} إلى تاريخ {{leaveEnd}}، وذلك وفقاً لرصيد الإجازات والإجراءات الداخلية.` ,

  'إقرار استلام مستحقات نهاية الخدمة': `إقرار استلام مستحقات نهاية الخدمة

أقر أنا/ {{fullName}}، هوية/رقم مسجل {{emiratesId}}، بأنني استلمت من {{companyName}} / فرع {{branchName}} كافة مستحقاتي المتعلقة بانتهاء علاقة العمل حتى تاريخ {{today}}، وذلك بعد المراجعة والمطابقة.

وأوقع على هذا الإقرار وأنا بكامل إرادتي، مع احتفاظ كل طرف بما يقرره القانون من حقوق لا يجوز التنازل عنها.` ,

  'نموذج استقالة': `استقالة

السادة/ إدارة {{companyName}}

أتقدم أنا/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}، باستقالتي من العمل اعتباراً من تاريخ {{today}}، وذلك للأسباب الآتية: {{reason}}.

وأتعهد بتسليم ما بعهدتي وإنهاء إجراءات المخالصة وفق النظام المتبع.` ,

  'نموذج سلفة': `طلب / إقرار سلفة

أقر أنا/ {{fullName}}، وظيفة {{jobTitle}}، بأنني طلبت/استلمت من {{companyName}} مبلغاً وقدره {{amount}} درهم كسلفة، وذلك بسبب: {{reason}}.

وأوافق على تسوية السلفة وفق الآلية المعتمدة لدى الإدارة.` ,

  'نموذج تعهد بعدم التكرار': `تعهد بعدم التكرار

أتعهد أنا/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}، بعدم تكرار المخالفة الآتية: {{reason}}.

وأقر بأنني علمت بما قد يترتب على التكرار من إجراءات إدارية وفق اللوائح الداخلية.` ,

  'نموذج تنبيه وتوجيه': `تنبيه وتوجيه إداري

السيد/ {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}

تنبهكم الإدارة إلى الآتي: {{reason}}

ويعد هذا التنبيه توجيهاً إدارياً لتحسين الأداء والالتزام بمقتضيات العمل.` ,

  'لائحة داخلية للعقوبات والخصومات': `إقرار بالاطلاع على لائحة العقوبات والخصومات

أقر أنا/ {{fullName}}، هوية/رقم مسجل {{emiratesId}}، العامل لدى {{companyName}} / فرع {{branchName}} بوظيفة {{jobTitle}}، بأنني اطلعت على لائحة الشركة الداخلية الخاصة بالمخالفات والعقوبات والخصومات، وفهمت مضمونها والتزمت بها.` ,

  'إقرار اطلاع الموظف على موانع ومحظورات وسياسة الشركة': `إقرار اطلاع على موانع ومحظورات وسياسة الشركة

أقر أنا/ {{fullName}}، هوية/رقم مسجل {{emiratesId}}، بأنني اطلعت على سياسات {{companyName}} ولوائحها الداخلية، بما في ذلك موانع ومحظورات العمل، قواعد السرية، المحافظة على العهد، الالتزام بساعات العمل، التعامل مع العملاء، وعدم استعمال ممتلكات الشركة في غير الغرض المخصص لها.` ,
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[ch]))
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback } catch { return fallback }
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
  return drafts[templateName] || defaultBadayatTemplateBodies[templateName] || ''
}

export function loadBadayatPrintHeader() {
  const saved = readJson(BADAYAT_PRINT_HEADER_KEY, {})
  return { ...defaultBadayatPrintHeader, ...saved, logoUrl: BADAYAT_APPROVED_LOGO_DATA_URI }
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
    workLocation: employee.workLocation || '................',
    contractType: employee.contractType || '................',
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

function buildBadayatPrintHtml(title, renderedBody, printSettings = {}) {
  const settings = { ...loadBadayatPrintHeader(), ...printSettings, logoUrl: BADAYAT_APPROVED_LOGO_DATA_URI }
  const safeTitle = escapeHtml(title || 'مستند بداية الخير')
  const safeBody = escapeHtml(renderedBody || '')
  const company = escapeHtml(settings.companyName || defaultBadayatPrintHeader.companyName)
  const companyEn = escapeHtml(settings.companyNameEn || defaultBadayatPrintHeader.companyNameEn)
  const subtitle = escapeHtml(settings.subtitle || defaultBadayatPrintHeader.subtitle)
  const address = escapeHtml(settings.address || '')
  const phone = escapeHtml(settings.phone || '')
  const email = escapeHtml(settings.email || '')
  const licenseNo = escapeHtml(settings.licenseNo || '')
  const footerNote = escapeHtml(settings.footerNote || defaultBadayatPrintHeader.footerNote)
  const issuedAt = escapeHtml(issuedAtAr())
  const logoUrl = settings.logoUrl

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<style>
  @page{size:A4;margin:0}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#e5e7eb;color:#111827;font-family:Arial,Tahoma,'Segoe UI',sans-serif;direction:rtl;text-align:right}
  .screen-actions{max-width:210mm;margin:12px auto;display:flex;justify-content:flex-start;gap:8px}
  .screen-actions button{border:0;border-radius:12px;padding:10px 18px;font-weight:900;cursor:pointer;background:#111827;color:white}
  .page{width:210mm;min-height:297mm;margin:0 auto 18px;background:white;position:relative;padding:13mm;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,.20)}
  .outer-frame{position:absolute;inset:7mm;border:3px solid #111827;border-radius:18px;pointer-events:none}
  .inner-frame{position:absolute;inset:10mm;border:1.8px solid #b45309;border-radius:14px;pointer-events:none}
  .corner{position:absolute;width:30mm;height:30mm;border-color:#b45309;pointer-events:none}
  .c1{top:10mm;right:10mm;border-top:5px solid;border-right:5px solid;border-radius:0 14px 0 0}
  .c2{top:10mm;left:10mm;border-top:5px solid;border-left:5px solid;border-radius:14px 0 0 0}
  .c3{bottom:10mm;right:10mm;border-bottom:5px solid;border-right:5px solid;border-radius:0 0 14px 0}
  .c4{bottom:10mm;left:10mm;border-bottom:5px solid;border-left:5px solid;border-radius:0 0 0 14px}
  .watermark{position:absolute;top:52%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:58px;font-weight:900;color:rgba(180,83,9,.055);white-space:nowrap;z-index:0}
  .content{position:relative;z-index:1;padding:7mm 7mm 5mm}
  .head{display:grid;grid-template-columns:33mm 1fr 49mm;gap:7mm;align-items:center;border-bottom:3px solid #111827;padding-bottom:5mm}
  .logo-box{width:31mm;height:31mm;border:2px solid #b45309;border-radius:16px;background:white;display:flex;align-items:center;justify-content:center;padding:2mm;overflow:hidden}
  .logo{width:100%;height:100%;object-fit:contain;display:block}
  .brand h1{margin:0;font-size:23px;font-weight:900;color:#111827;line-height:1.35}
  .brand .en{margin-top:1mm;font-size:11.5px;letter-spacing:2.1px;font-weight:900;color:#92400e;direction:ltr;text-align:right}
  .brand .sub{margin-top:2mm;font-size:12px;color:#4b5563;font-weight:800}
  .meta{border:1.5px solid #d1d5db;background:#f9fafb;border-radius:14px;padding:3mm;font-size:10.5px;line-height:1.75;color:#374151}
  .title{width:fit-content;min-width:76mm;margin:8mm auto 7mm;text-align:center;border:2.2px solid #111827;border-radius:15px;padding:2.4mm 11mm;font-size:22px;font-weight:900;background:linear-gradient(180deg,#fff,#f8fafc)}
  .body{white-space:pre-wrap;font-size:15.8px;line-height:2.03;min-height:145mm;color:#111827}
  .signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:9mm;page-break-inside:avoid}
  .sig{border:1.7px solid #111827;border-radius:13px;min-height:27mm;text-align:center;font-weight:900;padding:4mm;background:rgba(249,250,251,.72)}
  .sig .line{margin-top:11mm;border-top:1px solid #111827;padding-top:2mm;font-size:11px;color:#374151}
  .footer{margin-top:6mm;border-top:1px solid #d1d5db;padding-top:3mm;display:flex;justify-content:space-between;gap:6mm;font-size:10.5px;color:#6b7280}
  @media print{html,body{background:white}.screen-actions{display:none}.page{margin:0;width:210mm;min-height:297mm;box-shadow:none}}
</style>
</head>
<body>
  <div class="screen-actions"><button onclick="window.print()">طباعة المستند</button><button onclick="window.close()">إغلاق</button></div>
  <main class="page">
    <div class="outer-frame"></div><div class="inner-frame"></div>
    <div class="corner c1"></div><div class="corner c2"></div><div class="corner c3"></div><div class="corner c4"></div>
    <div class="watermark">${company}</div>
    <section class="content">
      <header class="head">
        <div class="logo-box"><img class="logo" src="${logoUrl}" alt="${company}" /></div>
        <div class="brand"><h1>${company}</h1><div class="en">${companyEn}</div><div class="sub">${subtitle}</div></div>
        <div class="meta"><div><b>التاريخ:</b> ${escapeHtml(todayAr())}</div>${licenseNo ? `<div><b>الرخصة:</b> ${licenseNo}</div>` : ''}${address ? `<div><b>العنوان:</b> ${address}</div>` : ''}${phone ? `<div><b>هاتف:</b> ${phone}</div>` : ''}${email ? `<div><b>بريد:</b> ${email}</div>` : ''}<div><b>النظام:</b> HELM Portal</div></div>
      </header>
      <h2 class="title">${safeTitle}</h2>
      <section class="body">${safeBody}</section>
      <section class="signatures">
        <div class="sig">توقيع الموظف<div class="line">الاسم والتوقيع</div></div>
        <div class="sig">الشؤون الإدارية / القانونية<div class="line">الاسم والتوقيع</div></div>
        <div class="sig">ختم الشركة<div class="line">الختم الرسمي</div></div>
      </section>
      <footer class="footer"><span>${footerNote}</span><span>وقت الإصدار: ${issuedAt}</span></footer>
    </section>
  </main>
</body>
</html>`
}

export function printBadayatDocument(title, renderedBody, printSettings = {}) {
  const html = buildBadayatPrintHtml(title, renderedBody, printSettings)
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=980,height=900')
  if (!printWindow) {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('title', 'Badayat print frame')
    iframe.style.position = 'fixed'
    iframe.style.left = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (!doc) return false
    doc.open(); doc.write(html); doc.close()
    const runPrint = () => {
      try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => iframe.remove(), 2000) }
      catch (error) { console.error('[Badayat Print] failed', error); iframe.remove() }
    }
    iframe.onload = () => setTimeout(runPrint, 400)
    setTimeout(runPrint, 1000)
    return true
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  setTimeout(() => {
    try { printWindow.focus(); printWindow.print() }
    catch (error) { console.error('[Badayat Print] failed', error) }
  }, 650)
  return true
}
