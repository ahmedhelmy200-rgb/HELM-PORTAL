export const BADAYAT_TEMPLATE_DRAFTS_KEY = 'helm_badayat_template_drafts_v1'
export const BADAYAT_PRINT_HEADER_KEY = 'helm_badayat_print_header_v1'

const todayAr = () => new Date().toLocaleDateString('ar-AE')

export const defaultBadayatPrintHeader = {
  companyName: 'شركة بداية الخير',
  companyNameEn: 'BADAYAT AL KHAIR',
  subtitle: 'إدارة شؤون الموظفين والعهد والنماذج الداخلية',
  logoUrl: '/icon-192.png',
  address: 'دبي - الإمارات العربية المتحدة',
  phone: '',
  email: '',
  licenseNo: '',
  footerNote: 'هذا المستند صادر إلكترونياً من نظام HELM Portal - قسم بداية الخير',
}

export const badayatTemplatePlaceholders = [
  'companyName', 'branchName', 'today',
  'fullName', 'nationality', 'emiratesId', 'passportNo', 'phone', 'email',
  'jobTitle', 'department', 'workLocation',
  'contractType', 'contractStart', 'contractEnd',
  'basicSalary', 'allowances', 'deductions', 'netSalary',
  'residencyStatus', 'residencyExpiry', 'workPermitExpiry', 'passportHeldVoluntarily',
  'rating', 'notes', 'amount', 'reason', 'assetDescription', 'leaveStart', 'leaveEnd'
]

