import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Phone, Mail, MessageCircle, Briefcase, FileText, Clock3, Upload, UserCheck, AlertTriangle, Wallet, Receipt, ArrowLeft, ShieldCheck } from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import StatCard from "@/components/helm/StatCard";
import ChoiceInput from "@/components/shared/ChoiceInput";
import ActionButtons from "@/components/shared/ActionButtons";
import { searchInFields } from "@/lib/search";
import { PageErrorState } from "@/components/app/AppStatusBar";
import PaginationControls from "@/components/shared/PaginationControls";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";
import { importContactsCsvFile, importFormerEmployeesFromLocalData } from "@/lib/clientImport";
import { buildClientDuplicateGroups, caseSuccessStats, findClientDuplicates, normalizeText } from "@/lib/dataIntegrity";
import { getInvoiceTotals } from "@/lib/invoiceMath";
import { createPageUrl } from "@/utils";

const emptyForm = {
  full_name: "",
  name_ar: "",
  name_en: "",
  name_aliases: [],
  client_type: "فرد",
  client_role: "موكل",
  id_number: "",
  phone: "",
  email: "",
  address: "",
  nationality: "",
  notes: "",
  status: "نشط",
};

const CLIENT_TYPES = ["فرد", "شركة", "مؤسسة", "جهة حكومية", "ورثة"];
const CLIENT_ROLES = ["موكل", "خصم", "شاهد", "ممثل شركة", "مفوض بالتوقيع", "ولي / وصي", "خبير", "وسيط", "جهة ذات صلة", "أخرى"];
const CLIENT_STATUSES = ["نشط", "غير نشط", "مهمل"];
const COMMON_NATS = ["الإمارات", "مصر", "السعودية", "الهند", "باكستان", "سوريا", "الأردن", "السودان"];

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(value) {
  const date = toDate(value);
  if (!date) return null;
  return Math.floor((new Date() - date) / 86400000);
}

function cleanClientPayload(value = {}) {
  const source = { ...emptyForm, ...(value || {}) };
  return {
    full_name: String(source.full_name || "").trim(),
    name_ar: String(source.name_ar || "").trim(),
    name_en: String(source.name_en || "").trim(),
    name_aliases: Array.isArray(source.name_aliases)
      ? source.name_aliases.map((item) => String(item || "").trim()).filter(Boolean)
      : String(source.name_aliases || "").split(/[،,\n]/).map((item) => item.trim()).filter(Boolean),
    client_type: source.client_type || "فرد",
    client_role: source.client_role || "موكل",
    id_number: String(source.id_number || "").trim(),
    phone: String(source.phone || "").trim(),
    email: String(source.email || "").trim().toLowerCase(),
    address: source.address || "",
    nationality: source.nationality || "",
    notes: source.notes || "",
    status: source.status || "نشط",
  };
}

function belongsToClient(record, client) {
  if (record?.client_id && client?.id) return String(record.client_id) === String(client.id);
  return normalizeText(record?.client_name) === normalizeText(client?.full_name);
}

