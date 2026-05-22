export const BADAYAT_TEMPLATE_DRAFTS_KEY = 'helm_badayat_template_drafts_v1'
export const BADAYAT_PRINT_HEADER_KEY = 'helm_badayat_print_header_v1'

const todayAr = () => new Date().toLocaleDateString('ar-AE')

export const defaultBadayatPrintHeader = {
  companyName: 'شركة بداية الخير',
  companyNameEn: 'BADAYAT AL KHAIR',
  subtitle: 'إدارة شؤون الموظفين والعهد والنماذج الداخلية',
  logoUrl: '/badayat-logo.svg',
  address: 'دبي - الإمارات العربية المتحدة',
  phone: '',
  email: '',
  licenseNo: '',
  footerNote: 'هذا المستند صادر إلكترونياً من نظام HELM Portal - قسم بداية الخير',
}

export const badayatTemplatePlaceholders = [
  'companyName', 'branchName', 'today', 'fullName', 'nationality', 'emiratesId', 'passportNo', 'phone', 'email',
  'jobTitle', 'department', 'workLocation', 'contractType', 'contractStart', 'contractEnd', 'basicSalary', 'allowances',
  'deductions', 'netSalary', 'residencyStatus', 'residencyExpiry', 'workPermitExpiry', 'passportHeldVoluntarily', 'rating',
  'notes', 'amount', 'reason', 'assetDescription', 'leaveStart', 'leaveEnd'
]

