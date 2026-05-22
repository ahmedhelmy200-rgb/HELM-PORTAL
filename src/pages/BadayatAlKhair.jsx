import React, { useEffect, useMemo, useState } from "react";
import { Building2, Users, FileText, BriefcaseBusiness, ShieldCheck, Printer, ClipboardCheck, Wallet, Plus, Search, Save, Bell, Award, Gavel, Database } from "lucide-react";
import {
  badayatBranches as branches,
  badayatTemplateGroups as templateGroups,
  loadBadayatState,
  saveBadayatLocal,
  saveBadayatEmployee,
  saveBadayatAudit,
} from "@/lib/badayatAlKhairStore";

function money(v) {
  return `${Number(v || 0).toLocaleString()} د.إ`;
}

function daysLeft(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export default function BadayatAlKhair() {
  const [activeBranch, setActiveBranch] = useState("dubai_mother");
  const [state, setState] = useState({ employees: [], audit: [], source: "loading" });
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [actionAmount, setActionAmount] = useState(250);
  const [legalNote, setLegalNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [syncSource, setSyncSource] = useState("loading");
  const [lastSaved, setLastSaved] = useState("");

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
    const expiring = relevant.filter((e) => {
      const left = daysLeft(e.residencyExpiry);
      return left !== null && left <= 60;
    }).length;
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
    if (!selectedEmployee) return;
    const nextEmployee = { ...selectedEmployee, ...patch };
    const auditEntry = {
      at: new Date().toLocaleString("ar-AE"),
      employee: selectedEmployee.fullName,
      action: actionLabel,
      note: JSON.stringify(patch),
    };
    const nextState = {
      ...state,
      employees: employees.map((e) => (e.id === selectedEmployee.id ? nextEmployee : e)),
      audit: [auditEntry, ...(state.audit || [])].slice(0, 100),
    };
    setState(nextState);
    persistState(nextState, nextEmployee, auditEntry);
  };

  const addEmployee = () => {
    const branchId = activeBranch === "templates" ? "dubai_mother" : activeBranch;
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
      workLocation: branches.find((b) => b.id === branchId)?.name || "",
      contractType: "دوام كامل",
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
    const auditEntry = { at: new Date().toLocaleString("ar-AE"), employee: emp.fullName, action: "إضافة موظف", note: branches.find((b) => b.id === branchId)?.name || branchId };
    const nextState = { ...state, employees: [emp, ...employees], audit: [auditEntry, ...(state.audit || [])].slice(0, 100) };
    setState(nextState);
    setSelectedId(emp.id);
    persistState(nextState, emp, auditEntry);
  };

  const applyFinance = (type) => {
    if (!selectedEmployee) return;
    const amount = Number(actionAmount || 0);
    if (!amount) return;
    const patch = type === "allowance"
      ? { allowances: Number(selectedEmployee.allowances || 0) + amount, rewards: [{ date: new Date().toISOString().slice(0, 10), title: "علاوة / مكافأة", amount, note: "إضافة من الحسابات" }, ...(selectedEmployee.rewards || [])] }
      : { deductions: Number(selectedEmployee.deductions || 0) + amount, penalties: [{ date: new Date().toISOString().slice(0, 10), title: "خصم مالي", amount, note: "تطبيق خصم من الحسابات" }, ...(selectedEmployee.penalties || [])] };
    patchEmployee(patch, type === "allowance" ? "إضافة علاوة" : "تطبيق خصم");
  };

  const notifyEmployee = () => {
    if (!selectedEmployee) return;
    const auditEntry = { at: new Date().toLocaleString("ar-AE"), employee: selectedEmployee.fullName, action: "إشعار موظف", note: legalNote || "تم إنشاء إشعار إداري" };
    const nextState = { ...state, audit: [auditEntry, ...(state.audit || [])].slice(0, 100) };
    setState(nextState);
    persistState(nextState, selectedEmployee, auditEntry);
    setLegalNote("");
  };

  const grossSalary = Number(selectedEmployee?.basicSalary || 0) + Number(selectedEmployee?.allowances || 0) - Number(selectedEmployee?.deductions || 0);
  const residencyLeft = daysLeft(selectedEmployee?.residencyExpiry);

  if (isLoading) {
    return <div dir="rtl" className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 text-slate-100">جارٍ تحميل قسم بداية الخير...</div>;
  }

  return (
    <div dir="rtl" className="space-y-6 text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-slate-950/70 p-6 shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,#f59e0b,transparent_35%),radial-gradient(circle_at_80%_10%,#38bdf8,transparent_28%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-amber-300 font-black text-sm">BADAYAT AL KHAIR CONTROL CENTER</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">قسم بداية الخير</h1>
            <p className="text-slate-300 mt-2 max-w-3xl leading-8">قسم مستقل لإدارة فروع بداية الخير، الموظفين، الإقامات، العقود، الجزاءات، المكافآت، الحسابات، الشؤون القانونية، المطبعة، المهام الخاصة، والنماذج الشاملة للعمال والموظفين.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-black ${syncSource === "supabase" ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
                <Database className="h-3.5 w-3.5" /> {syncSource === "supabase" ? "متصل بـ Supabase" : "حفظ محلي احتياطي"}
              </span>
              {lastSaved && <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">آخر حفظ: {lastSaved}</span>}
            </div>
          </div>
          <button onClick={addEmployee} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950 shadow-lg hover:bg-amber-300">
            <Plus className="h-4 w-4" /> إضافة موظف
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {branches.map((branch) => (
          <button key={branch.id} onClick={() => setActiveBranch(branch.id)} className={`rounded-3xl border p-4 text-right transition ${activeBranch === branch.id ? "border-amber-300 bg-white/12 shadow-xl" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
            <div className={`mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br ${branch.color} flex items-center justify-center`}><Building2 className="h-6 w-6" /></div>
            <h3 className="font-black text-sm leading-6">{branch.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{branch.type}</p>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Users} label="الموظفون" value={stats.count} />
        <Stat icon={ShieldCheck} label="إقامات تحتاج متابعة خلال 60 يوم" value={stats.expiring} danger={stats.expiring > 0} />
        <Stat icon={Gavel} label="مؤشر الجزاءات" value={stats.penalties} />
        <Stat icon={Award} label="المكافآت والتقييم" value={stats.rewards} />
      </section>

      {activeBranch === "templates" ? (
        <TemplatesPanel />
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
          <aside className="rounded-3xl border border-white/10 bg-slate-950/65 p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 mb-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث عن موظف..." className="w-full bg-transparent outline-none text-sm" />
            </div>
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {branchEmployees.map((emp) => (
                <button key={emp.id} onClick={() => setSelectedId(emp.id)} className={`w-full rounded-2xl border p-3 text-right ${selectedEmployee?.id === emp.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <div className="flex items-center gap-3">
                    <Avatar emp={emp} />
                    <div className="min-w-0">
                      <h4 className="font-black truncate">{emp.fullName}</h4>
                      <p className="text-xs text-slate-400 truncate">{emp.jobTitle || "بدون مسمى"} · {emp.residencyStatus}</p>
                    </div>
                  </div>
                </button>
              ))}
              {!branchEmployees.length && <p className="text-sm text-slate-400 text-center py-10">لا توجد بيانات موظفين داخل هذا الفرع.</p>}
            </div>
          </aside>

          {selectedEmployee && <EmployeeWorkspace emp={selectedEmployee} patchEmployee={patchEmployee} grossSalary={grossSalary} residencyLeft={residencyLeft} actionAmount={actionAmount} setActionAmount={setActionAmount} applyFinance={applyFinance} legalNote={legalNote} setLegalNote={setLegalNote} notifyEmployee={notifyEmployee} activeBranchInfo={activeBranchInfo} />}
        </section>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, danger }) {
  return <div className={`rounded-3xl border p-4 ${danger ? "border-red-400/40 bg-red-500/10" : "border-white/10 bg-white/5"}`}><Icon className="h-5 w-5 text-amber-300 mb-3" /><p className="text-2xl font-black">{value}</p><p className="text-xs text-slate-400 mt-1">{label}</p></div>;
}

function Avatar({ emp }) {
  return <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-slate-800 flex items-center justify-center overflow-hidden shrink-0">{emp.photo ? <img src={emp.photo} alt={emp.fullName} className="h-full w-full object-cover" /> : <Users className="h-6 w-6 text-white" />}</div>;
}

function Field({ label, value, onChange, type = "text" }) {
  return <label className="block"><span className="text-xs text-slate-400 font-bold">{label}</span><input type={type} value={value || ""} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-amber-300" /></label>;
}

function EmployeeWorkspace({ emp, patchEmployee, grossSalary, residencyLeft, actionAmount, setActionAmount, applyFinance, legalNote, setLegalNote, notifyEmployee, activeBranchInfo }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-slate-950/65 p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
          <div className="flex items-center gap-4"><Avatar emp={emp} /><div><p className="text-xs text-amber-300 font-black">{activeBranchInfo.name}</p><h2 className="text-2xl font-black">{emp.fullName}</h2><p className="text-slate-400">{emp.jobTitle} · {emp.department}</p></div></div>
          <div className="grid grid-cols-2 gap-2 text-sm"><span className="rounded-xl bg-white/5 px-3 py-2">الصافي: <b>{money(grossSalary)}</b></span><span className={`rounded-xl px-3 py-2 ${residencyLeft !== null && residencyLeft <= 60 ? "bg-red-500/15 text-red-200" : "bg-emerald-500/10 text-emerald-200"}`}>الإقامة: {residencyLeft === null ? "غير محدد" : `${residencyLeft} يوم`}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="بيانات الموظف كاملة" icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="الاسم الكامل" value={emp.fullName} onChange={(v) => patchEmployee({ fullName: v })} />
            <Field label="الجنسية" value={emp.nationality} onChange={(v) => patchEmployee({ nationality: v })} />
            <Field label="رقم الهوية" value={emp.emiratesId} onChange={(v) => patchEmployee({ emiratesId: v })} />
            <Field label="رقم الجواز" value={emp.passportNo} onChange={(v) => patchEmployee({ passportNo: v })} />
            <Field label="الهاتف" value={emp.phone} onChange={(v) => patchEmployee({ phone: v })} />
            <Field label="البريد الإلكتروني" value={emp.email} onChange={(v) => patchEmployee({ email: v })} />
            <Field label="رابط الصورة الشخصية" value={emp.photo} onChange={(v) => patchEmployee({ photo: v })} />
            <Field label="مكان العمل" value={emp.workLocation} onChange={(v) => patchEmployee({ workLocation: v })} />
          </div>
        </Panel>

        <Panel title="الإقامة وعقد العمل" icon={ShieldCheck}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="حالة الإقامة" value={emp.residencyStatus} onChange={(v) => patchEmployee({ residencyStatus: v })} />
            <Field label="انتهاء الإقامة" type="date" value={emp.residencyExpiry} onChange={(v) => patchEmployee({ residencyExpiry: v })} />
            <Field label="انتهاء تصريح العمل" type="date" value={emp.workPermitExpiry} onChange={(v) => patchEmployee({ workPermitExpiry: v })} />
            <Field label="نوع العقد" value={emp.contractType} onChange={(v) => patchEmployee({ contractType: v })} />
            <Field label="بداية العقد" type="date" value={emp.contractStart} onChange={(v) => patchEmployee({ contractStart: v })} />
            <Field label="نهاية العقد" type="date" value={emp.contractEnd} onChange={(v) => patchEmployee({ contractEnd: v })} />
            <Field label="تسليم الجواز طواعية؟" value={emp.passportHeldVoluntarily} onChange={(v) => patchEmployee({ passportHeldVoluntarily: v })} />
            <Field label="التقييم" type="number" value={emp.rating} onChange={(v) => patchEmployee({ rating: v })} />
          </div>
        </Panel>

        <Panel title="الحسابات - علاوة / خصم فقط" icon={Wallet}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Field label="الراتب الأساسي" type="number" value={emp.basicSalary} onChange={(v) => patchEmployee({ basicSalary: v })} />
            <Field label="العلاوات" type="number" value={emp.allowances} onChange={(v) => patchEmployee({ allowances: v })} />
            <Field label="الخصومات" type="number" value={emp.deductions} onChange={(v) => patchEmployee({ deductions: v })} />
          </div>
          <div className="flex flex-col md:flex-row gap-2"><input type="number" value={actionAmount} onChange={(e) => setActionAmount(e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 outline-none" /><button onClick={() => applyFinance("allowance")} className="rounded-2xl bg-emerald-500 px-4 py-2 font-black">إضافة علاوة</button><button onClick={() => applyFinance("deduction")} className="rounded-2xl bg-red-500 px-4 py-2 font-black">تطبيق خصم</button></div>
        </Panel>

        <Panel title="الشؤون القانونية والتحكم" icon={BriefcaseBusiness}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3"><Field label="المسمى الوظيفي" value={emp.jobTitle} onChange={(v) => patchEmployee({ jobTitle: v })} /><Field label="القسم" value={emp.department} onChange={(v) => patchEmployee({ department: v })} /></div>
          <textarea value={legalNote} onChange={(e) => setLegalNote(e.target.value)} placeholder="إشعار / ملاحظة قانونية للموظف" className="w-full min-h-[92px] rounded-2xl border border-white/10 bg-white/5 p-3 outline-none" />
          <div className="flex gap-2 mt-2"><button onClick={notifyEmployee} className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-2 font-black"><Bell className="h-4 w-4" /> إشعار الموظف</button><button onClick={() => patchEmployee({ jobTitle: `${emp.jobTitle || "موظف"} - تمت ترقيته` }, "ترقية / تعديل مسمى")} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 font-black text-slate-950"><Save className="h-4 w-4" /> ترقية / تعديل</button></div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ListPanel title="مؤشر الجزاءات السابقة" items={emp.penalties} empty="لا توجد جزاءات" />
        <ListPanel title="المكافآت والتقييم" items={emp.rewards} empty="لا توجد مكافآت" />
        <Panel title="المطبعة والمهام الخاصة" icon={Printer}><div className="space-y-2"><button onClick={() => window.print()} className="w-full rounded-2xl bg-white/10 px-4 py-3 font-black hover:bg-white/15">طباعة ملف الموظف</button><button className="w-full rounded-2xl bg-white/10 px-4 py-3 font-black hover:bg-white/15">إنشاء مهمة خاصة</button><p className="text-sm text-slate-400 leading-7">يتم استخدام هذا الجزء لطباعة النماذج أو إنشاء مهمة مرتبطة بالموظف والفرع.</p></div></Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return <section className="rounded-3xl border border-white/10 bg-slate-950/65 p-5"><h3 className="flex items-center gap-2 text-lg font-black mb-4"><Icon className="h-5 w-5 text-amber-300" />{title}</h3>{children}</section>;
}

function ListPanel({ title, items, empty }) {
  return <Panel title={title} icon={ClipboardCheck}>{items?.length ? <div className="space-y-2">{items.map((it, i) => <div key={i} className="rounded-2xl bg-white/5 p-3"><b>{it.title}</b><p className="text-xs text-slate-400 mt-1">{it.date} · {money(it.amount)}</p><p className="text-sm text-slate-300 mt-1">{it.note}</p></div>)}</div> : <p className="text-slate-400">{empty}</p>}</Panel>;
}

function TemplatesPanel() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/65 p-5">
      <div className="flex items-start justify-between gap-3 mb-5"><div><p className="text-amber-300 text-sm font-black">النماذج الشاملة</p><h2 className="text-2xl font-black mt-1">نماذج العمال والموظفين</h2><p className="text-slate-400 mt-2">قائمة مركزية للنماذج المطلوب تجهيزها وطباعتها وربطها لاحقاً بملف كل موظف.</p></div><FileText className="h-10 w-10 text-amber-300" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {templateGroups.map((group) => <div key={group.group} className="rounded-3xl border border-white/10 bg-white/5 p-4"><h3 className="font-black text-lg mb-3">{group.group}</h3><div className="space-y-2">{group.items.map((item) => <div key={item} className="rounded-2xl bg-slate-950/50 px-3 py-2 text-sm flex items-center justify-between gap-2"><span>{item}</span><button onClick={() => window.print()} className="text-amber-300 font-black text-xs">طباعة</button></div>)}</div></div>)}
      </div>
    </section>
  );
}
