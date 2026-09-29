import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, CheckSquare, Clock, ShieldCheck, AlertTriangle, CalendarDays, CheckCircle2 } from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import ChoiceInput from "@/components/shared/ChoiceInput";
import DateSmartInput from "@/components/shared/DateSmartInput";
import ActionButtons from "@/components/shared/ActionButtons";
import { PageErrorState } from "@/components/app/AppStatusBar";
import { searchInFields } from "@/lib/search";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { createPageUrl } from "@/utils";

const TASK_TYPES = ["تقديم مستند", "مراجعة عقد", "رد على مذكرة", "تحضير جلسة", "متابعة موكل", "مهمة عامة"];
const PRIORITIES = ["عالية", "متوسطة", "منخفضة"];
const STATUSES = ["معلقة", "جارية", "مكتملة"];

const emptyForm = { title: "", description: "", case_id: "", case_title: "", client_id: "", client_name: "", task_type: "مهمة عامة", priority: "متوسطة", due_date: "", status: "معلقة", assigned_to: "" };

function clientDisplayName(client = {}) {
  return client.name_ar || client.full_name || client.name_en || "";
}

function caseChoiceLabel(item = {}) {
  const number = item.case_number ? `#${item.case_number} · ` : "";
  const client = item.client_name ? ` — ${item.client_name}` : "";
  return `${number}${item.title || "قضية"}${client}`;
}

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [taskRows, caseRows, clientRows] = await Promise.all([
        base44.entities.Task.list("-due_date", 5000),
        base44.entities.Case.list("-created_date", 5000),
        base44.entities.Client.list("full_name", 5000),
      ]);
      setTasks(Array.isArray(taskRows) ? taskRows : []);
      setCases(Array.isArray(caseRows) ? caseRows : []);
      setClients(Array.isArray(clientRows) ? clientRows : []);
    } catch (error) {
      setLoadError(error?.message || "تعذر تحميل المهام.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  usePageRefresh(loadData, ["tasks", "cases", "clients"]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (task) => { setEditing(task); setForm({ ...emptyForm, ...task, due_date: task.due_date?.slice(0, 16) || "" }); setShowDialog(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await base44.entities.Task.update(editing.id, form);
      else await base44.entities.Task.create(form);
      setShowDialog(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (task) => {
    await base44.entities.Task.update(task.id, { status: task.status === "مكتملة" ? "معلقة" : "مكتملة" });
    await loadData();
  };

  const handleCaseSelect = (value) => {
    const selected = cases.find((item) =>
      String(item.id) === String(value)
      || item.title === value
      || caseChoiceLabel(item) === value
    );
    if (!selected) {
      setForm((current) => ({ ...current, case_title: value, case_id: "", client_id: "" }));
      return;
    }
    const client = clients.find((item) => String(item.id) === String(selected.client_id));
    setForm((current) => ({
      ...current,
      case_id: selected.id,
      case_title: selected.title,
      client_id: selected.client_id || client?.id || "",
      client_name: client ? clientDisplayName(client) : (selected.client_name || current.client_name),
    }));
  };

  const clientLookup = useMemo(
    () => Object.fromEntries(clients.map((client) => [String(client.id), client])),
    [clients],
  );

  const filtered = useMemo(() => tasks.filter((task) => {
    const client = clientLookup[String(task.client_id || "")] || {};
    const searchable = {
      ...task,
      client_name_ar: client.name_ar || "",
      client_name_en: client.name_en || "",
      client_aliases: client.name_aliases || [],
    };
    const matchSearch = searchInFields(
      searchable,
      ["title", "description", "case_title", "client_name", "client_name_ar", "client_name_en", "client_aliases", "assigned_to", "task_type"],
      search,
    );
    const matchStatus = statusFilter === "الكل" || task.status === statusFilter;
    return matchSearch && matchStatus;
  }), [tasks, clientLookup, search, statusFilter]);

  const taskStats = useMemo(() => {
    const now = new Date();
    return {
      open: tasks.filter((task) => task.status !== "مكتملة").length,
      today: tasks.filter((task) => task.status !== "مكتملة" && task.due_date && isToday(new Date(task.due_date))).length,
      overdue: tasks.filter((task) => {
        if (task.status === "مكتملة" || !task.due_date) return false;
        const due = new Date(task.due_date);
        return isPast(due) && !isToday(due);
      }).length,
      completed: tasks.filter((task) => task.status === "مكتملة").length,
    };
  }, [tasks]);

  return (
    <div className="space-y-5">
      <PageHeader title="المهام" subtitle={`${filtered.length} مهمة ظاهرة من أصل ${tasks.length}`} action={<Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة مهمة</Button>} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ["مفتوحة", taskStats.open, CheckSquare, "text-primary"],
          ["اليوم", taskStats.today, CalendarDays, "text-cyan-500"],
          ["متأخرة", taskStats.overdue, AlertTriangle, "text-destructive"],
          ["مكتملة", taskStats.completed, CheckCircle2, "text-emerald-500"],
        ].map(([label, value, Icon, tone]) => (
          <Card key={label} className="p-4 border-primary/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center"><Icon className={`h-5 w-5 ${tone}`} /></div>
              <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-black">{value}</p></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في المهام..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-11" />
        </div>
        <ChoiceInput value={statusFilter} onChange={setStatusFilter} options={["الكل", ...STATUSES]} listId="task-status-filter" helper="" className="sm:w-40 h-11" />
      </div>

      {loadError && <PageErrorState message={loadError} onRetry={loadData} />}
      {!loadError && loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !loadError && filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="لا توجد مهام" description="ابدأ بإضافة أول مهمة" action={<Button onClick={openCreate}>إضافة مهمة</Button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map(task => {
            const dueDate = task.due_date ? new Date(task.due_date) : null;
            const overdue = dueDate && task.status !== "مكتملة" && isPast(dueDate) && !isToday(dueDate);
            return (
              <Card key={task.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(task)}>
                <div className="flex items-start gap-3">
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={task.status === "مكتملة"} onCheckedChange={() => toggleDone(task)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${task.status === 'مكتملة' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</h3>
                      <StatusBadge status={task.priority} isPriority />
                      <StatusBadge status={task.status} />
                    </div>
                    {task.case_title && <p className="text-sm text-muted-foreground mt-1">{task.case_title}</p>}
                    {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                  </div>
                  <div className="text-left shrink-0 flex flex-col items-end gap-2">
                    {dueDate && <p className={`text-xs flex items-center gap-1 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}><Clock className="h-3 w-3" />{format(dueDate, 'yyyy/MM/dd HH:mm')}</p>}
                    {task.task_type && <p className="text-xs text-muted-foreground">{task.task_type}</p>}
                    {task.client_id && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(createPageUrl("Client360") + `?id=${task.client_id}`);
                        }}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> ملف الموكل
                      </Button>
                    )}
                    <ActionButtons entityName="Task" record={task} onEdit={openEdit} onDeleted={loadData} size="sm" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل المهمة" : "إضافة مهمة"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 md:col-span-2"><Label>عنوان المهمة *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="h-11" /></div>
            <div className="space-y-1"><Label>نوع المهمة</Label><ChoiceInput value={form.task_type} onChange={v => setForm({...form, task_type: v})} options={TASK_TYPES} listId="task-types" /></div>
            <div className="space-y-1"><Label>الأولوية</Label><ChoiceInput value={form.priority} onChange={v => setForm({...form, priority: v})} options={PRIORITIES} listId="task-priority" /></div>
            <div className="space-y-1 md:col-span-2"><Label>الموعد النهائي *</Label><DateSmartInput type="datetime-local" value={form.due_date} onChange={v => setForm({...form, due_date: v})} /></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={v => setForm({...form, status: v})} options={STATUSES} listId="task-statuses" /></div>
            <div className="space-y-1"><Label>القضية المرتبطة</Label>
              <ChoiceInput value={form.case_title} onChange={handleCaseSelect} options={cases.map(caseChoiceLabel)} listId="cases-tasks" helper="ابحث برقم القضية أو عنوانها؛ يتم ربط الموكل تلقائيًا" />
            </div>
            <div className="space-y-1 md:col-span-2"><Label>وصف المهمة</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="min-h-[100px]" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.due_date} className="bg-primary text-white">
              {saving ? "جارٍ الحفظ..." : editing ? "حفظ" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