export const defaultBadayatTemplateBodies = {
  'عقد عمل شامل': `عقد عمل\n\nإنه في يوم {{today}} تم الاتفاق بين شركة بداية الخير / فرع {{branchName}} وبين السيد/ {{fullName}}، جنسيته {{nationality}}، يحمل هوية رقم {{emiratesId}} وجواز سفر رقم {{passportNo}}، على أن يعمل لدى الشركة بوظيفة {{jobTitle}} بقسم {{department}} في مقر العمل {{workLocation}}.\n\nنوع العقد: {{contractType}}\nتاريخ بداية العقد: {{contractStart}}\nتاريخ نهاية العقد: {{contractEnd}}\nالراتب الأساسي: {{basicSalary}} درهم\nالعلاوات: {{allowances}} درهم\nالخصومات الحالية: {{deductions}} درهم\nصافي المستحق الشهري الحالي: {{netSalary}} درهم\n\nيلتزم الموظف بأداء العمل المكلف به بأمانة وحسن نية، وباتباع تعليمات الإدارة، والمحافظة على أموال ومستندات وممتلكات الشركة، والالتزام بسياسات السرية وعدم الإفصاح ومواعيد العمل واللوائح الداخلية المعتمدة.`,
  'عرض عمل': `عرض عمل\n\nالسيد/ {{fullName}}\n\nيسر شركة بداية الخير / فرع {{branchName}} أن تعرض عليكم العمل بوظيفة {{jobTitle}} ضمن قسم {{department}}، بمقر العمل {{workLocation}}، براتب أساسي {{basicSalary}} درهم وعلاوات {{allowances}} درهم، وذلك اعتباراً من تاريخ {{contractStart}}، ويخضع العرض لاستكمال المستندات والإجراءات الإدارية والقانونية اللازمة.`,
  'تعديل مسمى وظيفي': `قرار تعديل مسمى وظيفي\n\nبتاريخ {{today}} تقرر تعديل المسمى الوظيفي للسيد/ {{fullName}}، هوية رقم {{emiratesId}}، إلى المسمى الوظيفي: {{jobTitle}}، وذلك داخل فرع {{branchName}} وقسم {{department}}، مع استمرار باقي شروط العلاقة العمالية كما هي ما لم يصدر تعديل كتابي آخر.`,
  'ترقية وظيفية': `قرار ترقية وظيفية\n\nتقرر ترقية السيد/ {{fullName}}، العامل لدى فرع {{branchName}}، إلى وظيفة {{jobTitle}} بقسم {{department}}، وذلك تقديراً لمستوى الأداء والتقييم الحالي {{rating}}%، وتسرى الترقية اعتباراً من تاريخ {{today}}.`,
  'إقرار مباشرة عمل': `إقرار مباشرة عمل\n\nأقر أنا/ {{fullName}}، جنسيتي {{nationality}}، هوية رقم {{emiratesId}}، بأنني باشرت العمل لدى شركة بداية الخير / فرع {{branchName}} بوظيفة {{jobTitle}} اعتباراً من تاريخ {{contractStart}}، وأن بيانات التواصل الخاصة بي هي: {{phone}} - {{email}}.`,
  'إنذار أول': `إنذار أول\n\nالسيد/ {{fullName}}\nالوظيفة: {{jobTitle}}\nالفرع: {{branchName}}\n\nنحيطكم علماً بأنه بتاريخ {{today}} تم توجيه هذا الإنذار بسبب: {{reason}}\n\nوعليه نلفت نظركم إلى ضرورة عدم تكرار المخالفة والالتزام بتعليمات الإدارة واللوائح الداخلية للشركة.`,
  'إنذار نهائي': `إنذار نهائي\n\nالسيد/ {{fullName}}\nالوظيفة: {{jobTitle}}\nالفرع: {{branchName}}\n\nبالإشارة إلى المخالفة المنسوبة إليكم وسببها: {{reason}}، فقد تقرر توجيه إنذار نهائي لكم، ويعد هذا الإنذار آخر تنبيه قبل اتخاذ الإجراءات الإدارية أو القانونية الأشد.`,
  'نموذج تحقيق إداري': `محضر تحقيق إداري\n\nاليوم والتاريخ: {{today}}\nالموظف: {{fullName}}\nالوظيفة: {{jobTitle}}\nالفرع: {{branchName}}\nرقم الهوية: {{emiratesId}}\n\nموضوع التحقيق: {{reason}}\n\nسؤال: ما قولك فيما هو منسوب إليك؟\nالإجابة: ........................................................................\n\nأقوال المحقق/التوصية:\n........................................................................`,
  'نموذج خصم بسبب غياب': `قرار خصم بسبب غياب\n\nالسيد/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}.\n\nنظراً لغيابكم/مخالفتكم بتاريخ {{today}} بسبب: {{reason}}، فقد تقرر تطبيق خصم قدره {{amount}} درهم من مستحقاتكم.`,
  'نموذج خصم بسبب جزاء': `قرار خصم بسبب جزاء إداري\n\nالسيد/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}.\n\nبناءً على المخالفة المنسوبة إليكم بشأن: {{reason}}، فقد تقرر توقيع جزاء خصم قدره {{amount}} درهم، ويتم تسجيله في ملفكم الوظيفي.`,
  'نموذج فصل': `إخطار بإنهاء خدمة / فصل\n\nالسيد/ {{fullName}}\nالوظيفة: {{jobTitle}}\nالفرع: {{branchName}}\n\nنفيدكم بأنه تقرر إنهاء خدمتكم/فصلكم من العمل لدى شركة بداية الخير اعتباراً من تاريخ {{today}}، وذلك للأسباب الآتية: {{reason}}، على أن يتم تسليم ما بعهدتكم وإجراء المخالصة وفق الإجراءات المتبعة.`,
  'إخطار مخالفة': `إخطار مخالفة\n\nالسيد/ {{fullName}}\n\nنخطركم بوجود مخالفة إدارية منسوبة إليكم بتاريخ {{today}} وبيانها: {{reason}}، ويرجى تقديم ردكم كتابة خلال المدة المحددة من الإدارة.`,
  'إقرار استلام مبلغ': `إقرار استلام مبلغ\n\nأقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، بأنني استلمت من شركة بداية الخير / فرع {{branchName}} مبلغاً وقدره {{amount}} درهم، وذلك عن/بسبب: {{reason}}، وهذا إقرار مني بالاستلام الفعلي دون تحفظ.`,
  'إقرار استلام عهدة': `إقرار استلام عهدة\n\nأقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، العامل بوظيفة {{jobTitle}} لدى فرع {{branchName}}، بأنني استلمت العهدة التالية:\n\n{{assetDescription}}\n\nوأتعهد بالمحافظة عليها واستعمالها في أغراض العمل فقط وردها فور طلب الشركة أو عند انتهاء العلاقة العمالية.`,
  'استلام وتسليم عهدة': `محضر استلام وتسليم عهدة\n\nبتاريخ {{today}} تم استلام/تسليم العهدة التالية الخاصة بالموظف/ {{fullName}}، وظيفته {{jobTitle}}، فرع {{branchName}}:\n\n{{assetDescription}}\n\nحالة العهدة وقت التسليم/الاستلام:\n........................................................................`,
  'تسليم جواز السفر للشركة طواعية بدلاً من سداد ضمان العهدة': `إقرار تسليم جواز السفر طواعية\n\nأقر أنا/ {{fullName}}، جنسيتي {{nationality}}، أحمل جواز سفر رقم {{passportNo}} وهوية رقم {{emiratesId}}، بأنني سلمت جواز سفري إلى شركة بداية الخير / فرع {{branchName}} طواعية وبمحض إرادتي، وذلك كضمان إداري مؤقت مرتبط بالعهدة/المستندات/الأموال المسلمة إليّ بدلاً من سداد ضمان نقدي.`,
  'إقرار إرجاع عهدة': `إقرار إرجاع عهدة\n\nأقر أنا/ {{fullName}} بأنني قمت بإرجاع العهدة التالية إلى شركة بداية الخير / فرع {{branchName}}:\n\n{{assetDescription}}\n\nوتمت معاينتها بمعرفة المختص بتاريخ {{today}}.`,
  'طلب إجازة': `طلب إجازة\n\nأتقدم أنا/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}، بطلب إجازة من تاريخ {{leaveStart}} إلى تاريخ {{leaveEnd}}، وذلك بسبب: {{reason}}، وأتعهد بالعودة إلى العمل في الموعد المحدد.`,
  'نموذج موافقة إجازة': `موافقة إجازة\n\nتوافق إدارة شركة بداية الخير / فرع {{branchName}} على منح السيد/ {{fullName}}، وظيفة {{jobTitle}}، إجازة من تاريخ {{leaveStart}} إلى تاريخ {{leaveEnd}}، وذلك وفقاً لرصيد الإجازات والإجراءات الداخلية.`,
  'إقرار استلام مستحقات نهاية الخدمة': `إقرار استلام مستحقات نهاية الخدمة\n\nأقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، بأنني استلمت من شركة بداية الخير / فرع {{branchName}} كافة مستحقاتي المتعلقة بانتهاء علاقة العمل حتى تاريخ {{today}}، وذلك بمبلغ إجمالي قدره {{amount}} درهم.`,
  'نموذج استقالة': `استقالة\n\nالسادة/ شركة بداية الخير\n\nأتقدم أنا/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}، باستقالتي من العمل، على أن يكون آخر يوم عمل بتاريخ: {{contractEnd}}، وذلك للأسباب الآتية: {{reason}}.`,
  'نموذج سلفة': `طلب / إقرار سلفة\n\nأقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، بأنني طلبت/استلمت سلفة من شركة بداية الخير / فرع {{branchName}} بمبلغ {{amount}} درهم، وأوافق على خصمها من راتبي أو مستحقاتي.\n\nسبب السلفة: {{reason}}`,
  'نموذج تعهد بعدم التكرار': `تعهد بعدم التكرار\n\nأتعهد أنا/ {{fullName}}، وظيفة {{jobTitle}}، فرع {{branchName}}، بعدم تكرار المخالفة الآتية: {{reason}}، وأقر بأنني علمت بما قد يترتب على التكرار من إجراءات.`,
  'نموذج تنبيه وتوجيه': `تنبيه وتوجيه إداري\n\nالسيد/ {{fullName}}\nالوظيفة: {{jobTitle}}\nالفرع: {{branchName}}\n\nتنبهكم الإدارة إلى الآتي: {{reason}}\n\nويعد هذا التنبيه توجيهاً إدارياً لتحسين الأداء والالتزام بمقتضيات العمل.`,
  'لائحة داخلية للعقوبات والخصومات': `إقرار بالاطلاع على لائحة العقوبات والخصومات\n\nأقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، العامل لدى شركة بداية الخير / فرع {{branchName}} بوظيفة {{jobTitle}}، بأنني اطلعت على لائحة الشركة الداخلية الخاصة بالمخالفات والعقوبات والخصومات، وفهمت مضمونها والتزمت بها.`,
  'إقرار اطلاع الموظف على موانع ومحظورات وسياسة الشركة': `إقرار اطلاع على موانع ومحظورات وسياسة الشركة\n\nأقر أنا/ {{fullName}}، هوية رقم {{emiratesId}}، بأنني اطلعت على سياسات شركة بداية الخير ولوائحها الداخلية، بما في ذلك موانع ومحظورات العمل، قواعد السرية، المحافظة على العهد، الالتزام بساعات العمل، التعامل مع العملاء، وعدم استعمال ممتلكات الشركة في غير الغرض المخصص لها.`,
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
  return { ...defaultBadayatPrintHeader, ...readJson(BADAYAT_PRINT_HEADER_KEY, {}) }
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
    companyName: 'شركة بداية الخير', branchName, today: todayAr(),
    fullName: employee.fullName || '................', nationality: employee.nationality || '................',
    emiratesId: employee.emiratesId || '................', passportNo: employee.passportNo || '................',
    phone: employee.phone || '................', email: employee.email || '................',
    jobTitle: employee.jobTitle || '................', department: employee.department || '................',
    workLocation: employee.workLocation || '................', contractType: employee.contractType || '................',
    contractStart: employee.contractStart || '................', contractEnd: employee.contractEnd || '................',
    basicSalary: basicSalary.toLocaleString('ar-AE'), allowances: allowances.toLocaleString('ar-AE'), deductions: deductions.toLocaleString('ar-AE'),
    netSalary: (basicSalary + allowances - deductions).toLocaleString('ar-AE'),
    residencyStatus: employee.residencyStatus || '................', residencyExpiry: employee.residencyExpiry || '................',
    workPermitExpiry: employee.workPermitExpiry || '................', passportHeldVoluntarily: employee.passportHeldVoluntarily || 'لا',
    rating: employee.rating || '0', notes: employee.notes || '', amount: '................', reason: '................',
    assetDescription: '................', leaveStart: '................', leaveEnd: '................',
  }
}

