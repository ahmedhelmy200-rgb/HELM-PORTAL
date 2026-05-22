import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Wallet, TrendingDown, Calendar, Edit, Trash2, Receipt, Filter, Tag, Database } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, isValid } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import EmptyState from "../components/helm/EmptyState";
import { PageErrorState } from "@/components/app/AppStatusBar";

const EXPENSES_LOCAL_KEY = "helm_expenses_local_fallback_v2";
const CATEGORIES = ["رسوم قضائية", "مواصلات", "طباعة ومستلزمات", "رسوم تسجيل", "أتعاب خبراء", "إيجار", "رواتب", "اتصالات", "أخرى"];
const PAYMENT_METHODS = ["نقداً", "تحويل بنكي", "شيك", "بطاقة ائتمان", "أخرى"];
const STATUSES = ["مدفوع", "معلق", "ملغى"];

const CATEGORY_COLORS = {
  "رسوم قضائية": "bg-red-100 text-red-800 border-red-200",
  "مواصلات": "bg-blue-100 text-blue-800 border-blue-200",
  "طباعة ومستلزمات": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "رسوم تسجيل": "bg-purple-100 text-purple-800 border-purple-200",
  "أتعاب خبراء": "bg-orange-100 text-orange-800 border-orange-200",
  "إيجار": "bg-teal-100 text-teal-800 border-teal-200",
  "رواتب": "bg-green-100 text-green-800 border-green-200",
  "اتصالات": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "أخرى": "bg-gray-100 text-gray-800 border-gray-200",
};

const CATEGORY_ICONS = {
  "رسوم قضائية": "⚖️",
  "مواصلات": "🚗",
  "طباعة ومستلزمات": "🖨️",
  "رسوم تسجيل": "📋",
  "أتعاب خبراء": "👨‍💼",
  "إيجار": "🏢",
  "رواتب": "💼",
  "اتصالات": "📞",
  "أخرى": "📌",
};

const emptyForm = {
  title: "",
  amount: "",
  category: "أخرى",
  expense_date: format(new Date(), "yyyy-MM-dd"),
  case_title: "",
  client_name: "",
  payment_method: "نقداً",
  notes: "",
  is_billable: false,
  status: "مدفوع",
};

