import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Briefcase, Calendar, Trophy } from "lucide-react";
import ActionButtons from "@/components/shared/ActionButtons";
import { format, isValid } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import ChoiceInput from "@/components/shared/ChoiceInput";
import DateSmartInput from "@/components/shared/DateSmartInput";
import { PageErrorState } from "@/components/app/AppStatusBar";
import PaginationControls from "@/components/shared/PaginationControls";
import { searchInFields } from "@/lib/search";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CASE_RESULTS, defaultCaseSuccessPercentage } from "@/lib/dataIntegrity";

const CASE_TYPES = ["مدني", "جزائي", "تجاري", "عمالي", "أسري", "إداري", "عقاري", "أخرى"];
const STATUSES = ["جارية", "متوقفة", "مكتملة", "مغلقة"];
const PRIORITIES = ["عالية", "متوسطة", "منخفضة"];
const SORT_OPTIONS = {
  "الأحدث": "-created_date",
  "العنوان": "title",
  "رقم القضية": "case_number",
  "أقرب جلسة": "next_session_date",
};

const emptyForm = {
  case_number: "",
  title: "",
  client_id: null,
  client_name: "",
  case_type: "مدني",
  court: "",
  judge: "",
  status: "جارية",
  priority: "متوسطة",
  next_session_date: "",
  filing_date: "",
  description: "",
  fees: "",
  paid_amount: "",
  assigned_lawyer: "",
  opponent_name: "",
  opponent_lawyer: "",
  case_result: "غير محسومة",
  success_percentage: "",
  result_notes: "",
};

function stripLegacyBrokerFields(value = {}) {
  const {
    broker_id,
    broker_name,
    broker_commission_percent,
    broker_commission_amount,
    ...rest
  } = value || {};
  return rest;
}

function resultTone(value) {
  if (value === "حكم لصالح الموكل" || value === "تسوية لصالح الموكل") return "bg-emerald-100 text-emerald-800";
  if (value === "نجاح جزئي") return "bg-amber-100 text-amber-800";
  if (value === "حكم ضد الموكل") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}