export default function Clients() {
  const navigate = useNavigate();
  const [allClients, setAllClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [documents, setDocs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showDialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setTab] = useState("all");
  const [nameMode, setNameMode] = useState("all");
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState("");
  const pageSize = 12;
  const searchRef = useRef(null);
  const csvInputRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [allRows, caseRows, sessionRows, docRows, invoiceRows] = await Promise.all([
        base44.entities.Client.list("-created_date", 5000),
        base44.entities.Case.list("-created_date", 5000),
        base44.entities.Session.list("-session_date", 5000),
        base44.entities.Document.list("-created_date", 5000),
        base44.entities.Invoice.list("-created_date", 5000),
      ]);
      setAllClients(allRows || []);
      setCases(caseRows || []);
      setSessions(sessionRows || []);
      setDocs(docRows || []);
      setInvoices(invoiceRows || []);
    } catch (error) {
      setError(error.message || "تعذر تحميل الموكلين.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  usePageRefresh(loadData, ["clients", "cases", "sessions", "documents", "invoices"]);

  useEffect(() => {
    const offNew = subscribeAppEvent(APP_SHORTCUT_NEW, ({ page: current }) => current === "Clients" && openCreate());
    const offSearch = subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page: current }) => current === "Clients" && searchRef.current?.focus());
    return () => { offNew(); offSearch(); };
  }, []);

  const duplicateGroups = useMemo(() => buildClientDuplicateGroups(allClients), [allClients]);
  const duplicateClientIds = useMemo(
    () => new Set(duplicateGroups.flatMap((group) => group.records.map((record) => record.id))),
    [duplicateGroups],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialog(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm(cleanClientPayload(client));
    setDialog(true);
  };

  const handleSave = async () => {
    const payload = cleanClientPayload(form);
    const duplicates = findClientDuplicates(payload, allClients, editing?.id);
    if (duplicates.length) {
      const details = duplicates
        .slice(0, 4)
        .map((match) => `${match.record.full_name} — تطابق: ${match.matchedFields.join("، ")}`)
        .join("\n");
      alert(`تم منع الحفظ لوجود موكل مطابق أو محتمل التكرار:\n\n${details}\n\nافتح السجل الموجود وعدّل بياناته بدل إنشاء سجل جديد.`);
      return;
    }

    setSaving(true);
    try {
      if (editing) await base44.entities.Client.update(editing.id, payload);
      else await base44.entities.Client.create(payload);
      setDialog(false);
      await loadData();
    } catch (error) {
      alert(error.message || "تعذر حفظ الموكل.");
    } finally {
      setSaving(false);
    }
  };

  const runImport = async (work, successPrefix) => {
    setImporting(true);
    setImportSummary("جاري الاستيراد...");
    try {
      const result = await work((progress) => setImportSummary(
        `جاري الاستيراد: ${progress.current}/${progress.total} — تمت الإضافة ${progress.created} / تخطي ${progress.skipped} / فشل ${progress.failed}`,
      ));
      setImportSummary(`${successPrefix}: تمت إضافة ${result.created}، تخطي ${result.skipped} مكرر/ناقص، فشل ${result.failed}.`);
      await loadData();
    } catch (error) {
      setImportSummary(error?.message || "تعذر تنفيذ الاستيراد.");
    } finally {
      setImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  const handleCsvImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await runImport(
      (onProgress) => importContactsCsvFile({ file, base44, existingClients: allClients, onProgress }),
      "تم استيراد جهات الاتصال",
    );
  };

  const handleFormerEmployeesImport = async () => {
    if (!confirm("سيتم نقل ملفات الموظفين المحلية السابقة إلى الموكلين مع منع السجلات المكررة. هل تريد الاستمرار؟")) return;
    await runImport(
      (onProgress) => importFormerEmployeesFromLocalData({ base44, existingClients: allClients, onProgress }),
      "تم نقل ملفات الموظفين السابقة إلى الموكلين",
    );
  };

  const metrics = useMemo(() => allClients.map((client) => {
    const clientCases = cases.filter((item) => belongsToClient(item, client));
    const clientSessions = sessions.filter((item) => belongsToClient(item, client));
    const clientDocuments = documents.filter((item) => belongsToClient(item, client));
    const clientInvoices = invoices.filter((item) => belongsToClient(item, client));
    const invoiceFinance = clientInvoices.reduce((acc, invoice) => {
      const totals = getInvoiceTotals(invoice);
      acc.total += totals.total;
      acc.paid += totals.paid;
      acc.remaining += totals.remaining;
      return acc;
    }, { total: 0, paid: 0, remaining: 0 });
    const dates = [
      client.created_date,
      ...clientCases.map((item) => item.updated_date || item.created_date),
      ...clientSessions.map((item) => item.updated_date || item.session_date),
      ...clientDocuments.map((item) => item.updated_date || item.created_date),
      ...clientInvoices.map((item) => item.updated_date || item.created_date),
    ].map(toDate).filter(Boolean).sort((a, b) => b - a);
    const lastActivity = dates[0] || null;
    const inactivityDays = lastActivity ? daysSince(lastActivity.toISOString()) : null;
    const success = caseSuccessStats(clientCases);
    const overdueInvoices = clientInvoices.filter((item) => item.status === "متأخرة").length;
    const activeCases = clientCases.filter((item) => item.status === "جارية").length;
    const isNeglected = (inactivityDays !== null && inactivityDays > 45)
      || (client.status === "غير نشط" && activeCases === 0 && clientDocuments.length === 0);
    return {
      ...client,
      activeCases,
      totalCases: clientCases.length,
      sessionsCount: clientSessions.length,
      documentsCount: clientDocuments.length,
      invoicesCount: clientInvoices.length,
      invoicedAmount: invoiceFinance.total,
      paidAmount: invoiceFinance.paid,
      remainingAmount: invoiceFinance.remaining,
      overdueInvoices,
      lastActivity,
      inactivityDays,
      isNeglected,
      successRate: success.rate,
      decidedCases: success.decided,
      isDuplicate: duplicateClientIds.has(client.id),
      hasArabicName: Boolean(String(client.name_ar || "").trim()),
      hasEnglishName: Boolean(String(client.name_en || "").trim()),
      needsNameReview: !String(client.name_ar || "").trim()
        && /[A-Za-z0-9]/.test(String(client.full_name || "")),
    };
  }), [allClients, cases, sessions, documents, invoices, duplicateClientIds]);

  const ratedMetrics = useMemo(() => metrics.filter((client) => client.successRate !== null), [metrics]);
  const stats = useMemo(() => ({
    total: metrics.length,
    active: metrics.filter((client) => client.status === "نشط").length,
    neglected: metrics.filter((client) => client.isNeglected).length,
    duplicates: duplicateClientIds.size,
    activeCases: metrics.reduce((sum, client) => sum + Number(client.activeCases || 0), 0),
    averageSuccess: ratedMetrics.length
      ? Math.round((ratedMetrics.reduce((sum, client) => sum + client.successRate, 0) / ratedMetrics.length) * 10) / 10
      : null,
  }), [metrics, duplicateClientIds, ratedMetrics]);

  const filtered = useMemo(() => metrics.filter((client) => {
    if (!searchInFields(client, ["full_name", "name_ar", "name_en", "name_aliases", "phone", "email", "id_number", "address", "nationality", "client_role", "client_type"], search)) return false;

    if (nameMode === "bilingual" && !(client.hasArabicName && client.hasEnglishName)) return false;
    if (nameMode === "arabic" && !(client.hasArabicName && !client.hasEnglishName)) return false;
    if (nameMode === "english" && !(client.hasEnglishName && !client.hasArabicName)) return false;
    if (nameMode === "review" && !client.needsNameReview) return false;

    if (activeTab === "active") return client.status === "نشط";
    if (activeTab === "neglected") return client.isNeglected;
    if (activeTab === "duplicates") return client.isDuplicate;
    return true;
  }), [metrics, search, activeTab, nameMode]);

  const pagedClients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const duplicateReviewGroups = useMemo(() => {
    if (!search.trim()) return duplicateGroups;
    return duplicateGroups
      .map((group) => ({
        ...group,
        records: group.records.filter((record) =>
          searchInFields(record, ["full_name", "name_ar", "name_en", "name_aliases", "phone", "email", "id_number", "address", "nationality", "client_role", "client_type"], search),
        ),
      }))
      .filter((group) => group.records.length > 0);
  }, [duplicateGroups, search]);

  const duplicateReviewCount = useMemo(
    () => new Set(duplicateReviewGroups.flatMap((group) => group.records.map((record) => record.id))).size,
    [duplicateReviewGroups],
  );

  useEffect(() => {
    setPage(1);
  }, [search, activeTab, nameMode]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, page]);

  const duplicateReason = (key = "") => {
    if (key.startsWith("id:")) return "تطابق رقم الهوية / السجل";
    if (key.startsWith("email:")) return "تطابق البريد الإلكتروني";
    if (key.startsWith("phone:")) return "تطابق رقم الهاتف";
    return "تطابق بيانات";
  };

  const sendWhatsApp = (client) => {
    const message = encodeURIComponent(`مرحباً ${client.name_ar || client.full_name}، نود متابعة ملفكم القانوني.`);
    if (client.phone) window.open(`https://wa.me/${client.phone.replace(/\D+/g, "")}?text=${message}`, "_blank");
  };

  const tabs = [
    { key: "all", label: "الكل", count: stats.total },
    { key: "active", label: "النشطون", count: stats.active },
    { key: "neglected", label: "المهملون", count: stats.neglected },
    { key: "duplicates", label: "المكررات", count: stats.duplicates },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="الموكلون"
        subtitle={`${stats.total} موكل — ملف 360 موحد للقضايا والمستندات والفواتير والماليات`}
        action={(
          <div className="flex flex-wrap gap-2 justify-end">
            <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvImport} />
            <Button variant="outline" onClick={handleFormerEmployeesImport} disabled={importing} className="gap-2">
              <UserCheck className="h-4 w-4" />نقل الموظفين
            </Button>
            <Button variant="outline" onClick={() => csvInputRef.current?.click()} disabled={importing} className="gap-2">
              <Upload className="h-4 w-4" />استيراد CSV
            </Button>
            <Button onClick={openCreate} className="bg-primary text-white gap-2">
              <Plus className="h-4 w-4" />إضافة موكل
            </Button>
          </div>
        )}
      />

      {importSummary && <Card className="p-3 border-primary/10 bg-primary/5 text-sm font-bold text-primary">{importSummary}</Card>}

      {duplicateGroups.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-foreground">مراجعة المكررات مطلوبة</h3>
                <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/20">{duplicateGroups.length} مجموعة · {duplicateClientIds.size} سجل</Badge>
              </div>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground">لا حذف تلقائيًا. افتح مركز المراجعة وحدد السجل الصحيح قبل نقل الارتباطات أو حذف أي نسخة زائدة.</p>
            </div>
            <Button variant="outline" className="border-amber-500/30 hover:bg-amber-500/10" onClick={() => { setTab("duplicates"); setPage(1); }}>مراجعة الآن</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي الموكلين" value={stats.total} icon={Users} color="primary" />
        <StatCard title="النشطون" value={stats.active} icon={Briefcase} color="success" />
        <StatCard title="القضايا النشطة" value={stats.activeCases} icon={Briefcase} color="accent" />
        <StatCard title="سجلات محتملة التكرار" value={stats.duplicates} icon={AlertTriangle} color="warning" />
      </div>

      <Card className="p-4 space-y-3 border-primary/10">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input ref={searchRef} placeholder="بحث بالاسم العربي أو الإنجليزي أو الهاتف أو الهوية أو البريد..." value={search} onChange={(event) => setSearch(event.target.value)} className="pr-10 h-11" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <Button key={tab.key} variant={activeTab === tab.key ? "default" : "outline"} className="rounded-full h-9 gap-1.5" onClick={() => { setTab(tab.key); setPage(1); }}>
                  {tab.label}<span className="opacity-70 text-xs">{tab.count}</span>
                </Button>
              ))}
              <span className="px-2 text-xs font-bold text-muted-foreground">المعروض {filtered.length}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                ["all", "كل الأسماء"],
                ["bilingual", "عربي + إنجليزي"],
                ["arabic", "عربي فقط"],
                ["english", "إنجليزي فقط"],
                ["review", "يحتاج مراجعة"],
              ].map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={nameMode === key ? "secondary" : "ghost"}
                  className="rounded-full h-8 text-xs"
                  onClick={() => { setNameMode(key); setPage(1); }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {!loading && !loadError && activeTab === "duplicates" && duplicateReviewGroups.length > 0 && (
        <div className="space-y-4">
          <Card className="p-5 border-amber-300/60 bg-amber-500/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h3 className="font-black text-lg text-foreground">مركز مراجعة المكررات</h3>
                <p className="text-sm text-muted-foreground mt-1">راجع كل مجموعة كسجل واحد مترابط قبل أي حذف. افتح الملف الشامل أو عدّل السجل الصحيح ثم انقل الارتباطات عند الحاجة.</p>
              </div>
              <Badge className="w-fit bg-amber-500/15 text-amber-500 border border-amber-500/20">{duplicateReviewGroups.length} مجموعة · {duplicateReviewCount} سجل</Badge>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {duplicateReviewGroups.map((group, groupIndex) => (
              <Card key={group.key} className="overflow-hidden border-amber-300/50 bg-card/95">
                <div className="h-1 bg-amber-400" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs font-black text-amber-500">مجموعة #{groupIndex + 1}</p>
                      <h4 className="font-black mt-1">{duplicateReason(group.key)}</h4>
                    </div>
                    <Badge variant="outline">{group.records.length} سجلات</Badge>
                  </div>
                  <div className="space-y-3">
                    {group.records.map((record) => {
                      const metric = metrics.find((item) => item.id === record.id) || record;
                      return (
                        <div key={record.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black truncate">{record.full_name}</p>
                                <StatusBadge status={record.status} />
                                <Badge className="bg-primary/10 text-primary border border-primary/15 text-[10px]">{record.client_role || "موكل"}</Badge>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {record.phone && <span>هاتف: {record.phone}</span>}
                                {record.email && <span>بريد: {record.email}</span>}
                                {record.id_number && <span>هوية/سجل: {record.id_number}</span>}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="outline">{metric.totalCases || 0} قضية</Badge>
                                <Badge variant="outline">{metric.invoicesCount || 0} فاتورة</Badge>
                                <Badge variant="outline">{metric.documentsCount || 0} مستند</Badge>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              <Button size="sm" onClick={() => navigate(createPageUrl("Client360") + `?id=${record.id}`)} className="gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5" />الملف الشامل
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openEdit(record)}>تعديل</Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="لا توجد نتائج" description={activeTab === "duplicates" ? "لا توجد سجلات مكررة ضمن البيانات الحالية." : "غيّر البحث أو الفلتر، أو أضف موكلًا جديدًا."} action={activeTab !== "duplicates" ? <Button onClick={openCreate}>إضافة موكل</Button> : undefined} />
      ) : (
        <>
          {activeTab !== "duplicates" && <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {pagedClients.map((client) => (
              <Card key={client.id} className={`group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl ${client.isDuplicate ? "border-amber-300 bg-amber-50/30" : "border-primary/15 hover:border-primary/35 bg-card/90"}`}>
                <div className="h-1.5 bg-gradient-to-l from-primary via-cyan-500 to-amber-400 opacity-80" />
                <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-black text-lg">{(client.name_ar || client.full_name || "?")[0]}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground truncate">{client.name_ar || client.full_name}</h3>
                          {client.name_en && client.name_en !== client.name_ar && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5" dir="ltr">{client.name_en}</p>
                          )}
                        </div>
                        <StatusBadge status={client.status} />
                        {client.isNeglected && <Badge className="bg-warning/15 text-warning border-warning/20 text-[10px]">مهمل</Badge>}
                        {client.isDuplicate && <Badge className="bg-amber-200 text-amber-900 border-0 text-[10px]">محتمل التكرار</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge className="bg-primary/10 text-primary border border-primary/15 text-[10px]">{client.client_role || "موكل"}</Badge>
                        <span className="text-xs text-muted-foreground">{client.client_type}{client.nationality ? ` · ${client.nationality}` : ""}</span>
                      </div>
                    </div>
                  </div>
                  <ActionButtons entityName="Client" record={client} onEdit={openEdit} onDeleted={loadData} size="sm" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "القضايا", value: client.totalCases, icon: Briefcase },
                    { label: "المستندات", value: client.documentsCount, icon: FileText },
                    { label: "الفواتير", value: client.invoicesCount, icon: Receipt },
                    { label: "المتبقي", value: `${Number(client.remainingAmount || 0).toLocaleString("ar-AE")} د.إ`, icon: Wallet },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl border border-border/70 bg-muted/25 p-3">
                        <div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-primary" /><p className="text-[10px] text-muted-foreground">{item.label}</p></div>
                        <p className="font-black text-foreground text-base mt-1 truncate">{item.value}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                  {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>}
                  {client.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{client.email}</span>}
                  {client.inactivityDays !== null && <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />آخر نشاط {client.inactivityDays} يوم</span>}
                  {client.overdueInvoices > 0 && <Badge className="text-[10px] bg-destructive/10 text-destructive border-0">{client.overdueInvoices} فاتورة متأخرة</Badge>}
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  <Button size="sm" onClick={() => navigate(createPageUrl("Client360") + `?id=${client.id}`)} className="gap-1.5 h-9 bg-primary text-white">
                    <ShieldCheck className="h-3.5 w-3.5" />الملف الشامل <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(client)} className="gap-1.5 h-9"><FileText className="h-3.5 w-3.5" />تعديل</Button>
                  {client.phone && <Button variant="outline" size="sm" onClick={() => sendWhatsApp(client)} className="gap-1.5 h-9"><MessageCircle className="h-3.5 w-3.5" />واتساب</Button>}
                  {client.email && <Button variant="outline" size="sm" onClick={() => { window.location.href = `mailto:${client.email}`; }} className="gap-1.5 h-9"><Mail className="h-3.5 w-3.5" />بريد</Button>}
                </div>
                </div>
              </Card>
            ))}
          </div>}
          {activeTab !== "duplicates" && <PaginationControls page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />}
        </>
      )}

      <Dialog open={showDialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل بيانات الموكل" : "إضافة موكل جديد"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 md:col-span-2"><Label>الاسم الكامل الأساسي *</Label><Input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>الاسم بالعربية</Label><Input value={form.name_ar || ""} onChange={(event) => setForm({ ...form, name_ar: event.target.value })} className="h-11" placeholder="مثال: أحمد محمد علي" /></div>
            <div className="space-y-1"><Label>الاسم بالإنجليزية</Label><Input value={form.name_en || ""} onChange={(event) => setForm({ ...form, name_en: event.target.value })} className="h-11" dir="ltr" placeholder="Ahmed Mohamed Ali" /></div>
            <div className="space-y-1 md:col-span-2"><Label>أسماء بديلة / تهجئات أخرى</Label><Input value={Array.isArray(form.name_aliases) ? form.name_aliases.join("، ") : (form.name_aliases || "")} onChange={(event) => setForm({ ...form, name_aliases: event.target.value })} className="h-11" placeholder="افصل بين الأسماء بفاصلة" /></div>
            <div className="space-y-1"><Label>نوع الموكل</Label><ChoiceInput value={form.client_type} onChange={(value) => setForm({ ...form, client_type: value })} options={CLIENT_TYPES} listId="cl-types" /></div>
            <div className="space-y-1"><Label>الصفة القانونية الشاملة</Label><ChoiceInput value={form.client_role} onChange={(value) => setForm({ ...form, client_role: value })} options={CLIENT_ROLES} listId="cl-roles" /></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={CLIENT_STATUSES} listId="cl-status" /></div>
            <div className="space-y-1"><Label>الهاتف</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>رقم الهوية</Label><Input value={form.id_number} onChange={(event) => setForm({ ...form, id_number: event.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>الجنسية</Label><ChoiceInput value={form.nationality} onChange={(value) => setForm({ ...form, nationality: value })} options={COMMON_NATS} listId="cl-nat" /></div>
            <div className="space-y-1 md:col-span-2"><Label>سلامة البيانات</Label><p className="text-xs text-muted-foreground pt-2">سيتم فحص الهاتف والبريد والهوية والاسم قبل الحفظ، ويُمنع إنشاء سجل مكرر.</p></div>
            <div className="space-y-1 md:col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="h-11" /></div>
            <div className="space-y-1 md:col-span-2"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-[100px]" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.full_name} className="bg-primary text-white">{saving ? "جارٍ الفحص والحفظ..." : editing ? "حفظ التعديلات" : "إضافة"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