export const defaultBadayatTemplateBodies = {
  'عقد عمل شامل': `عقد عمل

إنه في يوم {{today}} تم الاتفاق بين شركة بداية الخير / فرع {{branchName}} وبين السيد/ {{fullName}}، جنسيته {{nationality}}، يحمل هوية رقم {{emiratesId}} وجواز سفر رقم {{passportNo}}، على أن يعمل لدى الشركة بوظيفة {{jobTitle}} بقسم {{department}} في مقر العمل {{workLocation}}.

نوع العقد: {{contractType}}
تاريخ بداية العقد: {{contractStart}}
تاريخ نهاية العقد: {{contractEnd}}
الراتب الأساسي: {{basicSalary}} درهم
العلاوات: {{allowances}} درهم
الخصومات الحالية: {{deductions}} درهم
صافي المستحق الشهري الحالي: {{netSalary}} درهم

يلتزم الموظف بأداء العمل المكلف به بأمانة وحسن نية، وباتباع تعليمات الإدارة، والمحافظة على أموال ومستندات وممتلكات الشركة، والالتزام بسياسات السرية وعدم الإفصاح ومواعيد العمل واللوائح الداخلية المعتمدة.

توقيع الموظف: ............................
توقيع الشركة: ............................`,

  'عرض عمل': `عرض عمل

السيد/ {{fullName}}
تحية طيبة وبعد،،،

يسر شركة بداية الخير / فرع {{branchName}} أن تعرض عليكم العمل بوظيفة {{jobTitle}} ضمن قسم {{department}}، بمقر العمل {{workLocation}}، وفق البيانات الآتية:

نوع العقد: {{contractType}}
تاريخ الالتحاق المقترح: {{contractStart}}
الراتب الأساسي: {{basicSalary}} درهم
العلاوات: {{allowances}} درهم

يعد هذا العرض مبدئياً ويخضع لاستكمال المستندات والإجراءات الإدارية والقانونية اللازمة.

توقيع بالموافقة: ............................`,

  'تعديل مسمى وظيفي': `قرار تعديل مسمى وظيفي

بتاريخ {{today}} تقرر تعديل المسمى الوظيفي للسيد/ {{fullName}}، هوية رقم {{emiratesId}}، من/إلى المسمى الوظيفي التالي: {{jobTitle}}، وذلك داخل فرع {{branchName}} وقسم {{department}}.

ويعمل بهذا القرار من تاريخه، مع استمرار باقي شروط عقد العمل كما هي ما لم يصدر تعديل كتابي آخر.

توقيع الموظف بالعلم: ............................`,

  'ترقية وظيفية': `قرار ترقية وظيفية

تقرر ترقية السيد/ {{fullName}}، العامل لدى فرع {{branchName}}، إلى وظيفة {{jobTitle}} بقسم {{department}}، وذلك تقديراً لمستوى الأداء والتقييم الحالي {{rating}}%.

تسري الترقية اعتباراً من تاريخ {{today}}، وتلتزم الإدارة المختصة بتحديث بيانات الموظف وملفه الوظيفي.

توقيع الموظف بالعلم: ............................`,

  'إقرار مباشرة عمل': `إقرار مباشرة عمل

أقر أنا/ {{fullName}}، جنسيتي {{nationality}}، هوية رقم {{emiratesId}}، بأنني باشرت العمل لدى شركة بداية الخير / فرع {{branchName}} بوظيفة {{jobTitle}} اعتباراً من تاريخ {{contractStart}}، وأن بيانات التواصل الخاصة بي هي: {{phone}} - {{email}}.

وهذا إقرار مني بذلك.

المقر بما فيه: ............................`,

  'إنذار أول': `إنذار أول

السيد/ {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}

نحيطكم علماً بأنه بتاريخ {{today}} تم توجيه هذا الإنذار بسبب: {{reason}}

وعليه نلفت نظركم إلى ضرورة عدم تكرار المخالفة والالتزام بتعليمات الإدارة واللوائح الداخلية للشركة، وفي حال التكرار سيتم اتخاذ الإجراءات الإدارية والقانونية المقررة.

توقيع الموظف بالاستلام والعلم: ............................`,

  'إنذار نهائي': `إنذار نهائي

السيد/ {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}

بالإشارة إلى المخالفة المنسوبة إليكم وسببها: {{reason}}، وبالنظر إلى ما سبق من تنبيهات أو جزاءات إن وجدت، فقد تقرر توجيه إنذار نهائي لكم.

ويعد هذا الإنذار آخر تنبيه قبل اتخاذ أي إجراء إداري أو قانوني أشد وفقاً للوائح الشركة والقانون المعمول به.

توقيع الموظف بالاستلام والعلم: ............................`,

  'نموذج تحقيق إداري': `محضر تحقيق إداري

اليوم والتاريخ: {{today}}
الموظف: {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}
رقم الهوية: {{emiratesId}}

موضوع التحقيق: {{reason}}

سؤال: ما قولك فيما هو منسوب إليك؟
الإجابة: ........................................................................

سؤال: هل لديك مستندات أو شهود؟
الإجابة: ........................................................................

أقوال المحقق/التوصية:
........................................................................

توقيع الموظف: ............................
توقيع المحقق: ............................`,

  'نموذج خصم بسبب غياب': `قرار خصم بسبب غياب

السيد/ {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}

نظراً لغيابكم/مخالفتكم بتاريخ {{today}} بسبب: {{reason}}، فقد تقرر تطبيق خصم قدره {{amount}} درهم من مستحقاتكم، مع حفظ حق الشركة في اتخاذ ما يلزم حال التكرار.

توقيع الموظف بالعلم: ............................`,

  'نموذج خصم بسبب جزاء': `قرار خصم بسبب جزاء إداري

السيد/ {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}

بناءً على المخالفة الثابتة/المنسوبة إليكم بشأن: {{reason}}، فقد تقرر توقيع جزاء خصم قدره {{amount}} درهم، ويتم تسجيله في ملفكم الوظيفي.

توقيع الموظف بالعلم: ............................`,

  'نموذج فصل': `إخطار بإنهاء خدمة / فصل

السيد/ {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}

نفيدكم بأنه تقرر إنهاء خدمتكم/فصلكم من العمل لدى شركة بداية الخير اعتباراً من تاريخ {{today}}، وذلك للأسباب الآتية: {{reason}}

ويتم تسليم ما بعهدتكم وإجراء المخالصة وفق الإجراءات المتبعة والقانون المعمول به.

توقيع الموظف بالاستلام: ............................`,

  'إخطار مخالفة': `إخطار مخالفة

السيد/ {{fullName}}

نخطركم بوجود مخالفة إدارية منسوبة إليكم بتاريخ {{today}} وبيانها: {{reason}}

يرجى تقديم ردكم أو ملاحظاتكم كتابة خلال المدة المحددة من الإدارة، وإلا سيتم اتخاذ الإجراء المناسب وفق اللوائح الداخلية.

توقيع الموظف بالاستلام: ............................`,

  'إقرار استلام مبلغ': `إقرار استلام مبلغ

أقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، بأنني استلمت من شركة بداية الخير / فرع {{branchName}} مبلغاً وقدره {{amount}} درهم، وذلك عن/بسبب: {{reason}}.

وهذا إقرار مني بالاستلام الفعلي دون أي تحفظ.

التاريخ: {{today}}
توقيع المستلم: ............................`,

  'إقرار استلام عهدة': `إقرار استلام عهدة

أقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، العامل بوظيفة {{jobTitle}} لدى فرع {{branchName}}، بأنني استلمت العهدة التالية:

{{assetDescription}}

وأتعهد بالمحافظة عليها واستعمالها في أغراض العمل فقط وردها فور طلب الشركة أو عند انتهاء العلاقة العمالية، وأتحمل المسؤولية عن أي تلف أو فقد ناشئ عن الإهمال أو سوء الاستعمال.

توقيع الموظف: ............................`,

  'استلام وتسليم عهدة': `محضر استلام وتسليم عهدة

بتاريخ {{today}} تم استلام/تسليم العهدة التالية الخاصة بالموظف/ {{fullName}}، وظيفته {{jobTitle}}، فرع {{branchName}}:

{{assetDescription}}

حالة العهدة وقت التسليم/الاستلام:
........................................................................

توقيع المسلم: ............................
توقيع المستلم: ............................`,

  'تسليم جواز السفر للشركة طواعية بدلاً من سداد ضمان العهدة': `إقرار تسليم جواز السفر طواعية

أقر أنا/ {{fullName}}، جنسيتي {{nationality}}، أحمل جواز سفر رقم {{passportNo}} وهوية رقم {{emiratesId}}، بأنني سلمت جواز سفري إلى شركة بداية الخير / فرع {{branchName}} طواعية وبمحض إرادتي، وذلك كضمان إداري مؤقت مرتبط بالعهدة/المستندات/الأموال المسلمة إليّ بدلاً من سداد ضمان نقدي.

وأقر بأن هذا التسليم تم بناءً على طلبي وموافقتي، وأن لي الحق في طلب استرداد الجواز متى زال سبب الاحتفاظ به أو عند تسليم العهدة أو تسوية الالتزامات، وفق الإجراءات القانونية والإدارية المتبعة.

توقيع الموظف: ............................
توقيع مستلم الجواز: ............................`,

  'إقرار إرجاع عهدة': `إقرار إرجاع عهدة

أقر أنا/ {{fullName}} بأنني قمت بإرجاع العهدة التالية إلى شركة بداية الخير / فرع {{branchName}}:

{{assetDescription}}

وتمت معاينتها بمعرفة المختص، وذلك بتاريخ {{today}}.

توقيع الموظف: ............................
توقيع المستلم: ............................`,

  'طلب إجازة': `طلب إجازة

السيد/ إدارة شركة بداية الخير

أتقدم أنا/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}، بطلب إجازة من تاريخ {{leaveStart}} إلى تاريخ {{leaveEnd}}، وذلك بسبب: {{reason}}

وأتعهد بالعودة إلى العمل في الموعد المحدد وتسليم أي أعمال أو عهد قبل الإجازة إذا طلبت الإدارة ذلك.

توقيع الموظف: ............................`,

  'نموذج موافقة إجازة': `موافقة إجازة

توافق إدارة شركة بداية الخير / فرع {{branchName}} على منح السيد/ {{fullName}}، وظيفة {{jobTitle}}، إجازة من تاريخ {{leaveStart}} إلى تاريخ {{leaveEnd}}، وذلك وفقاً لرصيد الإجازات والإجراءات الداخلية.

توقيع الإدارة: ............................`,

  'إقرار استلام مستحقات نهاية الخدمة': `إقرار استلام مستحقات نهاية الخدمة

أقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، بأنني استلمت من شركة بداية الخير / فرع {{branchName}} كافة مستحقاتي المتعلقة بانتهاء علاقة العمل حتى تاريخ {{today}}، وذلك بمبلغ إجمالي قدره {{amount}} درهم، ويشمل ما تم الاتفاق عليه وتسويته من رواتب أو بدلات أو إجازات أو أي مبالغ أخرى.

وأقر بأن الاستلام تم برضاي وبعد المراجعة، دون إخلال بأي حقوق مقررة قانوناً لا يجوز التنازل عنها.

توقيع الموظف: ............................`,

  'نموذج استقالة': `استقالة

السادة/ شركة بداية الخير

أتقدم أنا/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}، باستقالتي من العمل، على أن يكون آخر يوم عمل بتاريخ: {{contractEnd}}، وذلك للأسباب الآتية: {{reason}}

وأتعهد بتسليم ما بعهدتي وإنهاء إجراءات المخالصة وفق النظام المعمول به.

توقيع الموظف: ............................`,

  'نموذج سلفة': `طلب / إقرار سلفة

أقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، بأنني طلبت/استلمت سلفة من شركة بداية الخير / فرع {{branchName}} بمبلغ {{amount}} درهم، وأوافق على خصمها من راتبي أو مستحقاتي وفق ما تقرره الإدارة.

سبب السلفة: {{reason}}

توقيع الموظف: ............................`,

  'نموذج تعهد بعدم التكرار': `تعهد بعدم التكرار

أتعهد أنا/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}، بعدم تكرار المخالفة الآتية: {{reason}}

وأقر بأنني علمت بأن تكرار المخالفة يترتب عليه اتخاذ الإجراءات الإدارية والقانونية المقررة وفق لوائح الشركة والقانون.

توقيع الموظف: ............................`,

  'نموذج تنبيه وتوجيه': `تنبيه وتوجيه إداري

السيد/ {{fullName}}
الوظيفة: {{jobTitle}}
الفرع: {{branchName}}

تنبهكم الإدارة إلى الآتي: {{reason}}

ويعد هذا التنبيه توجيهاً إدارياً لتحسين الأداء والالتزام بمقتضيات العمل.

توقيع الموظف بالعلم: ............................`,

  'لائحة داخلية للعقوبات والخصومات': `إقرار بالاطلاع على لائحة العقوبات والخصومات

أقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، العامل لدى شركة بداية الخير / فرع {{branchName}} بوظيفة {{jobTitle}}، بأنني اطلعت على لائحة الشركة الداخلية الخاصة بالمخالفات والعقوبات والخصومات، وفهمت مضمونها والتزمت بها.

وأقر بأن مخالفات التأخير والغياب والإهمال وسوء استعمال العهدة ومخالفة تعليمات الإدارة أو إفشاء أسرار العمل قد يترتب عليها إجراءات إدارية ومالية وفق اللائحة والقانون.

توقيع الموظف: ............................`,

  'إقرار اطلاع الموظف على موانع ومحظورات وسياسة الشركة': `إقرار اطلاع على موانع ومحظورات وسياسة الشركة

أقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، بأنني اطلعت على سياسات شركة بداية الخير ولوائحها الداخلية، بما في ذلك موانع ومحظورات العمل، قواعد السرية، المحافظة على العهد، الالتزام بساعات العمل، التعامل مع العملاء، وعدم استعمال ممتلكات الشركة في غير الغرض المخصص لها.

وأتعهد بالالتزام الكامل بهذه السياسات، وأتحمل المسؤولية عن أي مخالفة تثبت بحقي وفق الإجراءات المعمول بها.

توقيع الموظف: ............................`,
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[ch]))
}

