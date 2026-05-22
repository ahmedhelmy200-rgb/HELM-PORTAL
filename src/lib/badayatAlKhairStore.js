import { supabase } from '@/integrations/supabase/client'

export const BADAYAT_STORAGE_KEY = 'helm_badayat_al_khair_module_v2'

export const badayatBranches = [
  { id: 'dubai_mother', name: 'بداية الخير دبي (الأم)', type: 'الإدارة الأم', color: 'from-amber-500 to-orange-600' },
  { id: 'showroom_1', name: 'معرض سيارات بداية الخير 1', type: 'معرض سيارات', color: 'from-sky-500 to-blue-700' },
  { id: 'showroom_2', name: 'معرض سيارات بداية الخير 2', type: 'معرض سيارات', color: 'from-emerald-500 to-teal-700' },
  { id: 'legal_sub', name: 'قضايا فرعية', type: 'متابعة قانونية', color: 'from-violet-500 to-purple-700' },
  { id: 'templates', name: 'النماذج الشاملة', type: 'نماذج عمال وموظفين', color: 'from-slate-600 to-slate-900' },
]

export const badayatTemplateGroups = [
  { group: 'العقود والتعيين', items: ['عقد عمل شامل', 'عرض عمل', 'تعديل مسمى وظيفي', 'ترقية وظيفية', 'إقرار مباشرة عمل'] },
  { group: 'الجزاءات والتحقيق', items: ['إنذار أول', 'إنذار نهائي', 'نموذج تحقيق إداري', 'نموذج خصم بسبب غياب', 'نموذج خصم بسبب جزاء', 'نموذج فصل', 'إخطار مخالفة'] },
  { group: 'العهد والاستلام', items: ['إقرار استلام مبلغ', 'إقرار استلام عهدة', 'استلام وتسليم عهدة', 'تسليم جواز السفر للشركة طواعية بدلاً من سداد ضمان العهدة', 'إقرار إرجاع عهدة'] },
  { group: 'الإجازات والمستحقات', items: ['طلب إجازة', 'نموذج موافقة إجازة', 'إقرار استلام مستحقات نهاية الخدمة', 'نموذج استقالة', 'نموذج سلفة'] },
  { group: 'الإقرارات والسياسات', items: ['نموذج تعهد بعدم التكرار', 'نموذج تنبيه وتوجيه', 'لائحة داخلية للعقوبات والخصومات', 'إقرار اطلاع الموظف على موانع ومحظورات وسياسة الشركة'] },
]

export const defaultBadayatEmployees = [
  {
    id: 'emp-001',
    branchId: 'dubai_mother',
    photo: '',
    fullName: 'موظف تجريبي - الإدارة الأم',
    nationality: 'مصري',
    emiratesId: '784-0000-0000000-0',
    passportNo: 'P0000000',
    phone: '0500000000',
    email: 'employee@example.com',
    jobTitle: 'إداري',
    department: 'الإدارة',
    workLocation: 'دبي',
    contractType: 'دوام كامل',
    contractStart: '2026-01-01',
    contractEnd: '2028-01-01',
    basicSalary: 3500,
    allowances: 500,
    deductions: 0,
    residencyStatus: 'سارية',
    residencyExpiry: '2027-06-30',
    workPermitExpiry: '2027-06-30',
    passportHeldVoluntarily: 'لا',
    penalties: [{ date: '2026-02-10', title: 'تنبيه إداري', amount: 0, note: 'تأخير بسيط' }],
    rewards: [{ date: '2026-03-01', title: 'مكافأة انضباط', amount: 250, note: 'التزام بالحضور' }],
    rating: 86,
    notes: 'ملف موظف قابل للتعديل من الشؤون القانونية.',
  },
  {
    id: 'emp-002',
    branchId: 'showroom_1',
    photo: '',
    fullName: 'موظف تجريبي - معرض 1',
    nationality: 'هندي',
    emiratesId: '784-1111-1111111-1',
    passportNo: 'A1111111',
    phone: '0550000000',
    email: 'sales@example.com',
    jobTitle: 'مندوب مبيعات سيارات',
    department: 'المبيعات',
    workLocation: 'معرض 1',
    contractType: 'عمولة وراتب',
    contractStart: '2026-02-01',
    contractEnd: '2028-02-01',
    basicSalary: 2800,
    allowances: 300,
    deductions: 0,
    residencyStatus: 'تحتاج متابعة',
    residencyExpiry: '2026-08-15',
    workPermitExpiry: '2026-08-15',
    passportHeldVoluntarily: 'لا',
    penalties: [],
    rewards: [],
    rating: 78,
    notes: 'يتم ربط العهد والسيارات المسلمة له لاحقاً.',
  },
]

