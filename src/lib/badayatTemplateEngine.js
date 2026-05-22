export const BADAYAT_TEMPLATE_DRAFTS_KEY = 'helm_badayat_template_drafts_v1'

const todayAr = () => new Date().toLocaleDateString('ar-AE')

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

export function printBadayatDocument(title, renderedBody) {
  const win = window.open('', '_blank', 'width=900,height=1100')
  if (!win) return false
  const safeTitle = String(title || 'مستند بداية الخير')
  const safeBody = String(renderedBody || '').replace(/[<>&]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch]))
  win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><title>${safeTitle}</title><style>body{font-family:Arial,Tahoma,sans-serif;direction:rtl;text-align:right;line-height:2;color:#111;margin:38px}.paper{max-width:820px;margin:0 auto}.head{border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:22px}.office{font-weight:800;font-size:20px}.title{text-align:center;font-size:24px;font-weight:900;margin:18px 0;white-space:pre-wrap}.body{font-size:16px;white-space:pre-wrap}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:42px}.sig{border-top:1px solid #111;padding-top:8px;text-align:center}@media print{button{display:none}body{margin:24px}}</style></head><body><button onclick="window.print()" style="padding:10px 18px;margin-bottom:18px;cursor:pointer">طباعة</button><main class="paper"><div class="head"><div class="office">شركة بداية الخير</div><div>نظام HELM Portal - نماذج الموظفين</div></div><div class="title">${safeTitle}</div><div class="body">${safeBody}</div><div class="signatures"><div class="sig">توقيع الموظف</div><div class="sig">توقيع الشركة</div></div></main></body></html>`)
  win.document.close()
  win.focus()
  return true
}
