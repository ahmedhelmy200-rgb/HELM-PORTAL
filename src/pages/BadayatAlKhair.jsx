import React, { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  Database,
  Download,
  FileText,
  Gavel,
  Mail,
  MessageCircle,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  badayatBranches as branches,
  badayatTemplateGroups as templateGroups,
  loadBadayatState,
  saveBadayatLocal,
  saveBadayatEmployee,
  saveBadayatAudit,
} from "@/lib/badayatAlKhairStore";
import {
  badayatTemplatePlaceholders,
  getBadayatTemplateBody,
  renderBadayatTemplate,
  saveBadayatTemplateDraft,
  resetBadayatTemplateDraft,
  printBadayatDocument,
} from "@/lib/badayatTemplateEngine";
import { exportBadayatDocumentPdf } from "@/lib/badayatPdfExport";

const TASKS_LOCAL_KEY = "helm_badayat_tasks_v1";
const DEFAULT_BRANCH = "dubai_mother";

function money(value) {
  return `${Number(value || 0).toLocaleString("ar-AE", { maximumFractionDigits: 2 })} د.إ`;
}

function daysLeft(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch { return fallback; }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `971${digits.slice(1)}`;
  return digits;
}

function todayDateTime() {
  return new Date(Date.now() + 86400000).toISOString().slice(0, 16);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function employeeBranchName(branchId) {
  return branches.find((b) => b.id === branchId)?.name || "بداية الخير";
}

function buildEmployeeProfileText(emp, grossSalary, branchName) {
  return `ملف موظف

الفرع: ${branchName}
الاسم: ${emp.fullName || "................"}
الجنسية: ${emp.nationality || "................"}
رقم الهوية/الرقم المسجل: ${emp.emiratesId || "................"}
رقم جواز السفر: ${emp.passportNo || "................"}
الهاتف: ${emp.phone || "................"}
البريد الإلكتروني: ${emp.email || "................"}

الوظيفة والقسم
المسمى الوظيفي: ${emp.jobTitle || "................"}
القسم: ${emp.department || "................"}
مكان العمل: ${emp.workLocation || "................"}

العقد والتصاريح
نوع العقد: ${emp.contractType || "................"}
بداية العقد: ${emp.contractStart || "................"}
نهاية العقد: ${emp.contractEnd || "................"}
حالة الإقامة/التصريح: ${emp.residencyStatus || "................"}
انتهاء الإقامة: ${emp.residencyExpiry || "................"}
انتهاء تصريح العمل: ${emp.workPermitExpiry || "................"}

الحسابات
الراتب الأساسي: ${money(emp.basicSalary)}
العلاوات: ${money(emp.allowances)}
الخصومات: ${money(emp.deductions)}
الصافي الحالي: ${money(grossSalary)}

ملاحظات
${emp.notes || "لا توجد ملاحظات مسجلة."}`;
}

export default function BadayatAlKhair() {
  const { user } = useAuth();
  const [activeBranch, setActiveBranch] = useState(DEFAULT_BRANCH);
  const [state, setState] = useState({ employees: [], audit: [], source: "loading" });
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [actionAmount, setActionAmount] = useState(250);
  const [legalNote, setLegalNote] = useState("");
  const [taskForm, setTaskForm] = useState({ title: "", due_date: todayDateTime(), priority: "متوسطة" });
  const [isLoading, setIsLoading] = useState(true);
  const [syncSource, setSyncSource] = useState("loading");
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    let alive = true;
    loadBadayatState().then((next) => {
      if (!alive) return;
      const safeNext = {
        employees: safeArray(next?.employees),
        audit: safeArray(next?.audit),
        source: next?.source || "local",
      };
      setState(safeNext);
      setSyncSource(safeNext.source);
      setSelectedId(safeNext.employees?.[0]?.id || "");
      setIsLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const employees = state.employees || [];
  const activeBranchInfo = branches.find((b) => b.id === activeBranch) || branches[0];
  const isTemplates = activeBranch === "templates";

  const branchEmployees = useMemo(() => {
    const s = query.trim().toLowerCase();
    return employees.filter((emp) => {
      if (emp.branchId !== activeBranch) return false;
      if (!s) return true;
      return `${emp.fullName} ${emp.phone} ${emp.jobTitle} ${emp.department} ${emp.emiratesId} ${emp.passportNo}`.toLowerCase().includes(s);
    });
  }, [employees, activeBranch, query]);

  const selectedEmployee = useMemo(() => {
    if (isTemplates) return employees.find((e) => e.id === selectedId) || employees[0] || null;
    return branchEmployees.find((e) => e.id === selectedId) || branchEmployees[0] || null;
  }, [employees, branchEmployees, selectedId, isTemplates]);

  useEffect(() => {
    if (isTemplates) return;
    if (!branchEmployees.length) return;
    if (!branchEmployees.some((e) => e.id === selectedId)) setSelectedId(branchEmployees[0].id);
  }, [activeBranch, branchEmployees, selectedId, isTemplates]);

  const stats = useMemo(() => {
    const branchRows = isTemplates ? employees : employees.filter((e) => e.branchId === activeBranch);
    const expiring = branchRows.filter((e) => {
      const left = daysLeft(e.residencyExpiry || e.workPermitExpiry);
      return left !== null && left <= 60;
    }).length;
    const penalties = branchRows.reduce((sum, e) => sum + safeArray(e.penalties).length, 0);
    const rewards = branchRows.reduce((sum, e) => sum + safeArray(e.rewards).length, 0);
    const payroll = branchRows.reduce((sum, e) => sum + Number(e.basicSalary || 0) + Number(e.allowances || 0) - Number(e.deductions || 0), 0);
    return { count: branchRows.length, expiring, penalties, rewards, payroll };
  }, [employees, activeBranch, isTemplates]);

  const persistState = async (nextState, employeeToSave = null, auditEntry = null) => {
    saveBadayatLocal(nextState);
    if (auditEntry) saveBadayatAudit(auditEntry);
    if (employeeToSave) {
      const result = await saveBadayatEmployee(employeeToSave);
      setSyncSource(result?.source || "local");
    }
    setLastSaved(new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" }));
  };

  const pushAudit = (employee, action, note = "") => ({
    at: new Date().toLocaleString("ar-AE"),
    employee: employee?.fullName || "بداية الخير",
    action,
    note,
  });

  const patchEmployee = (patch, actionLabel = "تعديل بيانات") => {
    if (!selectedEmployee) return;
    const nextEmployee = { ...selectedEmployee, ...patch };
    const auditEntry = pushAudit(selectedEmployee, actionLabel, typeof patch === "string" ? patch : JSON.stringify(patch));
    const nextState = {
      ...state,
      employees: employees.map((e) => (e.id === selectedEmployee.id ? nextEmployee : e)),
      audit: [auditEntry, ...safeArray(state.audit)].slice(0, 180),
    };
    setState(nextState);
    persistState(nextState, nextEmployee, auditEntry);
  };

  const addEmployee = () => {
    const branchId = isTemplates ? DEFAULT_BRANCH : activeBranch;
    const emp = {
      id: `emp-${Date.now()}`,
      branchId,
      photo: "",
      fullName: "موظف جديد",
      nationality: "",
      emiratesId: "",
      passportNo: "",
      phone: "",
      email: "",
      jobTitle: "",
      department: "",
      workLocation: employeeBranchName(branchId),
      contractType: "سنتان",
      contractStart: "",
      contractEnd: "",
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      residencyStatus: "غير محدد",
      residencyExpiry: "",
      workPermitExpiry: "",
      passportHeldVoluntarily: "لا",
      penalties: [],
      rewards: [],
      rating: 70,
      notes: "",
    };
    const auditEntry = pushAudit(emp, "إضافة موظف", employeeBranchName(branchId));
    const nextState = { ...state, employees: [emp, ...employees], audit: [auditEntry, ...safeArray(state.audit)].slice(0, 180) };
    setState(nextState);
    setActiveBranch(branchId);
    setSelectedId(emp.id);
    persistState(nextState, emp, auditEntry);
  };

  const applyFinance = (type) => {
    if (!selectedEmployee) return;
    const amount = Number(actionAmount || 0);
    if (!amount) return;
    const today = new Date().toISOString().slice(0, 10);
    const patch = type === "allowance"
      ? {
          allowances: Number(selectedEmployee.allowances || 0) + amount,
          rewards: [{ date: today, title: "علاوة / مكافأة", amount, note: "إضافة من الحسابات" }, ...safeArray(selectedEmployee.rewards)],
        }
      : {
          deductions: Number(selectedEmployee.deductions || 0) + amount,
          penalties: [{ date: today, title: "خصم مالي", amount, note: "تطبيق خصم من الحسابات" }, ...safeArray(selectedEmployee.penalties)],
        };
    patchEmployee(patch, type === "allowance" ? "إضافة علاوة" : "تطبيق خصم");
  };

  const notifyEmployee = (mode = "audit") => {
    if (!selectedEmployee) return;
    const msg = legalNote || `إشعار إداري من شركة بداية الخير للسيد/ ${selectedEmployee.fullName}`;
    const auditEntry = pushAudit(selectedEmployee, mode === "whatsapp" ? "إشعار واتساب" : mode === "email" ? "إشعار بريد" : "إشعار موظف", msg);
    const nextState = { ...state, audit: [auditEntry, ...safeArray(state.audit)].slice(0, 180) };
    setState(nextState);
    persistState(nextState, selectedEmployee, auditEntry);
    if (mode === "whatsapp") {
      const phone = normalizePhone(selectedEmployee.phone);
      if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    }
    if (mode === "email" && selectedEmployee.email) {
      window.location.href = `mailto:${selectedEmployee.email}?subject=${encodeURIComponent("إشعار إداري - بداية الخير")}&body=${encodeURIComponent(msg)}`;
    }
    setLegalNote("");
  };

  const createSpecialTask = async () => {
    if (!selectedEmployee || !taskForm.title.trim()) return;
    const task = {
      title: taskForm.title.trim(),
      description: `مهمة خاصة من قسم بداية الخير للموظف: ${selectedEmployee.fullName}\n${legalNote || ""}`,
      case_title: `بداية الخير - ${selectedEmployee.fullName}`,
      client_name: selectedEmployee.fullName,
      task_type: "مهمة عامة",
      priority: taskForm.priority || "متوسطة",
      due_date: taskForm.due_date || todayDateTime(),
      status: "معلقة",
      assigned_to: user?.email || "",
    };
    try { await base44.entities.Task.create(task); }
    catch { writeJson(TASKS_LOCAL_KEY, [task, ...readJson(TASKS_LOCAL_KEY, [])]); }
    const auditEntry = pushAudit(selectedEmployee, "إنشاء مهمة خاصة", task.title);
    const nextState = { ...state, audit: [auditEntry, ...safeArray(state.audit)].slice(0, 180) };
    setState(nextState);
    persistState(nextState, selectedEmployee, auditEntry);
    setTaskForm({ title: "", due_date: todayDateTime(), priority: "متوسطة" });
  };

  const grossSalary = Number(selectedEmployee?.basicSalary || 0) + Number(selectedEmployee?.allowances || 0) - Number(selectedEmployee?.deductions || 0);
  const residencyLeft = daysLeft(selectedEmployee?.residencyExpiry || selectedEmployee?.workPermitExpiry);

  if (isLoading) {
    return <div dir="rtl" className="rounded-[2rem] border border-amber-300/20 bg-slate-950/80 p-8 text-slate-100 shadow-2xl">جارٍ تحميل قسم بداية الخير...</div>;
  }

  return (
    <div dir="rtl" className="space-y-6 text-slate-100">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-amber-300/20 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_15%_15%,#f59e0b,transparent_31%),radial-gradient(circle_at_88%_18%,#ffffff,transparent_20%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black tracking-[.35em] text-amber-300">BDAYT ALKHIR CAR SHOWROOM</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">قسم بداية الخير</h1>
            <p className="mt-3 max-w-4xl leading-8 text-slate-300">لوحة تشغيل مطورة لإدارة الموظفين، العقود، الإقامات، العهد، الحسابات، الجزاءات، الإشعارات، والطباعات الرسمية بهيدر العقد النهائي.</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
              <StatusPill tone={syncSource === "supabase" ? "green" : "amber"} icon={Database}>{syncSource === "supabase" ? "متصل بـ Supabase" : "حفظ محلي احتياطي"}</StatusPill>
              {lastSaved && <StatusPill>آخر حفظ: {lastSaved}</StatusPill>}
              <StatusPill>إجمالي الموظفين: {employees.length}</StatusPill>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <ActionButton onClick={() => setActiveBranch("templates")} icon={FileText} variant="ghost">النماذج</ActionButton>
            <ActionButton onClick={addEmployee} icon={Plus}>إضافة موظف</ActionButton>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {branches.map((branch) => (
          <button key={branch.id} onClick={() => setActiveBranch(branch.id)} className={`group rounded-[1.75rem] border p-4 text-right transition-all duration-200 ${activeBranch === branch.id ? "border-amber-300 bg-amber-300/10 shadow-xl shadow-amber-950/20" : "border-white/10 bg-white/[0.055] hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-white/10"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${branch.color} shadow-lg`}><Building2 className="h-6 w-6" /></div>
              {activeBranch === branch.id && <span className="rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-slate-950">محدد</span>}
            </div>
            <h3 className="mt-4 text-sm font-black leading-6">{branch.name}</h3>
            <p className="mt-1 text-xs text-slate-400">{branch.type}</p>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={Users} label="الموظفون" value={stats.count} />
        <Stat icon={ShieldCheck} label="متابعة خلال 60 يوم" value={stats.expiring} danger={stats.expiring > 0} />
        <Stat icon={Gavel} label="الجزاءات" value={stats.penalties} />
        <Stat icon={Award} label="المكافآت" value={stats.rewards} />
        <Stat icon={Wallet} label="إجمالي الرواتب" value={money(stats.payroll)} />
      </section>

      {isTemplates ? (
        <TemplatesPanel employees={employees} selectedEmployee={selectedEmployee} />
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[390px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-black">{activeBranchInfo.name}</h2>
                <p className="text-xs text-slate-400">{branchEmployees.length} موظف داخل الفرع</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">HR</span>
            </div>
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-amber-300/70">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث بالاسم، الوظيفة، الجواز، البطاقة..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" />
            </div>
            <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
              {branchEmployees.map((emp) => <EmployeeCard key={emp.id} emp={emp} selected={selectedEmployee?.id === emp.id} onClick={() => setSelectedId(emp.id)} />)}
              {!branchEmployees.length && <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-slate-400">لا توجد بيانات موظفين داخل هذا الفرع.</p>}
            </div>
          </aside>
          <div className="space-y-4">
            {selectedEmployee ? <EmployeeWorkspace emp={selectedEmployee} patchEmployee={patchEmployee} grossSalary={grossSalary} residencyLeft={residencyLeft} actionAmount={actionAmount} setActionAmount={setActionAmount} applyFinance={applyFinance} legalNote={legalNote} setLegalNote={setLegalNote} notifyEmployee={notifyEmployee} activeBranchInfo={activeBranchInfo} taskForm={taskForm} setTaskForm={setTaskForm} createSpecialTask={createSpecialTask} /> : <EmptyEmployee />}
            <AuditPanel audit={state.audit} />
          </div>
        </section>
      )}
    </div>
  );
}

function StatusPill({ children, tone = "slate", icon: Icon }) {
  const map = { green: "bg-emerald-500/15 text-emerald-200", amber: "bg-amber-500/15 text-amber-200", slate: "bg-white/10 text-slate-300" };
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-black ${map[tone] || map.slate}`}>{Icon && <Icon className="h-3.5 w-3.5" />}{children}</span>;
}

function ActionButton({ children, onClick, icon: Icon, variant = "solid", className = "" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-all duration-200 active:scale-[.98]";
  const styles = variant === "ghost" ? "border border-white/10 bg-white/10 text-white hover:bg-white/15" : "bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/20 hover:bg-amber-300";
  return <button onClick={onClick} className={`${base} ${styles} ${className}`}>{Icon && <Icon className="h-4 w-4" />}{children}</button>;
}

function Stat({ icon: Icon, label, value, danger }) {
  return <div className={`rounded-[1.6rem] border p-4 shadow-lg ${danger ? "border-red-400/40 bg-red-500/10" : "border-white/10 bg-white/[0.055]"}`}><Icon className="mb-3 h-5 w-5 text-amber-300" /><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p></div>;
}

function Avatar({ emp, size = "md" }) {
  const dim = size === "lg" ? "h-20 w-20 rounded-[1.6rem]" : "h-12 w-12 rounded-2xl";
  return <div className={`flex ${dim} shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-300 via-stone-600 to-slate-950 ring-1 ring-white/10`}>{emp.photo ? <img src={emp.photo} alt={emp.fullName} className="h-full w-full object-cover" /> : <Users className="h-6 w-6 text-white" />}</div>;
}

function EmployeeCard({ emp, selected, onClick }) {
  const left = daysLeft(emp.residencyExpiry || emp.workPermitExpiry);
  const net = Number(emp.basicSalary || 0) + Number(emp.allowances || 0) - Number(emp.deductions || 0);
  const needsFollow = left !== null && left <= 60;
  return <button onClick={onClick} className={`w-full rounded-[1.35rem] border p-3 text-right transition-all ${selected ? "border-amber-300 bg-amber-300/10 shadow-lg" : "border-white/10 bg-white/[0.055] hover:border-amber-300/40 hover:bg-white/10"}`}>
    <div className="flex items-center gap-3">
      <Avatar emp={emp} />
      <div className="min-w-0 flex-1">
        <h4 className="truncate font-black">{emp.fullName}</h4>
        <p className="truncate text-xs text-slate-400">{emp.jobTitle || "بدون مسمى"} · {emp.department || "بدون قسم"}</p>
        <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
          <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">{money(net)}</span>
          {emp.workPermitExpiry && <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">تصريح: {emp.workPermitExpiry}</span>}
        </div>
      </div>
      {needsFollow && <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black text-red-200">متابعة</span>}
    </div>
  </button>;
}

function Field({ label, value, onChange, type = "text", className = "" }) {
  return <label className={`block ${className}`}><span className="text-xs font-bold text-slate-400">{label}</span><input type={type} value={value ?? ""} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 outline-none transition focus:border-amber-300" /></label>;
}

function Panel({ title, icon: Icon, children, className = "" }) {
  return <section className={`rounded-[2rem] border border-white/10 bg-slate-950/65 p-5 shadow-xl ${className}`}><h3 className="mb-4 flex items-center gap-2 text-lg font-black"><span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-300/10"><Icon className="h-5 w-5 text-amber-300" /></span>{title}</h3>{children}</section>;
}

function ListPanel({ title, items, empty, icon = ClipboardCheck }) {
  const Icon = icon;
  return <Panel title={title} icon={Icon}>{items?.length ? <div className="space-y-2">{items.map((it, i) => <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3"><b>{it.title}</b><p className="mt-1 text-xs text-slate-400">{it.date} · {money(it.amount)}</p>{it.note && <p className="mt-1 text-sm text-slate-300">{it.note}</p>}</div>)}</div> : <p className="rounded-2xl border border-dashed border-white/10 p-4 text-slate-400">{empty}</p>}</Panel>;
}

function EmployeeWorkspace({ emp, patchEmployee, grossSalary, residencyLeft, actionAmount, setActionAmount, applyFinance, legalNote, setLegalNote, notifyEmployee, activeBranchInfo, taskForm, setTaskForm, createSpecialTask }) {
  const handlePhotoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patchEmployee({ photo: reader.result }, "رفع صورة الموظف");
    reader.readAsDataURL(file);
  };

  const printProfile = () => printBadayatDocument("ملف موظف", buildEmployeeProfileText(emp, grossSalary, activeBranchInfo.name));

  return <div className="space-y-4">
    <div className="rounded-[2rem] border border-amber-300/20 bg-gradient-to-l from-slate-950 via-slate-900 to-slate-950 p-5 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4"><Avatar emp={emp} size="lg" /><div><p className="text-xs font-black text-amber-300">{activeBranchInfo.name}</p><h2 className="mt-1 text-2xl font-black md:text-3xl">{emp.fullName}</h2><p className="text-slate-400">{emp.jobTitle || "بدون مسمى"} · {emp.department || "بدون قسم"}</p></div></div>
        <div className="grid grid-cols-2 gap-2 text-sm"><span className="rounded-2xl bg-white/10 px-3 py-2">الصافي: <b>{money(grossSalary)}</b></span><span className={`rounded-2xl px-3 py-2 ${residencyLeft !== null && residencyLeft <= 60 ? "bg-red-500/15 text-red-200" : "bg-emerald-500/10 text-emerald-200"}`}>المتابعة: {residencyLeft === null ? "غير محدد" : `${residencyLeft} يوم`}</span></div>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title="بيانات الموظف" icon={Users}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="الاسم الكامل" value={emp.fullName} onChange={(v) => patchEmployee({ fullName: v })} />
          <Field label="الجنسية" value={emp.nationality} onChange={(v) => patchEmployee({ nationality: v })} />
          <Field label="رقم الهوية / الرقم المسجل" value={emp.emiratesId} onChange={(v) => patchEmployee({ emiratesId: v })} />
          <Field label="رقم الجواز" value={emp.passportNo} onChange={(v) => patchEmployee({ passportNo: v })} />
          <Field label="الهاتف" value={emp.phone} onChange={(v) => patchEmployee({ phone: v })} />
          <Field label="البريد الإلكتروني" value={emp.email} onChange={(v) => patchEmployee({ email: v })} />
          <Field label="مكان العمل" value={emp.workLocation} onChange={(v) => patchEmployee({ workLocation: v })} />
          <label className="block"><span className="text-xs font-bold text-slate-400">صورة الموظف من الجهاز</span><input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files?.[0])} className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm" /></label>
        </div>
      </Panel>

      <Panel title="العقد والتصاريح" icon={ShieldCheck}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="حالة الإقامة / التصريح" value={emp.residencyStatus} onChange={(v) => patchEmployee({ residencyStatus: v })} />
          <Field label="انتهاء الإقامة" type="date" value={emp.residencyExpiry} onChange={(v) => patchEmployee({ residencyExpiry: v })} />
          <Field label="انتهاء تصريح العمل" type="date" value={emp.workPermitExpiry} onChange={(v) => patchEmployee({ workPermitExpiry: v })} />
          <Field label="نوع العقد" value={emp.contractType} onChange={(v) => patchEmployee({ contractType: v })} />
          <Field label="بداية العقد" type="date" value={emp.contractStart} onChange={(v) => patchEmployee({ contractStart: v })} />
          <Field label="نهاية العقد" type="date" value={emp.contractEnd} onChange={(v) => patchEmployee({ contractEnd: v })} />
          <Field label="التقييم" type="number" value={emp.rating} onChange={(v) => patchEmployee({ rating: v })} />
          <Field label="ملاحظة مستندات" value={emp.passportHeldVoluntarily} onChange={(v) => patchEmployee({ passportHeldVoluntarily: v })} />
        </div>
      </Panel>

      <Panel title="الحسابات" icon={Wallet}>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3"><Field label="الراتب الأساسي" type="number" value={emp.basicSalary} onChange={(v) => patchEmployee({ basicSalary: v })} /><Field label="العلاوات" type="number" value={emp.allowances} onChange={(v) => patchEmployee({ allowances: v })} /><Field label="الخصومات" type="number" value={emp.deductions} onChange={(v) => patchEmployee({ deductions: v })} /></div>
        <div className="flex flex-col gap-2 md:flex-row"><input type="number" value={actionAmount} onChange={(e) => setActionAmount(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 outline-none" /><ActionButton onClick={() => applyFinance("allowance")} variant="ghost">إضافة علاوة</ActionButton><button onClick={() => applyFinance("deduction")} className="rounded-2xl bg-red-500 px-4 py-2 font-black text-white">تطبيق خصم</button></div>
      </Panel>

      <Panel title="الشؤون القانونية والإشعارات" icon={BriefcaseBusiness}>
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2"><Field label="المسمى الوظيفي" value={emp.jobTitle} onChange={(v) => patchEmployee({ jobTitle: v })} /><Field label="القسم" value={emp.department} onChange={(v) => patchEmployee({ department: v })} /></div>
        <textarea value={legalNote} onChange={(e) => setLegalNote(e.target.value)} placeholder="إشعار / ملاحظة قانونية للموظف" className="min-h-[105px] w-full rounded-2xl border border-white/10 bg-slate-950/40 p-3 outline-none focus:border-amber-300" />
        <div className="mt-3 flex flex-wrap gap-2"><ActionButton onClick={() => notifyEmployee("audit")} icon={Bell} variant="ghost">تسجيل إشعار</ActionButton><ActionButton onClick={() => notifyEmployee("whatsapp")} icon={MessageCircle} variant="ghost">واتساب</ActionButton><ActionButton onClick={() => notifyEmployee("email")} icon={Mail} variant="ghost">إيميل</ActionButton></div>
      </Panel>
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ListPanel title="الجزاءات والخصومات" items={safeArray(emp.penalties)} empty="لا توجد جزاءات" icon={Gavel} />
      <ListPanel title="المكافآت والتقييم" items={safeArray(emp.rewards)} empty="لا توجد مكافآت" icon={Award} />
      <Panel title="الطباعة والمهام الخاصة" icon={Printer}>
        <div className="space-y-3">
          <ActionButton onClick={printProfile} icon={Printer} className="w-full">طباعة ملف الموظف الرسمي</ActionButton>
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.055] p-3"><input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="عنوان المهمة الخاصة" className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 outline-none" /><input type="datetime-local" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 outline-none" /><select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2"><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select><ActionButton onClick={createSpecialTask} icon={CheckSquare} className="w-full">إنشاء مهمة خاصة</ActionButton></div>
        </div>
      </Panel>
    </div>
  </div>;
}

function AuditPanel({ audit = [] }) {
  return <Panel title="سجل الحركة داخل قسم بداية الخير" icon={CalendarClock}><div className="max-h-72 space-y-2 overflow-y-auto">{audit.length ? audit.slice(0, 40).map((item, i) => <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><b>{item.action}</b><span className="text-xs text-slate-400">{item.at}</span></div><p className="mt-1 text-sm text-slate-300">{item.employee}</p>{item.note && <p className="mt-1 text-xs leading-6 text-slate-400">{String(item.note).slice(0, 260)}</p>}</div>) : <p className="text-slate-400">لا يوجد سجل حركة بعد.</p>}</div></Panel>;
}

function EmptyEmployee() {
  return <div className="rounded-[2rem] border border-white/10 bg-slate-950/65 p-8 text-center shadow-xl"><Users className="mx-auto mb-3 h-10 w-10 text-amber-300" /><h3 className="font-black">لا يوجد موظف محدد</h3><p className="mt-2 text-sm text-slate-400">أضف موظفاً جديداً أو اختر فرعاً يحتوي على موظفين.</p></div>;
}

function TemplatesPanel({ employees, selectedEmployee }) {
  const flatTemplates = templateGroups.flatMap((g) => g.items);
  const [templateName, setTemplateName] = useState(flatTemplates[0] || "عقد عمل شامل");
  const [employeeId, setEmployeeId] = useState(selectedEmployee?.id || employees?.[0]?.id || "");
  const [body, setBody] = useState(() => getBadayatTemplateBody(flatTemplates[0] || "عقد عمل شامل"));
  const employee = employees.find((e) => e.id === employeeId) || selectedEmployee || employees[0] || {};
  const branchName = employeeBranchName(employee.branchId);
  const rendered = useMemo(() => renderBadayatTemplate(body, employee, branchName), [body, employee, branchName]);

  useEffect(() => { setBody(getBadayatTemplateBody(templateName)); }, [templateName]);
  useEffect(() => { if (!employeeId && employees?.[0]?.id) setEmployeeId(employees[0].id); }, [employeeId, employees]);

  return <section className="grid grid-cols-1 gap-4 xl:grid-cols-[390px_1fr]">
    <aside className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-xl">
      <h2 className="mb-1 text-xl font-black">النماذج الشاملة</h2>
      <p className="mb-4 text-sm leading-7 text-slate-400">الهيدر ثابت على شكل العقد النهائي: شعار بداية الخير، اسم المعرض، العنوان، الفواصل، والتوقيعات.</p>
      <label className="mb-3 block"><span className="text-xs font-bold text-slate-400">الموظف</span><select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 outline-none">{employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></label>
      <div className="space-y-3">{templateGroups.map((group) => <div key={group.group} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3"><h3 className="mb-2 text-sm font-black text-amber-200">{group.group}</h3><div className="space-y-1">{group.items.map((item) => <button key={item} onClick={() => setTemplateName(item)} className={`w-full rounded-xl px-3 py-2 text-right text-sm transition ${templateName === item ? "bg-amber-400 text-slate-950 font-black shadow" : "hover:bg-white/10"}`}>{item}</button>)}</div></div>)}</div>
    </aside>
    <main className="space-y-4">
      <Panel title={`تحرير النموذج: ${templateName === "عقد عمل شامل" ? "عقد عمل مبدئي" : templateName}`} icon={FileText}>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[300px] w-full rounded-2xl border border-white/10 bg-slate-950/40 p-4 leading-8 outline-none focus:border-amber-300" />
        <div className="mt-3 flex flex-wrap gap-2"><ActionButton onClick={() => saveBadayatTemplateDraft(templateName, body)} icon={Save} variant="ghost">حفظ مسودة النموذج</ActionButton><ActionButton onClick={() => { resetBadayatTemplateDraft(templateName); setBody(getBadayatTemplateBody(templateName)); }} icon={RotateCcw} variant="ghost">استعادة الأصلي</ActionButton><ActionButton onClick={() => printBadayatDocument(templateName, rendered)} icon={Printer}>طباعة بالهيدر النهائي</ActionButton><ActionButton onClick={() => exportBadayatDocumentPdf(templateName, rendered)} icon={Download} variant="ghost">PDF مباشر</ActionButton></div>
      </Panel>
      <Panel title="معاينة نصية" icon={Sparkles}><div className="rounded-2xl border border-white/10 bg-white p-5 text-right text-slate-950 shadow-inner"><h2 className="mb-4 text-center text-2xl font-black">{templateName === "عقد عمل شامل" ? "عقد عمل مبدئي" : templateName}</h2><pre className="whitespace-pre-wrap font-[inherit] leading-9">{rendered}</pre></div></Panel>
      <Panel title="الحقول الذكية المتاحة" icon={ClipboardCheck}><div className="flex flex-wrap gap-2">{badayatTemplatePlaceholders.map((key) => <span key={key} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{`{{${key}}}`}</span>)}</div></Panel>
    </main>
  </section>;
}