const toEmployee = (row = {}) => ({
  id: row.id,
  branchId: row.branch_id || row.branchId || 'dubai_mother',
  photo: row.photo_url || row.photo || '',
  fullName: row.full_name || row.fullName || '',
  nationality: row.nationality || '',
  emiratesId: row.emirates_id || row.emiratesId || '',
  passportNo: row.passport_no || row.passportNo || '',
  phone: row.phone || '',
  email: row.email || '',
  jobTitle: row.job_title || row.jobTitle || '',
  department: row.department || '',
  workLocation: row.work_location || row.workLocation || '',
  contractType: row.contract_type || row.contractType || '',
  contractStart: row.contract_start || row.contractStart || '',
  contractEnd: row.contract_end || row.contractEnd || '',
  basicSalary: Number(row.basic_salary ?? row.basicSalary ?? 0),
  allowances: Number(row.allowances ?? 0),
  deductions: Number(row.deductions ?? 0),
  residencyStatus: row.residency_status || row.residencyStatus || '',
  residencyExpiry: row.residency_expiry || row.residencyExpiry || '',
  workPermitExpiry: row.work_permit_expiry || row.workPermitExpiry || '',
  passportHeldVoluntarily: row.passport_held_voluntarily || row.passportHeldVoluntarily || 'لا',
  penalties: Array.isArray(row.penalties) ? row.penalties : [],
  rewards: Array.isArray(row.rewards) ? row.rewards : [],
  rating: Number(row.rating ?? 0),
  notes: row.notes || '',
})

const toRow = (emp = {}) => ({
  id: emp.id,
  branch_id: emp.branchId,
  photo_url: emp.photo || null,
  full_name: emp.fullName || 'موظف جديد',
  nationality: emp.nationality || null,
  emirates_id: emp.emiratesId || null,
  passport_no: emp.passportNo || null,
  phone: emp.phone || null,
  email: emp.email || null,
  job_title: emp.jobTitle || null,
  department: emp.department || null,
  work_location: emp.workLocation || null,
  contract_type: emp.contractType || null,
  contract_start: emp.contractStart || null,
  contract_end: emp.contractEnd || null,
  basic_salary: Number(emp.basicSalary || 0),
  allowances: Number(emp.allowances || 0),
  deductions: Number(emp.deductions || 0),
  residency_status: emp.residencyStatus || null,
  residency_expiry: emp.residencyExpiry || null,
  work_permit_expiry: emp.workPermitExpiry || null,
  passport_held_voluntarily: emp.passportHeldVoluntarily || 'لا',
  penalties: Array.isArray(emp.penalties) ? emp.penalties : [],
  rewards: Array.isArray(emp.rewards) ? emp.rewards : [],
  rating: Number(emp.rating || 0),
  notes: emp.notes || null,
  updated_date: new Date().toISOString(),
})

function isSupabaseSchemaMissing(error) {
  const msg = String(error?.message || error || '').toLowerCase()
  return msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('badayat_employees') || msg.includes('relation')
}

export function loadBadayatLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(BADAYAT_STORAGE_KEY) || 'null')
    if (saved?.employees?.length) return saved
  } catch {}
  return { employees: defaultBadayatEmployees, audit: [], source: 'local' }
}

export function saveBadayatLocal(state) {
  localStorage.setItem(BADAYAT_STORAGE_KEY, JSON.stringify({ ...state, source: 'local' }))
  return { ...state, source: 'local' }
}

export async function loadBadayatState() {
  const fallback = loadBadayatLocal()
  try {
    const { data, error } = await supabase
      .from('badayat_employees')
      .select('*')
      .order('created_date', { ascending: false })
    if (error) {
      if (isSupabaseSchemaMissing(error)) return fallback
      throw error
    }
    const rows = (data || []).map(toEmployee)
    if (!rows.length) return fallback
    return { employees: rows, audit: fallback.audit || [], source: 'supabase' }
  } catch (error) {
    console.warn('[BadayatAlKhair] Using local fallback:', error?.message || error)
    return fallback
  }
}

export async function saveBadayatEmployee(emp) {
  saveBadayatLocal({
    ...loadBadayatLocal(),
    employees: loadBadayatLocal().employees.map((item) => item.id === emp.id ? emp : item),
  })
  try {
    const { data, error } = await supabase
      .from('badayat_employees')
      .upsert(toRow(emp), { onConflict: 'id' })
      .select()
      .single()
    if (error) {
      if (isSupabaseSchemaMissing(error)) return { employee: emp, source: 'local' }
      throw error
    }
    return { employee: toEmployee(data), source: 'supabase' }
  } catch (error) {
    console.warn('[BadayatAlKhair] Employee saved locally only:', error?.message || error)
    return { employee: emp, source: 'local' }
  }
}

export async function saveBadayatAudit(entry) {
  try {
    await supabase.from('badayat_audit').insert({
      action: entry.action,
      employee_name: entry.employee,
      note: entry.note,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.warn('[BadayatAlKhair] Audit saved in local state only:', error?.message || error)
  }
}