export function renderBadayatTemplate(body, employee, branchName) {
  const values = getEmployeeTemplateValues(employee, branchName)
  return String(body || '').replace(/{{\s*([\w]+)\s*}}/g, (_, key) => values[key] ?? `{{${key}}}`)
}

function buildBadayatPrintHtml(title, renderedBody, printSettings = {}) {
  const settings = { ...loadBadayatPrintHeader(), ...printSettings }
  const safeTitle = escapeHtml(title || 'مستند بداية الخير')
  const safeBody = escapeHtml(renderedBody || '')
  const company = escapeHtml(settings.companyName || defaultBadayatPrintHeader.companyName)
  const companyEn = escapeHtml(settings.companyNameEn || defaultBadayatPrintHeader.companyNameEn)
  const logoUrl = escapeHtml(settings.logoUrl || defaultBadayatPrintHeader.logoUrl)
  const subtitle = escapeHtml(settings.subtitle || defaultBadayatPrintHeader.subtitle)
  const address = escapeHtml(settings.address || '')
  const phone = escapeHtml(settings.phone || '')
  const email = escapeHtml(settings.email || '')
  const licenseNo = escapeHtml(settings.licenseNo || '')
  const footerNote = escapeHtml(settings.footerNote || defaultBadayatPrintHeader.footerNote)
  const issuedAt = escapeHtml(new Date().toLocaleString('ar-AE'))

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${safeTitle}</title><style>
@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#f1f5f9;color:#111827;font-family:Arial,Tahoma,'Segoe UI',sans-serif;direction:rtl;text-align:right}.screen-actions{max-width:210mm;margin:12px auto;display:flex;gap:8px}.screen-actions button{border:0;border-radius:12px;padding:10px 18px;font-weight:900;cursor:pointer;background:#111827;color:white}.page{width:210mm;min-height:297mm;margin:0 auto 18px;background:white;position:relative;padding:13mm;overflow:hidden}.outer-frame{position:absolute;inset:7mm;border:3px solid #111827;border-radius:16px;pointer-events:none}.inner-frame{position:absolute;inset:10mm;border:1.4px solid #b45309;border-radius:12px;pointer-events:none}.corner{position:absolute;width:28mm;height:28mm;border-color:#b45309;pointer-events:none}.c1{top:10mm;right:10mm;border-top:5px solid;border-right:5px solid;border-radius:0 12px 0 0}.c2{top:10mm;left:10mm;border-top:5px solid;border-left:5px solid;border-radius:12px 0 0 0}.c3{bottom:10mm;right:10mm;border-bottom:5px solid;border-right:5px solid;border-radius:0 0 12px 0}.c4{bottom:10mm;left:10mm;border-bottom:5px solid;border-left:5px solid;border-radius:0 0 0 12px}.content{position:relative;z-index:1;padding:7mm 7mm 5mm}.head{display:grid;grid-template-columns:32mm 1fr 48mm;gap:7mm;align-items:center;border-bottom:2px solid #111827;padding-bottom:5mm}.logo{width:30mm;height:30mm;border:1.5px solid #111827;border-radius:14px;padding:3mm;background:white;object-fit:contain}.brand h1{margin:0;font-size:25px;font-weight:900}.brand .en{margin-top:1mm;font-size:12px;letter-spacing:2.6px;font-weight:900;color:#92400e;direction:ltr;text-align:right}.brand .sub{margin-top:2mm;font-size:12px;color:#4b5563;font-weight:700}.meta{border:1px solid #d1d5db;background:#f9fafb;border-radius:12px;padding:3mm;font-size:10.5px;line-height:1.7;color:#374151}.title{width:fit-content;min-width:70mm;margin:8mm auto 7mm;text-align:center;border:2px solid #111827;border-radius:14px;padding:2mm 10mm;font-size:22px;font-weight:900;background:linear-gradient(180deg,#fff,#f8fafc)}.body{white-space:pre-wrap;font-size:16px;line-height:2.05;min-height:145mm;color:#111827}.watermark{position:absolute;top:52%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:58px;font-weight:900;color:rgba(180,83,9,.055);white-space:nowrap;z-index:0}.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:9mm;page-break-inside:avoid}.sig{border:1.5px solid #111827;border-radius:12px;min-height:27mm;text-align:center;font-weight:900;padding:4mm}.sig .line{margin-top:11mm;border-top:1px solid #111827;padding-top:2mm;font-size:11px;color:#374151}.footer{margin-top:6mm;border-top:1px solid #d1d5db;padding-top:3mm;display:flex;justify-content:space-between;gap:6mm;font-size:10.5px;color:#6b7280}@media print{html,body{background:white}.screen-actions{display:none}.page{margin:0;width:210mm;min-height:297mm;box-shadow:none}}
</style></head><body><div class="screen-actions"><button onclick="window.print()">طباعة</button><button onclick="window.close && window.close()">إغلاق</button></div><main class="page"><div class="outer-frame"></div><div class="inner-frame"></div><div class="corner c1"></div><div class="corner c2"></div><div class="corner c3"></div><div class="corner c4"></div><div class="watermark">${company}</div><section class="content"><header class="head"><img class="logo" src="${logoUrl}" alt="${company}"/><div class="brand"><h1>${company}</h1><div class="en">${companyEn}</div><div class="sub">${subtitle}</div></div><div class="meta"><div><b>التاريخ:</b> ${escapeHtml(todayAr())}</div>${licenseNo ? `<div><b>الرخصة:</b> ${licenseNo}</div>` : ''}${address ? `<div><b>العنوان:</b> ${address}</div>` : ''}${phone ? `<div><b>هاتف:</b> ${phone}</div>` : ''}${email ? `<div><b>بريد:</b> ${email}</div>` : ''}</div></header><h2 class="title">${safeTitle}</h2><section class="body">${safeBody}</section><section class="signatures"><div class="sig">توقيع الموظف<div class="line">الاسم والتوقيع</div></div><div class="sig">الشؤون الإدارية / القانونية<div class="line">الاسم والتوقيع</div></div><div class="sig">ختم الشركة<div class="line">الختم الرسمي</div></div></section><footer class="footer"><span>${footerNote}</span><span>وقت الإصدار: ${issuedAt}</span></footer></section></main></body></html>`
}

export function printBadayatDocument(title, renderedBody, printSettings = {}) {
  const html = buildBadayatPrintHtml(title, renderedBody, printSettings)
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
  doc.open()
  doc.write(html)
  doc.close()
  const runPrint = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => iframe.remove(), 2000)
    } catch (error) {
      console.error('[Badayat Print] failed', error)
      iframe.remove()
    }
  }
  iframe.onload = () => setTimeout(runPrint, 250)
  setTimeout(runPrint, 900)
  return true
}