function readLocalExpenses() {
  try {
    const rows = JSON.parse(localStorage.getItem(EXPENSES_LOCAL_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeLocalExpenses(rows) {
  localStorage.setItem(EXPENSES_LOCAL_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
}

function normalizeExpense(row = {}) {
  return {
    id: row.id || `expense-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: row.title || row.description || "مصروف بدون وصف",
    amount: Number(row.amount || 0),
    category: CATEGORIES.includes(row.category) ? row.category : "أخرى",
    expense_date: row.expense_date || row.date || format(new Date(), "yyyy-MM-dd"),
    case_title: row.case_title || "",
    client_name: row.client_name || "",
    payment_method: row.payment_method || "نقداً",
    notes: row.notes || "",
    is_billable: Boolean(row.is_billable),
    status: STATUSES.includes(row.status) ? row.status : "مدفوع",
    created_date: row.created_date || row.created_at || new Date().toISOString(),
    updated_date: row.updated_date || new Date().toISOString(),
  };
}

function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isValid(d) ? d : null;
}

function money(value) {
  return Number(value || 0).toLocaleString("ar-AE", { maximumFractionDigits: 2 });
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [source, setSource] = useState("loading");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const rows = await base44.entities.Expense.list("-expense_date");
      const normalized = (Array.isArray(rows) ? rows : []).map(normalizeExpense);
      setExpenses(normalized);
      setSource("supabase");
      if (normalized.length) writeLocalExpenses(normalized);
    } catch (error) {
      const local = readLocalExpenses().map(normalizeExpense);
      setExpenses(local);
      setSource("local");
      setLoadError("تعذر تحميل المصاريف من قاعدة البيانات، وتم تشغيل الحفظ المحلي الاحتياطي مؤقتاً.");
      console.warn("[Expenses] using local fallback:", error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  const persistLocalMirror = (rows) => {
    const normalized = rows.map(normalizeExpense);
    setExpenses(normalized);
    writeLocalExpenses(normalized);
  };

  const handleSave = async () => {
    if (!form.title || !form.amount) return;
    setSaving(true);
    setLoadError("");
    const payload = normalizeExpense({
      ...form,
      id: editing?.id || form.id,
      amount: parseFloat(form.amount) || 0,
      updated_date: new Date().toISOString(),
    });

    const nextRows = editing
      ? expenses.map((item) => item.id === editing.id ? payload : item)
      : [payload, ...expenses];

    try {
      if (editing && !String(editing.id || "").startsWith("expense-")) await base44.entities.Expense.update(editing.id, payload);
      else await base44.entities.Expense.create(payload);
      setSource("supabase");
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await loadExpenses();
    } catch (error) {
      persistLocalMirror(nextRows);
      setSource("local");
      setLoadError("تم حفظ المصروف محلياً لأن قاعدة البيانات غير متاحة حالياً.");
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      console.warn("[Expenses] save fallback:", error?.message || error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    const safe = normalizeExpense(expense);
    setEditing(safe);
    setForm({ ...emptyForm, ...safe, amount: String(safe.amount || "") });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, expense_date: format(new Date(), "yyyy-MM-dd") });
    setShowForm(true);
  };

  const handleDelete = async (expense) => {
    if (!window.confirm("حذف هذا المصروف؟")) return;
    const nextRows = expenses.filter((item) => item.id !== expense.id);
    try {
      if (!String(expense.id || "").startsWith("expense-")) await base44.entities.Expense.delete(expense.id);
      setSource("supabase");
      await loadExpenses();
    } catch (error) {
      persistLocalMirror(nextRows);
      setSource("local");
      setLoadError("تم حذف المصروف محلياً لأن قاعدة البيانات غير متاحة حالياً.");
      console.warn("[Expenses] delete fallback:", error?.message || error);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((expense) => {
      const matchSearch = !q || `${expense.title} ${expense.client_name} ${expense.case_title} ${expense.notes}`.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "الكل" || expense.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [expenses, search, categoryFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const totalAll = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalMonth = expenses.filter((e) => {
      const d = safeDate(e.expense_date);
      return d && isWithinInterval(d, { start: monthStart, end: monthEnd });
    }).reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalBillable = expenses.filter((e) => e.is_billable).reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalPending = expenses.filter((e) => e.status === "معلق").reduce((s, e) => s + Number(e.amount || 0), 0);
    return { totalAll, totalMonth, totalBillable, totalPending };
  }, [expenses]);

  const categoryTotals = useMemo(() => CATEGORIES.map((cat) => {
    const rows = expenses.filter((e) => e.category === cat);
    return { name: cat, total: rows.reduce((s, e) => s + Number(e.amount || 0), 0), count: rows.length };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total), [expenses]);

  return (
    <div dir="rtl" className="space-y-5">
      <PageHeader
        title="المصاريف"
        subtitle={`${expenses.length} مصروف · إجمالي ${money(stats.totalAll)} د.إ`}
        action={<Button onClick={handleCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" /> إضافة مصروف</Button>}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-black ${source === "supabase" ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
          <Database className="h-3.5 w-3.5" /> {source === "supabase" ? "متصل بقاعدة البيانات" : source === "loading" ? "جارٍ الفحص" : "حفظ محلي احتياطي"}
        </span>
      </div>

      {loadError && <PageErrorState message={loadError} onRetry={loadExpenses} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingDown} color="red" title="إجمالي المصاريف" value={stats.totalAll} />
        <StatCard icon={Calendar} color="blue" title="هذا الشهر" value={stats.totalMonth} />
        <StatCard icon={Receipt} color="green" title="قابلة للفوترة" value={stats.totalBillable} />
        <StatCard icon={Wallet} color="yellow" title="معلقة" value={stats.totalPending} />
      </div>

      {categoryTotals.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> توزيع المصاريف حسب الفئة</h3>
          <div className="flex flex-wrap gap-2">
            {categoryTotals.map((item) => (
              <button key={item.name} onClick={() => setCategoryFilter(categoryFilter === item.name ? "الكل" : item.name)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${categoryFilter === item.name ? "bg-primary text-white border-primary" : "bg-background border-border hover:border-primary/50"}`}>
                <span>{CATEGORY_ICONS[item.name] || "📌"}</span><span>{item.name}</span><span>{money(item.total)}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في المصاريف..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
        {categoryFilter !== "الكل" && <Button variant="outline" onClick={() => setCategoryFilter("الكل")} className="gap-2 text-xs"><Filter className="h-3 w-3" /> {categoryFilter} × إلغاء</Button>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="لا توجد مصاريف" description="ابدأ بتسجيل مصاريف المكتب والقضايا" action={<Button onClick={handleCreate}>إضافة مصروف</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((expense) => <ExpenseCard key={expense.id} expense={expense} onEdit={handleEdit} onDelete={handleDelete} />)}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />{editing ? "تعديل المصروف" : "إضافة مصروف جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label>وصف المصروف *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="مثال: رسوم تقديم دعوى" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>المبلغ (د.إ) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
              <div className="space-y-1.5"><Label>تاريخ المصروف *</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>التصنيف</Label><Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>طريقة الدفع</Label><Select value={form.payment_method} onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>القضية</Label><Input value={form.case_title} onChange={(e) => setForm((f) => ({ ...f, case_title: e.target.value }))} placeholder="اختياري" /></div>
              <div className="space-y-1.5"><Label>الموكل</Label><Input value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} placeholder="اختياري" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>الحالة</Label><Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5 pt-6"><label className="flex items-center gap-2 text-sm text-foreground cursor-pointer"><input type="checkbox" checked={Boolean(form.is_billable)} onChange={(e) => setForm((f) => ({ ...f, is_billable: e.target.checked }))} className="h-4 w-4 accent-primary" /> قابل للفوترة للموكل</label></div>
            </div>
            <div className="space-y-1.5"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="أي ملاحظات إضافية..." className="h-20" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.amount} className="bg-primary text-white">{saving ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة المصروف"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  const classes = {
    red: "border-l-red-500 text-red-600 bg-red-50",
    blue: "border-l-blue-500 text-blue-600 bg-blue-50",
    green: "border-l-green-500 text-green-600 bg-green-50",
    yellow: "border-l-yellow-500 text-yellow-600 bg-yellow-50",
  };
  const [border, text, bg] = (classes[color] || classes.blue).split(" ");
  return <Card className={`p-4 border-l-4 ${border}`}><div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}><Icon className={`h-5 w-5 ${text}`} /></div><div><p className="text-xs text-muted-foreground">{title}</p><p className={`text-lg font-bold ${text}`}>{money(value)} <span className="text-xs font-normal text-muted-foreground">د.إ</span></p></div></div></Card>;
}

function ExpenseCard({ expense, onEdit, onDelete }) {
  const d = safeDate(expense.expense_date);
  return (
    <Card className="p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0 text-xl">{CATEGORY_ICONS[expense.category] || "📌"}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground leading-tight">{expense.title}</h3>
            {expense.case_title && <p className="text-xs text-muted-foreground mt-0.5">⚖️ {expense.case_title}</p>}
            {expense.client_name && <p className="text-xs text-muted-foreground">👤 {expense.client_name}</p>}
            <div className="flex items-center gap-2 mt-1 flex-wrap"><span className="text-xs text-muted-foreground">📅 {d ? format(d, "yyyy/MM/dd") : "بدون تاريخ"}</span>{expense.payment_method && <span className="text-xs text-muted-foreground">· {expense.payment_method}</span>}</div>
          </div>
        </div>
        <div className="text-left shrink-0 space-y-1"><p className="text-xl font-bold text-red-600">{money(expense.amount)}</p><p className="text-xs text-muted-foreground text-left">د.إ</p><Badge className={`text-xs border ${expense.status === "مدفوع" ? "bg-green-100 text-green-800 border-green-200" : expense.status === "معلق" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-gray-100 text-gray-800 border-gray-200"}`}>{expense.status}</Badge></div>
      </div>
      <div className="flex items-center gap-2 mb-3"><Badge className={`text-xs border ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS["أخرى"]}`}>{expense.category}</Badge>{expense.is_billable && <Badge className="text-xs bg-primary/10 text-primary border border-primary/20">💰 قابل للفوترة</Badge>}</div>
      {expense.notes && <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mb-3 leading-relaxed">{expense.notes}</p>}
      <div className="flex items-center gap-2 pt-3 border-t border-border"><Button variant="outline" size="sm" onClick={() => onEdit(expense)} className="gap-1 text-xs flex-1"><Edit className="h-3 w-3" /> تعديل</Button><Button variant="outline" size="sm" onClick={() => onDelete(expense)} className="gap-1 text-xs text-red-600 hover:text-red-700"><Trash2 className="h-3 w-3" /> حذف</Button></div>
    </Card>
  );
}
