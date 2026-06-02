import { badayatTemplateGroups } from '@/lib/badayatAlKhairStore'
import {
  BADAYAT_TEMPLATE_DRAFTS_KEY,
  defaultBadayatPrintHeader,
  defaultBadayatTemplateBodies,
} from '@/lib/badayatTemplateEngine'

const VERSION_KEY = 'helm_badayat_portal_template_preset_version'
const GROUP_NAME = 'العقود والتعيين'
const PRELIMINARY_NAME = 'عقد عمل مبدئي'
const COMPREHENSIVE_NAME = 'عقد عمل شامل'

const companyHeader = {
  companyName: 'بداية الخير لتجارة السيارات المستعملة',
  companyNameEn: 'BDAYT ALKHIR',
  subtitle: 'معرض سيارات',
  logoUrl: '/badayat-logo.svg',
  address: '58 معرض بداية الخير، سوق سيارات الحراج، الشارقة',
  footerNote: 'هذا العقد صادر من HELM Portal - قسم بداية الخير - النماذج',
}

const employmentContractBody = `عقد عمل مبدئي

تم هذا العقد في يوم {{today}} بين كل من:

الطرف الأول:
بداية الخير لتجارة السيارات المستعملة، وعنوانها: 58 معرض بداية الخير، سوق سيارات الحراج، الشارقة، ويمثلها المفوض بالتوقيع أدناه.

الطرف الثاني:
السيد/ {{fullName}}، الجنسية: {{nationality}}، رقم الهوية الإماراتية: {{emiratesId}}، رقم جواز السفر: {{passportNo}}، هاتف: {{phone}}، بريد إلكتروني: {{email}}.

أولاً: بيانات الوظيفة والأجر
1. يعمل الطرف الثاني لدى الطرف الأول بوظيفة: {{jobTitle}}، بقسم: {{department}}، في مقر العمل: {{workLocation}}.
2. مدة العقد سنتان تبدأ من: {{contractStart}} وتنتهي في: {{contractEnd}}، ما لم يتم تجديدها أو تعديلها كتابة.
3. فترة التجربة ستة أشهر من تاريخ مباشرة العمل، ويجوز تقييم أداء الطرف الثاني خلالها وفقاً للقانون واللوائح الداخلية.
4. الراتب الأساسي/الإجمالي: {{basicSalary}} درهم.
5. العلاوات أو البدلات: {{allowances}} درهم.
6. صافي الثابت الشهري بعد الخصومات الحالية: {{netSalary}} درهم.
7. العمولة: نسبة متغيرة بحسب كل بيعة ووفق سياسة الشركة واعتماد الإدارة، ولا تستحق إلا بعد إتمام البيع والتحصيل وإقفال العملية.

ثانياً: طبيعة العمل والالتزام
يلتزم الطرف الثاني بأداء عمله بجدية وأمانة وحسن نية، وباتباع تعليمات الإدارة، واحترام مواعيد العمل، والمحافظة على سمعة الشركة وعملائها ومركباتها ومستنداتها، وعدم استعمال أي أموال أو صلاحيات أو بيانات إلا في حدود مصلحة العمل.

ثالثاً: مدة الإنذار
يتفق الطرفان على أن مدة الإنذار في حال إنهاء العقد من أي من الطرفين هي ثلاثة أشهر كاملة، تبدأ من تاريخ تسليم إشعار الإنهاء للطرف الآخر، ما لم يقرر القانون أو اتفاق كتابي مدة أكثر ملاءمة للطرفين.

رابعاً: شرط عدم المنافسة وعدم الاستقطاب
نظراً لطبيعة عمل الشركة وما قد يطلع عليه الطرف الثاني من بيانات عملاء وأسعار وموردين وسياسات بيع ومعلومات تجارية، يلتزم الطرف الثاني بعد انتهاء العلاقة بعدم منافسة الطرف الأول أو العمل لدى جهة منافسة أو لحسابه الخاص في ذات النشاط، وعدم استقطاب عملاء أو موظفي أو موردي الشركة، وذلك لمدة سنتين من تاريخ انتهاء العلاقة، أو الحد الأقصى الجائز قانوناً أيهما أقصر، وفي الحدود اللازمة لحماية مصالح الشركة المشروعة دون تعسف.

خامساً: التدريب ورد تكاليفه
يقر الطرف الثاني بأن الشركة قد تتحمل لصالحه تكاليف تدريب وتأهيل ومتابعة خلال السنة الأولى من العمل. فإذا ترك العمل بإرادته أو امتنع عن الاستمرار خلال السنة الأولى دون سبب مشروع، أو تسبب بخطئه في إنهاء العلاقة، التزم برد تكاليف التدريب الفعلية والمثبتة أو المتفق عليها في هذا العقد، وبما يتوافق مع القانون.

سادساً: السرية والعهد
يلتزم الطرف الثاني بالمحافظة على سرية جميع البيانات والمستندات والأسعار وملفات العملاء والموردين وأي معلومات يطلع عليها بسبب العمل، وعدم استعمالها إلا لمصلحة الشركة، سواء أثناء سريان العقد أو بعد انتهائه. كما يلتزم برد جميع العهد والأدوات والمفاتيح والمستندات والصلاحيات عند طلب الشركة أو عند انتهاء العلاقة.

سابعاً: اللوائح الداخلية وحل النزاعات
يلتزم الطرف الثاني بجميع اللوائح الداخلية وتعليمات الإدارة، ويخضع هذا العقد لأحكام قانون العمل الاتحادي لدولة الإمارات العربية المتحدة والقرارات المنفذة له. ويتم حل أي نزاع ودياً، فإن تعذر ذلك تختص الجهات والمحاكم المختصة في إمارة الشارقة بنظره.

توقيع الطرف الأول / الشركة: ............................
توقيع الطرف الثاني / الموظف: ............................
الشاهد الأول: ............................
الشاهد الثاني: ............................`

function readDrafts() {
  try { return JSON.parse(localStorage.getItem(BADAYAT_TEMPLATE_DRAFTS_KEY) || '{}') || {} } catch { return {} }
}

export function installBadayatPortalTemplatePreset() {
  Object.assign(defaultBadayatPrintHeader, companyHeader)
  defaultBadayatTemplateBodies[PRELIMINARY_NAME] = employmentContractBody
  defaultBadayatTemplateBodies[COMPREHENSIVE_NAME] = employmentContractBody

  const targetGroup = badayatTemplateGroups.find((group) => group.group === GROUP_NAME)
  if (targetGroup) {
    const current = Array.isArray(targetGroup.items) ? targetGroup.items : []
    targetGroup.items = [
      PRELIMINARY_NAME,
      COMPREHENSIVE_NAME,
      ...current.filter((item) => item !== PRELIMINARY_NAME && item !== COMPREHENSIVE_NAME),
    ]
  }

  if (typeof window === 'undefined') return
  try {
    const drafts = readDrafts()
    if (localStorage.getItem(VERSION_KEY) !== '2026-06-02-v2') {
      drafts[PRELIMINARY_NAME] = employmentContractBody
      drafts[COMPREHENSIVE_NAME] = employmentContractBody
      localStorage.setItem(BADAYAT_TEMPLATE_DRAFTS_KEY, JSON.stringify(drafts))
      localStorage.setItem(VERSION_KEY, '2026-06-02-v2')
    }
  } catch (error) {
    console.warn('[Badayat templates] preset install failed:', error)
  }
}
