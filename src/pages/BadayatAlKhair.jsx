import React, { useEffect, useMemo, useState } from "react";
import {
  Building2, Users, FileText, BriefcaseBusiness, ShieldCheck, Printer, ClipboardCheck,
  Wallet, Plus, Search, Save, Bell, Award, Gavel, Database, RotateCcw, Eye,
  Upload, MessageCircle, Mail, Download, KeyRound, CheckSquare
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

const PERMISSIONS_KEY = "helm_badayat_permissions_v1";
const TASKS_LOCAL_KEY = "helm_badayat_tasks_v1";
const STAFF_ROLES = new Set(["admin", "staff", "lawyer", "assistant", "secretary"]);

function money(v) { return `${Number(v || 0).toLocaleString()} د.إ`; }
function daysLeft(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}
function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch { return fallback; } }
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); return value; }
function normalizePhone(phone) { return String(phone || "").replace(/[^0-9]/g, ""); }
function todayDateTime() { return new Date(Date.now() + 86400000).toISOString().slice(0, 16); }
function getBadayatPermissions() { return readJson(PERMISSIONS_KEY, []); }
function saveBadayatPermissions(rows) { return writeJson(PERMISSIONS_KEY, rows); }
function canUser(user, action) {
  if (STAFF_ROLES.has(user?.role)) return true;
  const email = String(user?.email || "").toLowerCase();
  const row = getBadayatPermissions().find((p) => String(p.email || "").toLowerCase() === email);
  return Boolean(row?.[action]);
}