export default function Cases() {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [sortBy, setSortBy] = useState("-created_date");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formTab, setFormTab] = useState("core");
  const searchRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [{ data: caseRows, total: totalRows }, clientRows] = await Promise.all([
        base44.entities.Case.listPage(sortBy, { page, pageSize }),
        base44.entities.Client.list("full_name", 2000),
      ]);
      setCases(caseRows || []);
      setClients(clientRows || []);
      setTotal(totalRows || 0);
    } catch (error) {
      setLoadError(error.message || "تعذر تحميل القضايا.");
    } finally {
      setLoading(false);
    }
  }, [page, sortBy]);

  useEffect(() => { loadData(); }, [loadData]);
  usePageRefresh(loadData, ["cases", "clients"]);

  useEffect(() => {
    const offNew = subscribeAppEvent(APP_SHORTCUT_NEW, ({ page: currentPage }) => {
      if (!isClient && currentPage === "Cases") openCreate();
    });
    const offSearch = subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page: currentPage }) => {
      if (currentPage === "Cases") searchRef.current?.focus();
    });
    return () => { offNew(); offSearch(); };
  }, [isClient]);

  const applyClient = (name) => {
    const selected = clients.find((client) => client.full_name === name || client.id === name);
    setForm((previous) => ({
      ...previous,
      client_id: selected?.id || null,
      client_name: selected?.full_name || name,
    }));
  };

  const applyResult = (result) => {
    const suggested = defaultCaseSuccessPercentage(result);
    setForm((previous) => ({
      ...previous,
      case_result: result,
      success_percentage: suggested === null ? "" : String(suggested),
      status: result !== "غير محسومة" && previous.status === "جارية" ? "مكتملة" : previous.status,
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormTab("core");
    setShowDialog(true);
  };

  const openEdit = (item) => {
    const cleanItem = stripLegacyBrokerFields(item);
    setEditing(item);
    setForm({
      ...emptyForm,
      ...cleanItem,
      fees: cleanItem.fees || "",
      paid_amount: cleanItem.paid_amount || "",
      case_result: cleanItem.case_result || "غير محسومة",
      success_percentage: cleanItem.success_percentage ?? "",
      result_notes: cleanItem.result_notes || "",
      next_session_date: cleanItem.next_session_date?.slice(0, 16) || "",
      filing_date: cleanItem.filing_date || "",
    });
    setFormTab("core");
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const explicitSuccess = form.success_percentage === "" || form.success_percentage === null || form.success_percentage === undefined
        ? null
        : Math.min(100, Math.max(0, Number(form.success_percentage)));
      const payload = stripLegacyBrokerFields({
        ...form,
        fees: form.fees ? Number(form.fees) : undefined,
        paid_amount: form.paid_amount ? Number(form.paid_amount) : 0,
        case_result: form.case_result || "غير محسومة",
        success_percentage: explicitSuccess,
      });

      if (editing) await base44.entities.Case.update(editing.id, payload);
      else await base44.entities.Case.create(payload);

      setShowDialog(false);
      await loadData();
    } catch (error) {
      alert(error.message || "تعذر حفظ القضية.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = cases.filter((item) => {
    const matchSearch = searchInFields(
      item,
      ["title", "client_name", "case_number", "court", "assigned_lawyer", "opponent_name", "case_result"],
      search,
    );
    const matchStatus = statusFilter === "الكل" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={isClient ? "قضاياي" : "القضايا"}
        subtitle={`${total || cases.length} قضية`}
        action={!isClient ? <Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" />إضافة قضية</Button> : undefined}
      />

      <div className="flex flex-col xl:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input ref={searchRef} placeholder="بحث بالاسم أو رقم القضية أو المحكمة أو النتيجة..." value={search} onChange={(event) => setSearch(event.target.value)} className="pr-10 h-11" />
        </div>
        <ChoiceInput value={statusFilter} onChange={setStatusFilter} options={["الكل", ...STATUSES]} listId="cases-status-filter" helper="" className="xl:w-44 h-11" />
        <ChoiceInput
          value={Object.keys(SORT_OPTIONS).find((label) => SORT_OPTIONS[label] === sortBy) || "الأحدث"}
          onChange={(label) => { setSortBy(SORT_OPTIONS[label] || "-created_date"); setPage(1); }}
          options={Object.keys(SORT_OPTIONS)}
          listId="cases-sort"
          helper=""
          className="xl:w-44 h-11"
        />
      </div>

      {!isClient && (
        <Card className="p-3 border-primary/10 bg-primary/5 text-sm text-muted-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          سجّل نتيجة القضية ونسبة النجاح عند اكتمالها حتى يظهر مؤشر موثوق للموكل، مع بقاء القضايا غير المحسومة خارج الحساب.
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="لا توجد قضايا" description={isClient ? "لا توجد قضايا مرتبطة بحسابك" : "ابدأ بإضافة القضية الأولى"} action={!isClient ? <Button onClick={openCreate}>إضافة قضية</Button> : undefined} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((item) => (
              <Card key={item.id} className={`p-4 hover:shadow-md transition-shadow ${!isClient ? "cursor-pointer" : ""}`} onClick={() => !isClient && openEdit(item)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      {item.case_number && <span className="text-xs text-muted-foreground">#{item.case_number}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.client_name} · {item.case_type}</p>
                    {item.court && <p className="text-xs text-muted-foreground mt-0.5">{item.court}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.case_result && <Badge className={`border-0 text-[10px] ${resultTone(item.case_result)}`}>{item.case_result}</Badge>}
                      {item.success_percentage !== null && item.success_percentage !== undefined && item.success_percentage !== "" && (
                        <Badge className="border-0 bg-emerald-100 text-emerald-800 text-[10px]">نسبة النجاح {Number(item.success_percentage)}%</Badge>
                      )}
                    </div>
                    {item.next_session_date && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        الجلسة القادمة: {isValid(new Date(item.next_session_date)) ? format(new Date(item.next_session_date), "yyyy/MM/dd") : "—"}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={item.status} />
                    <StatusBadge status={item.priority} isPriority />
                    {!isClient && <ActionButtons entityName="Case" record={item} onEdit={openEdit} onDeleted={loadData} size="sm" />}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      {!isClient && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader><DialogTitle>{editing ? "تعديل القضية" : "إضافة قضية جديدة"}</DialogTitle></DialogHeader>
            <Tabs value={formTab} onValueChange={setFormTab} className="mt-2">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="core">البيانات</TabsTrigger>
                <TabsTrigger value="timeline">التواريخ</TabsTrigger>
                <TabsTrigger value="result">النتيجة</TabsTrigger>
                <TabsTrigger value="finance">الأتعاب</TabsTrigger>
              </TabsList>

              <TabsContent value="core" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1 md:col-span-2"><Label>عنوان القضية *</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="h-11" /></div>
                  <div className="space-y-1"><Label>رقم القضية</Label><Input value={form.case_number} onChange={(event) => setForm({ ...form, case_number: event.target.value })} className="h-11" /></div>
                  <div className="space-y-1"><Label>اسم الموكل *</Label><ChoiceInput value={form.client_name} onChange={applyClient} options={clients.map((client) => client.full_name)} listId="clients-list" /></div>
                  <div className="space-y-1"><Label>نوع القضية</Label><ChoiceInput value={form.case_type} onChange={(value) => setForm({ ...form, case_type: value })} options={CASE_TYPES} listId="case-types" /></div>
                  <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={STATUSES} listId="case-statuses" /></div>
                  <div className="space-y-1"><Label>الأولوية</Label><ChoiceInput value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={PRIORITIES} listId="case-priority" /></div>
                  <div className="space-y-1"><Label>المحكمة</Label><Input value={form.court} onChange={(event) => setForm({ ...form, court: event.target.value })} className="h-11" /></div>
                  <div className="space-y-1"><Label>القاضي</Label><Input value={form.judge} onChange={(event) => setForm({ ...form, judge: event.target.value })} className="h-11" /></div>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1"><Label>تاريخ الجلسة القادمة</Label><DateSmartInput type="datetime-local" value={form.next_session_date} onChange={(value) => setForm({ ...form, next_session_date: value })} /></div>
                  <div className="space-y-1"><Label>تاريخ الرفع</Label><DateSmartInput type="date" value={form.filing_date} onChange={(value) => setForm({ ...form, filing_date: value })} /></div>
                  <div className="space-y-1 md:col-span-2"><Label>وصف القضية</Label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-[120px]" /></div>
                </div>
              </TabsContent>

              <TabsContent value="result" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1"><Label>نتيجة القضية</Label><ChoiceInput value={form.case_result} onChange={applyResult} options={CASE_RESULTS} listId="case-results" /></div>
                  <div className="space-y-1"><Label>نسبة النجاح %</Label><Input type="number" min="0" max="100" step="1" value={form.success_percentage} onChange={(event) => setForm({ ...form, success_percentage: event.target.value })} className="h-11" placeholder="0 إلى 100" /></div>
                  <div className="space-y-1 md:col-span-2"><Label>ملخص النتيجة</Label><Textarea value={form.result_notes} onChange={(event) => setForm({ ...form, result_notes: event.target.value })} className="min-h-[120px]" placeholder="اكتب منطوق النتيجة أو التسوية وأهم أثر على الموكل" /></div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-900">اختيار النتيجة يقترح نسبة مبدئية قابلة للتعديل. القضايا غير المحسومة لا تدخل في معدل النجاح.</div>
              </TabsContent>

              <TabsContent value="finance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1"><Label>الخصم</Label><Input value={form.opponent_name} onChange={(event) => setForm({ ...form, opponent_name: event.target.value })} className="h-11" /></div>
                  <div className="space-y-1"><Label>محامي الخصم</Label><Input value={form.opponent_lawyer} onChange={(event) => setForm({ ...form, opponent_lawyer: event.target.value })} className="h-11" /></div>
                  <div className="space-y-1"><Label>المحامي المكلف</Label><Input value={form.assigned_lawyer} onChange={(event) => setForm({ ...form, assigned_lawyer: event.target.value })} className="h-11" /></div>
                  <div className="space-y-1"><Label>الأتعاب (درهم)</Label><Input type="number" value={form.fees} onChange={(event) => setForm({ ...form, fees: event.target.value })} className="h-11" /></div>
                  <div className="space-y-1"><Label>المدفوع (درهم)</Label><Input type="number" value={form.paid_amount} onChange={(event) => setForm({ ...form, paid_amount: event.target.value })} className="h-11" /></div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
              <Button onClick={handleSave} disabled={saving || !form.title || !form.client_name} className="bg-primary text-white">{saving ? "جارٍ الحفظ..." : editing ? "حفظ" : "إضافة"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