export function loadBadayatTemplateDrafts() {
  try {
    return JSON.parse(localStorage.getItem(BADAYAT_TEMPLATE_DRAFTS_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

export function saveBadayatTemplateDraft(templateName, body) {
  const drafts = loadBadayatTemplateDrafts()
  const next = { ...drafts, [templateName]: body }
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
  try {
    const saved = JSON.parse(localStorage.getItem(BADAYAT_PRINT_HEADER_KEY) || '{}') || {}
    return { ...defaultBadayatPrintHeader, ...saved }
  } catch {
    return defaultBadayatPrintHeader
  }
}

export function saveBadayatPrintHeader(settings = {}) {
  const next = { ...loadBadayatPrintHeader(), ...settings }
  localStorage.setItem(BADAYAT_PRINT_HEADER_KEY, JSON.stringify(next))
  return next
}

export function getEmployeeTemplateValues(employee = {}, branchName = 'بداية الخير') {
  const basicSalary = Number(employee.basicSalary || 0)
  const allowances = Number(employee.allowances || 0)
  const deductions = Number(employee.deductions || 0)
  return {
    companyName: 'شركة بداية الخير',
    branchName,
    today: todayAr(),
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

export function printBadayatDocument(title, renderedBody, printSettings = {}) {
  const win = window.open('', '_blank', 'width=960,height=1100')
  if (!win) return false

  const settings = { ...loadBadayatPrintHeader(), ...printSettings }
  const safeTitle = escapeHtml(title || 'مستند بداية الخير')
  const safeBody = escapeHtml(renderedBody || '')
  const safeLogoUrl = escapeHtml(settings.logoUrl || defaultBadayatPrintHeader.logoUrl)
  const safeCompanyName = escapeHtml(settings.companyName || defaultBadayatPrintHeader.companyName)
  const safeCompanyNameEn = escapeHtml(settings.companyNameEn || defaultBadayatPrintHeader.companyNameEn)
  const safeSubtitle = escapeHtml(settings.subtitle || defaultBadayatPrintHeader.subtitle)
  const safeAddress = escapeHtml(settings.address || '')
  const safePhone = escapeHtml(settings.phone || '')
  const safeEmail = escapeHtml(settings.email || '')
  const safeLicenseNo = escapeHtml(settings.licenseNo || '')
  const safeFooterNote = escapeHtml(settings.footerNote || defaultBadayatPrintHeader.footerNote)
  const issuedAt = escapeHtml(new Date().toLocaleString('ar-AE'))

  win.document.write(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    @page { size: A4; margin: 14mm 13mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef1f5;
      color: #111827;
      font-family: Arial, Tahoma, 'Segoe UI', sans-serif;
      direction: rtl;
      text-align: right;
      line-height: 1.9;
    }
    .print-actions {
      max-width: 900px;
      margin: 16px auto 10px;
      display: flex;
      gap: 10px;
      justify-content: flex-start;
    }
    .print-actions button {
      border: 0;
      border-radius: 12px;
      padding: 10px 18px;
      font-weight: 800;
      cursor: pointer;
      background: #111827;
      color: #fff;
    }
    .paper {
      width: 210mm;
      min-height: 297mm;
      max-width: 900px;
      margin: 0 auto 24px;
      background: #fff;
      padding: 22mm 18mm 18mm;
      position: relative;
      box-shadow: 0 20px 48px rgba(15, 23, 42, .18);
      overflow: hidden;
    }
    .paper::before {
      content: '';
      position: absolute;
      inset-inline-start: 0;
      top: 0;
      width: 100%;
      height: 7px;
      background: linear-gradient(90deg, #111827, #b45309, #111827);
    }
    .letterhead {
      display: grid;
      grid-template-columns: 95px 1fr 170px;
      align-items: center;
      gap: 18px;
      border-bottom: 2px solid #111827;
      padding-bottom: 15px;
      margin-bottom: 20px;
      position: relative;
    }
    .letterhead::after {
      content: '';
      position: absolute;
      bottom: -5px;
      right: 0;
      width: 38%;
      height: 3px;
      background: #b45309;
    }
    .logo-box {
      width: 86px;
      height: 86px;
      border: 1.5px solid #111827;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: #fff;
    }
    .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .brand h1 { margin: 0; font-size: 25px; font-weight: 900; letter-spacing: -.5px; }
    .brand .en { margin-top: 2px; font-size: 13px; letter-spacing: 2.5px; color: #92400e; font-weight: 900; direction: ltr; text-align: right; }
    .brand .sub { margin-top: 5px; color: #4b5563; font-size: 12.5px; font-weight: 700; }
    .meta {
      border: 1px solid #d1d5db;
      border-radius: 16px;
      padding: 10px 12px;
      font-size: 11.5px;
      color: #374151;
      line-height: 1.7;
      background: #f9fafb;
    }
    .doc-title {
      text-align: center;
      margin: 22px auto 20px;
      font-size: 25px;
      font-weight: 900;
      color: #111827;
      width: fit-content;
      min-width: 220px;
      border: 2px solid #111827;
      border-radius: 18px;
      padding: 8px 28px;
      background: linear-gradient(180deg, #fff, #f8fafc);
    }
    .body {
      white-space: pre-wrap;
      font-size: 16px;
      color: #111827;
      min-height: 520px;
      padding: 4px 2px;
    }
    .watermark {
      position: absolute;
      top: 47%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-28deg);
      font-size: 64px;
      font-weight: 900;
      color: rgba(180, 83, 9, .055);
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
    }
    .body, .letterhead, .doc-title, .signatures, .footer { position: relative; z-index: 1; }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      margin-top: 46px;
      page-break-inside: avoid;
    }
    .sig {
      min-height: 92px;
      border: 1.5px solid #111827;
      border-radius: 16px;
      padding: 12px;
      text-align: center;
      font-weight: 800;
    }
    .sig .line { margin-top: 35px; border-top: 1px solid #111827; padding-top: 6px; color: #374151; font-size: 12px; }
    .footer {
      margin-top: 28px;
      border-top: 1px solid #d1d5db;
      padding-top: 9px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: #6b7280;
      font-size: 11px;
    }
    @media print {
      body { background: #fff; }
      .print-actions { display: none; }
      .paper { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
      .paper::before { top: -14mm; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button onclick="window.print()">طباعة النموذج</button>
    <button onclick="window.close()">إغلاق</button>
  </div>
  <main class="paper">
    <div class="watermark">${safeCompanyName}</div>
    <header class="letterhead">
      <div class="logo-box"><img src="${safeLogoUrl}" alt="${safeCompanyName}" onerror="this.style.display='none'" /></div>
      <div class="brand">
        <h1>${safeCompanyName}</h1>
        <div class="en">${safeCompanyNameEn}</div>
        <div class="sub">${safeSubtitle}</div>
      </div>
      <div class="meta">
        <div><b>التاريخ:</b> ${escapeHtml(todayAr())}</div>
        ${safeLicenseNo ? `<div><b>الرخصة:</b> ${safeLicenseNo}</div>` : ''}
        ${safeAddress ? `<div><b>العنوان:</b> ${safeAddress}</div>` : ''}
        ${safePhone ? `<div><b>هاتف:</b> ${safePhone}</div>` : ''}
        ${safeEmail ? `<div><b>بريد:</b> ${safeEmail}</div>` : ''}
      </div>
    </header>

    <h2 class="doc-title">${safeTitle}</h2>
    <section class="body">${safeBody}</section>

    <section class="signatures">
      <div class="sig">توقيع الموظف<div class="line">الاسم والتوقيع</div></div>
      <div class="sig">الشؤون الإدارية / القانونية<div class="line">الاسم والتوقيع</div></div>
      <div class="sig">ختم الشركة<div class="line">الختم الرسمي</div></div>
    </section>

    <footer class="footer">
      <span>${safeFooterNote}</span>
      <span>وقت الإصدار: ${issuedAt}</span>
    </footer>
  </main>
</body>
</html>`)
  win.document.close()
  win.focus()
  return true
}