export default function BadayatAlKhair() {
  const { user } = useAuth();
  const [activeBranch, setActiveBranch] = useState("dubai_mother");
  const [state, setState] = useState({ employees: [], audit: [], source: "loading" });
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [actionAmount, setActionAmount] = useState(250);
  const [legalNote, setLegalNote] = useState("");
  const [taskForm, setTaskForm] = useState({ title: "", due_date: todayDateTime(), priority: "متوسطة" });
  const [isLoading, setIsLoading] = useState(true);
  const [syncSource, setSyncSource] = useState("loading");
  const [lastSaved, setLastSaved] = useState("");
  const [permissions, setPermissions] = useState(() => getBadayatPermissions());
  const [permForm, setPermForm] = useState({ email: "", name: "", canView: true, canEdit: false, canFinance: false, canPrint: true, canAdmin: false });

  const canView = canUser(user, "canView") || STAFF_ROLES.has(user?.role);
  const canEdit = canUser(user, "canEdit") || STAFF_ROLES.has(user?.role);
  const canFinance = canUser(user, "canFinance") || STAFF_ROLES.has(user?.role);
  const canPrint = canUser(user, "canPrint") || STAFF_ROLES.has(user?.role);
  const canAdmin = canUser(user, "canAdmin") || STAFF_ROLES.has(user?.role);

  useEffect(() => {
    let alive = true;
    loadBadayatState().then((next) => {
      if (!alive) return;
      const safeNext = { employees: next?.employees || [], audit: next?.audit || [], source: next?.source || "local" };
      setState(safeNext);
      setSyncSource(safeNext.source);
      setSelectedId(safeNext.employees?.[0]?.id || "");
      setIsLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const employees = state.employees || [];
  const branchEmployees = useMemo(() => {
    const s = query.trim().toLowerCase();
    return employees.filter((emp) => emp.branchId === activeBranch && (!s || `${emp.fullName} ${emp.phone} ${emp.jobTitle} ${emp.emiratesId}`.toLowerCase().includes(s)));
  }, [employees, activeBranch, query]);
  const selectedEmployee = employees.find((e) => e.id === selectedId) || branchEmployees[0] || employees[0];
  const activeBranchInfo = branches.find((b) => b.id === activeBranch) || branches[0];

  const stats = useMemo(() => {
    const relevant = activeBranch === "templates" ? employees : employees.filter((e) => e.branchId === activeBranch);
    const expiring = relevant.filter((e) => { const left = daysLeft(e.residencyExpiry); return left !== null && left <= 60; }).length;
    const penalties = relevant.reduce((sum, e) => sum + (e.penalties?.length || 0), 0);
    const rewards = relevant.reduce((sum, e) => sum + (e.rewards?.length || 0), 0);
    return { count: relevant.length, expiring, penalties, rewards };
  }, [employees, activeBranch]);

  const persistState = async (nextState, employeeToSave = null, auditEntry = null) => {
    saveBadayatLocal(nextState);
    if (auditEntry) saveBadayatAudit(auditEntry);
    if (employeeToSave) {
      const result = await saveBadayatEmployee(employeeToSave);
      setSyncSource(result?.source || "local");
    }
    setLastSaved(new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" }));
  };

  const patchEmployee = (patch, actionLabel = "تعديل بيانات") => {
    if (!selectedEmployee || !canEdit) return;
    const nextEmployee = { ...selectedEmployee, ...patch };
    const auditEntry = { at: new Date().toLocaleString("ar-AE"), employee: selectedEmployee.fullName, action: actionLabel, note: JSON.stringify(patch) };
    const nextState = { ...state, employees: employees.map((e) => (e.id === selectedEmployee.id ? nextEmployee : e)), audit: [auditEntry, ...(state.audit || [])].slice(0, 150) };
    setState(nextState);
    persistState(nextState, nextEmployee, auditEntry);
  };

  const addEmployee = () => {
    if (!canEdit) return;
    const branchId = activeBranch === "templates" ? "dubai_mother" : activeBranch;
    const emp = {
      id: `emp-${Date.now()}`, branchId, photo: "", fullName: "موظف جديد", nationality: "", emiratesId: "", passportNo: "", phone: "", email: "",
      jobTitle: "", department: "", workLocation: branches.find((b) => b.id === branchId)?.name || "", contractType: "دوام كامل",
      contractStart: "", contractEnd: "", basicSalary: 0, allowances: 0, deductions: 0, residencyStatus: "غير محدد", residencyExpiry: "",
      workPermitExpiry: "", passportHeldVoluntarily: "لا", penalties: [], rewards: [], rating: 70, notes: "",
    };
    const auditEntry = { at: new Date().toLocaleString("ar-AE"), employee: emp.fullName, action: "إضافة موظف", note: branches.find((b) => b.id === branchId)?.name || branchId };
    const nextState = { ...state, employees: [emp, ...employees], audit: [auditEntry, ...(state.audit || [])].slice(0, 150) };
    setState(nextState); setSelectedId(emp.id); persistState(nextState, emp, auditEntry);
  };

  const applyFinance = (type) => {
    if (!selectedEmployee || !canFinance) return;
    const amount = Number(actionAmount || 0); if (!amount) return;
    const patch = type === "allowance"
      ? { allowances: Number(selectedEmployee.allowances || 0) + amount, rewards: [{ date: new Date().toISOString().slice(0, 10), title: "علاوة / مكافأة", amount, note: "إضافة من الحسابات" }, ...(selectedEmployee.rewards || [])] }
      : { deductions: Number(selectedEmployee.deductions || 0) + amount, penalties: [{ date: new Date().toISOString().slice(0, 10), title: "خصم مالي", amount, note: "تطبيق خصم من الحسابات" }, ...(selectedEmployee.penalties || [])] };
    patchEmployee(patch, type === "allowance" ? "إضافة علاوة" : "تطبيق خصم");
  };

  const notifyEmployee = (mode = "audit") => {
    if (!selectedEmployee) return;
    const msg = legalNote || `إشعار إداري من شركة بداية الخير للسيد/ ${selectedEmployee.fullName}`;
    const auditEntry = { at: new Date().toLocaleString("ar-AE"), employee: selectedEmployee.fullName, action: mode === "whatsapp" ? "إشعار واتساب" : mode === "email" ? "إشعار بريد" : "إشعار موظف", note: msg };
    const nextState = { ...state, audit: [auditEntry, ...(state.audit || [])].slice(0, 150) };
    setState(nextState); persistState(nextState, selectedEmployee, auditEntry);
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
    if (!selectedEmployee || !taskForm.title) return;
    const task = {
      title: taskForm.title,
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
    notifyEmployee("audit");
    setTaskForm({ title: "", due_date: todayDateTime(), priority: "متوسطة" });
  };

  const addPermission = () => {
    if (!canAdmin || !permForm.email) return;
    const clean = { ...permForm, email: permForm.email.trim().toLowerCase() };
    const next = [clean, ...permissions.filter((p) => String(p.email).toLowerCase() !== clean.email)];
    setPermissions(next); saveBadayatPermissions(next); setPermForm({ email: "", name: "", canView: true, canEdit: false, canFinance: false, canPrint: true, canAdmin: false });
  };

  const grossSalary = Number(selectedEmployee?.basicSalary || 0) + Number(selectedEmployee?.allowances || 0) - Number(selectedEmployee?.deductions || 0);
  const residencyLeft = daysLeft(selectedEmployee?.residencyExpiry);

  if (isLoading) return <div dir="rtl" className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 text-slate-100">جارٍ تحميل قسم بداية الخير...</div>;
  if (!canView) return <div dir="rtl" className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-red-100">ليست لديك صلاحية دخول قسم بداية الخير.</div>;

  return (
    <div dir="rtl" className="space-y-6 text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-slate-950/70 p-6 shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,#f59e0b,transparent_35%),radial-gradient(circle_at_80%_10%,#38bdf8,transparent_28%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-amber-300 font-black text-sm">BADAYAT AL KHAIR CONTROL CENTER</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">قسم بداية الخير</h1>
            <p className="text-slate-300 mt-2 max-w-3xl leading-8">إدارة الفروع، الموظفين، الصور، الإقامات، العقود، الحسابات، المهام، الإشعارات، الصلاحيات، والنماذج الذكية القابلة للطباعة والتصدير PDF.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-black ${syncSource === "supabase" ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}><Database className="h-3.5 w-3.5" /> {syncSource === "supabase" ? "متصل بـ Supabase" : "حفظ محلي احتياطي"}</span>
              {lastSaved && <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">آخر حفظ: {lastSaved}</span>}
            </div>
          </div>
          <button onClick={addEmployee} disabled={!canEdit} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950 shadow-lg hover:bg-amber-300 disabled:opacity-40"><Plus className="h-4 w-4" /> إضافة موظف</button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {branches.map((branch) => <button key={branch.id} onClick={() => setActiveBranch(branch.id)} className={`rounded-3xl border p-4 text-right transition ${activeBranch === branch.id ? "border-amber-300 bg-white/10 shadow-xl" : "border-white/10 bg-white/5 hover:bg-white/10"}`}><div className={`mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br ${branch.color} flex items-center justify-center`}><Building2 className="h-6 w-6" /></div><h3 className="font-black text-sm leading-6">{branch.name}</h3><p className="text-xs text-slate-400 mt-1">{branch.type}</p></button>)}
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Users} label="الموظفون" value={stats.count} />
        <Stat icon={ShieldCheck} label="إقامات تحتاج متابعة خلال 60 يوم" value={stats.expiring} danger={stats.expiring > 0} />
        <Stat icon={Gavel} label="مؤشر الجزاءات" value={stats.penalties} />
        <Stat icon={Award} label="المكافآت والتقييم" value={stats.rewards} />
      </section>

      {canAdmin && <PermissionsPanel permissions={permissions} setPermissions={setPermissions} permForm={permForm} setPermForm={setPermForm} addPermission={addPermission} />}

      {activeBranch === "templates" ? (
        <TemplatesPanel employees={employees} selectedEmployee={selectedEmployee} canPrint={canPrint} canEdit={canEdit} />
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
          <aside className="rounded-3xl border border-white/10 bg-slate-950/65 p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 mb-4"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث عن موظف..." className="w-full bg-transparent outline-none text-sm" /></div>
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {branchEmployees.map((emp) => <button key={emp.id} onClick={() => setSelectedId(emp.id)} className={`w-full rounded-2xl border p-3 text-right ${selectedEmployee?.id === emp.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}><div className="flex items-center gap-3"><Avatar emp={emp} /><div className="min-w-0"><h4 className="font-black truncate">{emp.fullName}</h4><p className="text-xs text-slate-400 truncate">{emp.jobTitle || "بدون مسمى"} · {emp.residencyStatus}</p></div></div></button>)}
              {!branchEmployees.length && <p className="text-sm text-slate-400 text-center py-10">لا توجد بيانات موظفين داخل هذا الفرع.</p>}
            </div>
          </aside>
          {selectedEmployee && <EmployeeWorkspace emp={selectedEmployee} patchEmployee={patchEmployee} grossSalary={grossSalary} residencyLeft={residencyLeft} actionAmount={actionAmount} setActionAmount={setActionAmount} applyFinance={applyFinance} legalNote={legalNote} setLegalNote={setLegalNote} notifyEmployee={notifyEmployee} activeBranchInfo={activeBranchInfo} canEdit={canEdit} canFinance={canFinance} canPrint={canPrint} taskForm={taskForm} setTaskForm={setTaskForm} createSpecialTask={createSpecialTask} />}
        </section>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, danger }) { return <div className={`rounded-3xl border p-4 ${danger ? "border-red-400/40 bg-red-500/10" : "border-white/10 bg-white/5"}`}><Icon className="h-5 w-5 text-amber-300 mb-3" /><p className="text-2xl font-black">{value}</p><p className="text-xs text-slate-400 mt-1">{label}</p></div>; }
function Avatar({ emp }) { return <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-slate-800 flex items-center justify-center overflow-hidden shrink-0">{emp.photo ? <img src={emp.photo} alt={emp.fullName} className="h-full w-full object-cover" /> : <Users className="h-6 w-6 text-white" />}</div>; }
function Field({ label, value, onChange, type = "text", disabled = false }) { return <label className="block"><span className="text-xs text-slate-400 font-bold">{label}</span><input disabled={disabled} type={type} value={value || ""} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-amber-300 disabled:opacity-50" /></label>; }
function Panel({ title, icon: Icon, children }) { return <section className="rounded-3xl border border-white/10 bg-slate-950/65 p-5"><h3 className="flex items-center gap-2 text-lg font-black mb-4"><Icon className="h-5 w-5 text-amber-300" />{title}</h3>{children}</section>; }
function ListPanel({ title, items, empty }) { return <Panel title={title} icon={ClipboardCheck}>{items?.length ? <div className="space-y-2">{items.map((it, i) => <div key={i} className="rounded-2xl bg-white/5 p-3"><b>{it.title}</b><p className="text-xs text-slate-400 mt-1">{it.date} · {money(it.amount)}</p><p className="text-sm text-slate-300 mt-1">{it.note}</p></div>)}</div> : <p className="text-slate-400">{empty}</p>}</Panel>; }

function EmployeeWorkspace({ emp, patchEmployee, grossSalary, residencyLeft, actionAmount, setActionAmount, applyFinance, legalNote, setLegalNote, notifyEmployee, activeBranchInfo, canEdit, canFinance, canPrint, taskForm, setTaskForm, createSpecialTask }) {
  const handlePhotoUpload = (file) => {
    if (!file || !canEdit) return;
    const reader = new FileReader();
    reader.onload = () => patchEmployee({ photo: reader.result }, "رفع صورة الموظف");
    reader.readAsDataURL(file);
  };
  return <div className="space-y-4">
    <div className="rounded-3xl border border-white/10 bg-slate-950/65 p-5"><div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between"><div className="flex items-center gap-4"><Avatar emp={emp} /><div><p className="text-xs text-amber-300 font-black">{activeBranchInfo.name}</p><h2 className="text-2xl font-black">{emp.fullName}</h2><p className="text-slate-400">{emp.jobTitle} · {emp.department}</p></div></div><div className="grid grid-cols-2 gap-2 text-sm"><span className="rounded-xl bg-white/5 px-3 py-2">الصافي: <b>{money(grossSalary)}</b></span><span className={`rounded-xl px-3 py-2 ${residencyLeft !== null && residencyLeft <= 60 ? "bg-red-500/15 text-red-200" : "bg-emerald-500/10 text-emerald-200"}`}>الإقامة: {residencyLeft === null ? "غير محدد" : `${residencyLeft} يوم`}</span></div></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="بيانات الموظف كاملة" icon={Users}><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Field disabled={!canEdit} label="الاسم الكامل" value={emp.fullName} onChange={(v) => patchEmployee({ fullName: v })} /><Field disabled={!canEdit} label="الجنسية" value={emp.nationality} onChange={(v) => patchEmployee({ nationality: v })} /><Field disabled={!canEdit} label="رقم الهوية" value={emp.emiratesId} onChange={(v) => patchEmployee({ emiratesId: v })} /><Field disabled={!canEdit} label="رقم الجواز" value={emp.passportNo} onChange={(v) => patchEmployee({ passportNo: v })} /><Field disabled={!canEdit} label="الهاتف" value={emp.phone} onChange={(v) => patchEmployee({ phone: v })} /><Field disabled={!canEdit} label="البريد الإلكتروني" value={emp.email} onChange={(v) => patchEmployee({ email: v })} /><Field disabled={!canEdit} label="مكان العمل" value={emp.workLocation} onChange={(v) => patchEmployee({ workLocation: v })} /><label className="block"><span className="text-xs text-slate-400 font-bold">رفع صورة الموظف</span><input disabled={!canEdit} type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files?.[0])} className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm" /></label></div></Panel>
      <Panel title="الإقامة وعقد العمل" icon={ShieldCheck}><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Field disabled={!canEdit} label="حالة الإقامة" value={emp.residencyStatus} onChange={(v) => patchEmployee({ residencyStatus: v })} /><Field disabled={!canEdit} label="انتهاء الإقامة" type="date" value={emp.residencyExpiry} onChange={(v) => patchEmployee({ residencyExpiry: v })} /><Field disabled={!canEdit} label="انتهاء تصريح العمل" type="date" value={emp.workPermitExpiry} onChange={(v) => patchEmployee({ workPermitExpiry: v })} /><Field disabled={!canEdit} label="نوع العقد" value={emp.contractType} onChange={(v) => patchEmployee({ contractType: v })} /><Field disabled={!canEdit} label="بداية العقد" type="date" value={emp.contractStart} onChange={(v) => patchEmployee({ contractStart: v })} /><Field disabled={!canEdit} label="نهاية العقد" type="date" value={emp.contractEnd} onChange={(v) => patchEmployee({ contractEnd: v })} /><Field disabled={!canEdit} label="تسليم الجواز طواعية؟" value={emp.passportHeldVoluntarily} onChange={(v) => patchEmployee({ passportHeldVoluntarily: v })} /><Field disabled={!canEdit} label="التقييم" type="number" value={emp.rating} onChange={(v) => patchEmployee({ rating: v })} /></div></Panel>
      <Panel title="الحسابات - علاوة / خصم فقط" icon={Wallet}><div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4"><Field disabled={!canFinance} label="الراتب الأساسي" type="number" value={emp.basicSalary} onChange={(v) => patchEmployee({ basicSalary: v })} /><Field disabled={!canFinance} label="العلاوات" type="number" value={emp.allowances} onChange={(v) => patchEmployee({ allowances: v })} /><Field disabled={!canFinance} label="الخصومات" type="number" value={emp.deductions} onChange={(v) => patchEmployee({ deductions: v })} /></div><div className="flex flex-col md:flex-row gap-2"><input type="number" value={actionAmount} onChange={(e) => setActionAmount(e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none" /><button disabled={!canFinance} onClick={() => applyFinance("allowance")} className="rounded-2xl bg-emerald-500 px-4 py-2 font-black disabled:opacity-40">إضافة علاوة</button><button disabled={!canFinance} onClick={() => applyFinance("deduction")} className="rounded-2xl bg-red-500 px-4 py-2 font-black disabled:opacity-40">تطبيق خصم</button></div></Panel>
      <Panel title="الشؤون القانونية والإشعارات" icon={BriefcaseBusiness}><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3"><Field disabled={!canEdit} label="المسمى الوظيفي" value={emp.jobTitle} onChange={(v) => patchEmployee({ jobTitle: v })} /><Field disabled={!canEdit} label="القسم" value={emp.department} onChange={(v) => patchEmployee({ department: v })} /></div><textarea value={legalNote} onChange={(e) => setLegalNote(e.target.value)} placeholder="إشعار / ملاحظة قانونية للموظف" className="w-full min-h-[92px] rounded-2xl border border-white/10 bg-white/5 p-3 outline-none" /><div className="flex flex-wrap gap-2 mt-2"><button onClick={() => notifyEmployee("audit")} className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-2 font-black"><Bell className="h-4 w-4" /> تسجيل إشعار</button><button onClick={() => notifyEmployee("whatsapp")} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 font-black"><MessageCircle className="h-4 w-4" /> واتساب</button><button onClick={() => notifyEmployee("email")} className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-2 font-black"><Mail className="h-4 w-4" /> إيميل</button></div></Panel>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><ListPanel title="مؤشر الجزاءات السابقة" items={emp.penalties} empty="لا توجد جزاءات" /><ListPanel title="المكافآت والتقييم" items={emp.rewards} empty="لا توجد مكافآت" /><Panel title="المطبعة والمهام الخاصة" icon={Printer}><div className="space-y-2"><button disabled={!canPrint} onClick={() => window.print()} className="w-full rounded-2xl bg-white/10 px-4 py-3 font-black hover:bg-white/15 disabled:opacity-40">طباعة ملف الموظف</button><div className="rounded-2xl bg-white/5 p-3 space-y-2"><input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="عنوان المهمة الخاصة" className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 outline-none" /><input type="datetime-local" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 outline-none" /><select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2"><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select><button onClick={createSpecialTask} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 font-black text-slate-950"><CheckSquare className="h-4 w-4" /> إنشاء مهمة خاصة</button></div></div></Panel></div>
  </div>;
}

function TemplatesPanel({ employees = [], selectedEmployee, canPrint, canEdit }) {
  const allTemplateNames = templateGroups.flatMap((group) => group.items);
  const [templateName, setTemplateName] = useState(allTemplateNames[0] || "عقد عمل شامل");
  const [employeeId, setEmployeeId] = useState(selectedEmployee?.id || employees[0]?.id || "");
  const [body, setBody] = useState(() => getBadayatTemplateBody(templateName));
  const [savedAt, setSavedAt] = useState("");
  useEffect(() => { if (!employeeId && employees[0]?.id) setEmployeeId(employees[0].id); }, [employees, employeeId]);
  useEffect(() => { setBody(getBadayatTemplateBody(templateName)); }, [templateName]);
  const employee = employees.find((emp) => emp.id === employeeId) || selectedEmployee || employees[0] || {};
  const branchName = branches.find((branch) => branch.id === employee.branchId)?.name || "بداية الخير";
  const rendered = renderBadayatTemplate(body, employee, branchName);
  const handleSaveTemplate = () => { if (!canEdit) return; saveBadayatTemplateDraft(templateName, body); setSavedAt(new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" })); };
  const handleResetTemplate = () => { if (!canEdit) return; resetBadayatTemplateDraft(templateName); setBody(getBadayatTemplateBody(templateName)); setSavedAt(new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" })); };
  const insertPlaceholder = (key) => { if (!canEdit) return; setBody((current) => `${current}\n{{${key}}}`); };
  return <section className="rounded-3xl border border-white/10 bg-slate-950/65 p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between mb-5"><div><p className="text-amber-300 text-sm font-black">النماذج الشاملة الذكية</p><h2 className="text-2xl font-black mt-1">نماذج قابلة للتعديل وتولد مباشرة من بيانات الموظف</h2><p className="text-slate-400 mt-2 leading-7">اختار الموظف مرة واحدة ثم اختار النموذج، وسيتم سحب البيانات تلقائياً.</p>{savedAt && <p className="text-xs text-emerald-300 mt-2">تم حفظ قالب النموذج الساعة {savedAt}</p>}</div><FileText className="h-10 w-10 text-amber-300" /></div><div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4"><aside className="space-y-4"><div className="rounded-3xl border border-white/10 bg-white/5 p-4"><label className="block mb-3"><span className="text-xs text-slate-400 font-bold">الموظف</span><select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 outline-none">{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName} - {branches.find((b) => b.id === emp.branchId)?.name || emp.branchId}</option>)}</select></label><label className="block"><span className="text-xs text-slate-400 font-bold">النموذج</span><select value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 outline-none">{templateGroups.map((group) => <optgroup key={group.group} label={group.group}>{group.items.map((item) => <option key={item} value={item}>{item}</option>)}</optgroup>)}</select></label></div><div className="rounded-3xl border border-white/10 bg-white/5 p-4"><h3 className="font-black mb-3">حقول الدمج السريع</h3><div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto">{badayatTemplatePlaceholders.map((key) => <button key={key} onClick={() => insertPlaceholder(key)} className="rounded-xl bg-slate-950/70 px-2.5 py-1.5 text-xs text-amber-200 hover:bg-amber-400 hover:text-slate-950">{`{{${key}}}`}</button>)}</div></div><div className="grid grid-cols-1 gap-2"><button disabled={!canEdit} onClick={handleSaveTemplate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-black disabled:opacity-40"><Save className="h-4 w-4" /> حفظ تعديل النموذج</button><button disabled={!canEdit} onClick={handleResetTemplate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 font-black hover:bg-white/15 disabled:opacity-40"><RotateCcw className="h-4 w-4" /> استعادة الأصل</button><button disabled={!canPrint} onClick={() => printBadayatDocument(templateName, rendered)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 font-black text-slate-950 disabled:opacity-40"><Printer className="h-4 w-4" /> توليد وطباعة</button><button disabled={!canPrint} onClick={() => exportBadayatDocumentPdf(templateName, rendered)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 font-black text-white disabled:opacity-40"><Download className="h-4 w-4" /> تصدير PDF مباشر</button></div></aside><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="rounded-3xl border border-white/10 bg-white/5 p-4"><h3 className="flex items-center gap-2 font-black mb-3"><FileText className="h-5 w-5 text-amber-300" /> تحرير قالب النموذج</h3><textarea disabled={!canEdit} value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[620px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950/80 p-4 leading-8 outline-none focus:border-amber-300 disabled:opacity-60" /></div><div className="rounded-3xl border border-white/10 bg-white/5 p-4"><h3 className="flex items-center gap-2 font-black mb-3"><Eye className="h-5 w-5 text-amber-300" /> معاينة بعد سحب بيانات الموظف</h3><div className="min-h-[620px] whitespace-pre-wrap rounded-2xl border border-white/10 bg-white text-slate-950 p-6 leading-9 text-[15px] overflow-y-auto">{rendered}</div></div></div></div></section>;
}

function PermissionsPanel({ permissions, setPermissions, permForm, setPermForm, addPermission }) {
  const toggle = (email, key) => { const next = permissions.map((p) => p.email === email ? { ...p, [key]: !p[key] } : p); setPermissions(next); saveBadayatPermissions(next); };
  const remove = (email) => { const next = permissions.filter((p) => p.email !== email); setPermissions(next); saveBadayatPermissions(next); };
  const fields = [["canView", "عرض"], ["canEdit", "تعديل"], ["canFinance", "حسابات"], ["canPrint", "طباعة"], ["canAdmin", "إدارة"]];
  return <Panel title="صلاحيات تفصيلية لمستخدمي بداية الخير" icon={KeyRound}><div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4"><div className="rounded-2xl bg-white/5 p-4 space-y-3"><input value={permForm.name} onChange={(e) => setPermForm({ ...permForm, name: e.target.value })} placeholder="اسم المستخدم" className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2" /><input value={permForm.email} onChange={(e) => setPermForm({ ...permForm, email: e.target.value })} placeholder="البريد الإلكتروني" className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2" /><div className="flex flex-wrap gap-3">{fields.map(([key, label]) => <label key={key} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!permForm[key]} onChange={(e) => setPermForm({ ...permForm, [key]: e.target.checked })} /> {label}</label>)}</div><button onClick={addPermission} className="rounded-2xl bg-amber-400 px-4 py-2 font-black text-slate-950">حفظ الصلاحية</button></div><div className="space-y-2 max-h-72 overflow-auto">{permissions.map((p) => <div key={p.email} className="rounded-2xl bg-white/5 p-3"><div className="flex justify-between gap-2"><b>{p.name || p.email}</b><button onClick={() => remove(p.email)} className="text-red-300 text-xs">حذف</button></div><p className="text-xs text-slate-400">{p.email}</p><div className="flex flex-wrap gap-2 mt-2">{fields.map(([key, label]) => <button key={key} onClick={() => toggle(p.email, key)} className={`rounded-xl px-2 py-1 text-xs ${p[key] ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-slate-400"}`}>{label}</button>)}</div></div>)}{!permissions.length && <p className="text-slate-400">لا توجد صلاحيات مخصصة حتى الآن. أدوار admin/staff/lawyer لها صلاحية كاملة تلقائياً.</p>}</div></div></Panel>;
}
