import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight, Briefcase, CalendarDays, CheckSquare, FileText, Mail, MapPin,
  MessageCircle, Phone, Receipt, ShieldCheck, UserRound, Wallet, Clock3,
  Scale, Banknote, ExternalLink, Activity, Building2,
} from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import { getInvoiceTotals } from "@/lib/invoiceMath";

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function belongsToClient(record, client) {
  if (!record || !client) return false;
  if (record.client_id && client.id) return String(record.client_id) === String(client.id);
  return normalize(record.client_name) === normalize(client.full_name);
}

function money(value) {
  return Number(value || 0).toLocaleString("ar-AE", { maximumFractionDigits: 2 });
}

function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ar-AE", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function Metric({ icon: Icon, label, value, tone = "primary" }) {
  const tones = {
    primary: "bg-primary/10 text-primary border-primary/15",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/15",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/15",
    danger: "bg-rose-500/10 text-rose-500 border-rose-500/15",
    cyan: "bg-cyan-500/10 text-cyan-500 border-cyan-500/15",
  };
  return (
    <Card className="p-4 border-border/70 bg-card/80">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center ${tones[tone] || tones.primary}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground font-bold">{label}</p>
          <p className="text-lg font-black text-foreground truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function SectionEmpty({ label }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">لا توجد {label} مرتبطة بهذا الموكل.</div>;
}

export default function Client360() {
  const [params] = useSearchParams();
  const clientId = params.get("id") || "";
  const [client, setClient] = useState(null);
  const [data, setData] = useState({
    cases: [], invoices: [], documents: [], sessions: [], tasks: [], expenses: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadData = useCallback(async () => {
    if (!clientId) {
      setLoadError("لم يتم تحديد الموكل.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const [clientRows, cases, invoices, documents, sessions, tasks, expenses] = await Promise.all([
        base44.entities.Client.filter({ id: clientId }, null, 1),
        base44.entities.Case.list("-created_date", 3000),
        base44.entities.Invoice.list("-created_date", 3000),
        base44.entities.Document.list("-created_date", 3000),
        base44.entities.Session.list("-session_date", 3000),
        base44.entities.Task.list("-created_date", 3000),
        base44.entities.Expense.list("-expense_date", 3000),
      ]);
      const selected = clientRows?.[0] || null;
      if (!selected) throw new Error("لم يتم العثور على ملف الموكل.");
      setClient(selected);
      setData({
        cases: (cases || []).filter((row) => belongsToClient(row, selected)),
        invoices: (invoices || []).filter((row) => belongsToClient(row, selected)),
        documents: (documents || []).filter((row) => belongsToClient(row, selected)),
        sessions: (sessions || []).filter((row) => belongsToClient(row, selected)),
        tasks: (tasks || []).filter((row) => belongsToClient(row, selected)),
        expenses: (expenses || []).filter((row) => belongsToClient(row, selected)),
      });
    } catch (error) {
      setLoadError(error?.message || "تعذر تحميل الملف الشامل للموكل.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { loadData(); }, [loadData]);

  const finance = useMemo(() => {
    const invoiceTotals = data.invoices.reduce((acc, invoice) => {
      const totals = getInvoiceTotals(invoice);
      acc.total += totals.total;
      acc.paid += totals.paid;
      acc.remaining += totals.remaining;
      if (invoice.status === "متأخرة") acc.overdue += 1;
      return acc;
    }, { total: 0, paid: 0, remaining: 0, overdue: 0 });
    const expenses = data.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { ...invoiceTotals, expenses };
  }, [data.invoices, data.expenses]);

  const activeCases = useMemo(
    () => data.cases.filter((item) => !["منتهية", "مغلقة", "محكوم"].includes(item.status)).length,
    [data.cases],
  );

  const upcomingSessions = useMemo(
    () => data.sessions
      .filter((item) => item.session_date && new Date(item.session_date) >= new Date())
      .sort((a, b) => new Date(a.session_date) - new Date(b.session_date)),
    [data.sessions],
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[420px]"><div className="animate-spin h-9 w-9 rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (loadError || !client) {
    return (
      <div className="space-y-4">
        <PageHeader title="الملف الشامل للموكل" subtitle="Client 360" />
        <Card className="p-8 text-center border-destructive/20">
          <p className="font-black text-destructive">{loadError || "تعذر فتح الملف."}</p>
          <Link to={createPageUrl("Clients")}><Button className="mt-4">العودة إلى الموكلين</Button></Link>
        </Card>
      </div>
    );
  }

  const whatsapp = String(client.phone || "").replace(/\D+/g, "");

  return (
    <div className="space-y-6">
      <PageHeader
        title="الملف الشامل للموكل"
        subtitle="Client 360 — كل ما يخص الموكل في مكان واحد"
        action={
          <div className="flex flex-wrap gap-2">
            <Link to={createPageUrl("Clients")}><Button variant="outline" className="gap-2"><ArrowRight className="h-4 w-4" />الموكلون</Button></Link>
            <Link to={createPageUrl("Cases")}><Button variant="outline" className="gap-2"><Briefcase className="h-4 w-4" />القضايا</Button></Link>
            <Link to={createPageUrl("Invoices")}><Button className="gap-2"><Receipt className="h-4 w-4" />الفواتير</Button></Link>
          </div>
        }
      />

      <Card className="overflow-hidden border-primary/20 bg-card/90">
        <div className="h-1.5 bg-gradient-to-l from-primary via-cyan-500 to-amber-400" />
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/25 to-cyan-500/15 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                {client.avatar_url
                  ? <img src={client.avatar_url} alt={client.full_name} className="h-full w-full object-cover" />
                  : <span className="text-3xl font-black text-primary">{(client.full_name || "?")[0]}</span>}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black text-foreground">{client.full_name}</h2>
                  <StatusBadge status={client.status} />
                  <Badge className="bg-primary/12 text-primary border border-primary/20">{client.client_role || "موكل"}</Badge>
                  <Badge variant="outline">{client.client_type || "فرد"}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {client.nationality || "الجنسية غير مسجلة"}
                  {client.id_number ? ` · الهوية/السجل: ${client.id_number}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {client.phone && <a href={`tel:${client.phone}`}><Button size="sm" variant="outline" className="gap-1.5"><Phone className="h-3.5 w-3.5" />{client.phone}</Button></a>}
                  {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="gap-1.5"><MessageCircle className="h-3.5 w-3.5" />واتساب</Button></a>}
                  {client.email && <a href={`mailto:${client.email}`}><Button size="sm" variant="outline" className="gap-1.5"><Mail className="h-3.5 w-3.5" />البريد</Button></a>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 min-w-[260px]">
              <div className="rounded-2xl border border-border bg-muted/25 p-3 text-center"><p className="text-xl font-black">{data.cases.length}</p><p className="text-[11px] text-muted-foreground">إجمالي القضايا</p></div>
              <div className="rounded-2xl border border-border bg-muted/25 p-3 text-center"><p className="text-xl font-black">{activeCases}</p><p className="text-[11px] text-muted-foreground">قضايا نشطة</p></div>
              <div className="rounded-2xl border border-border bg-muted/25 p-3 text-center"><p className="text-xl font-black">{data.documents.length}</p><p className="text-[11px] text-muted-foreground">المستندات</p></div>
              <div className="rounded-2xl border border-border bg-muted/25 p-3 text-center"><p className="text-xl font-black">{data.tasks.length}</p><p className="text-[11px] text-muted-foreground">المهام</p></div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <Metric icon={Banknote} label="إجمالي الفواتير" value={`${money(finance.total)} د.إ`} />
        <Metric icon={ShieldCheck} label="المحصل" value={`${money(finance.paid)} د.إ`} tone="success" />
        <Metric icon={Wallet} label="المتبقي" value={`${money(finance.remaining)} د.إ`} tone={finance.remaining > 0 ? "danger" : "success"} />
        <Metric icon={Receipt} label="المصروفات المرتبطة" value={`${money(finance.expenses)} د.إ`} tone="warning" />
        <Metric icon={CalendarDays} label="الجلسات القادمة" value={upcomingSessions.length} tone="cyan" />
      </div>

      <Tabs defaultValue="overview" dir="rtl" className="space-y-4">
        <TabsList className="h-auto w-full flex flex-wrap justify-start gap-1 bg-muted/40 p-1.5 rounded-2xl">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="cases">القضايا ({data.cases.length})</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير ({data.invoices.length})</TabsTrigger>
          <TabsTrigger value="documents">المستندات ({data.documents.length})</TabsTrigger>
          <TabsTrigger value="sessions">الجلسات ({data.sessions.length})</TabsTrigger>
          <TabsTrigger value="tasks">المهام ({data.tasks.length})</TabsTrigger>
          <TabsTrigger value="finance">الماليات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-black flex items-center gap-2 mb-4"><UserRound className="h-4 w-4 text-primary" />بيانات الموكل</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  ["الصفة القانونية", client.client_role || "موكل"],
                  ["النوع", client.client_type || "—"],
                  ["الهاتف", client.phone || "—"],
                  ["البريد", client.email || "—"],
                  ["الجنسية", client.nationality || "—"],
                  ["الهوية / السجل", client.id_number || "—"],
                ].map(([label, value]) => <div key={label} className="rounded-xl bg-muted/30 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="font-bold mt-1 break-words">{value}</p></div>)}
              </div>
              {client.address && <div className="mt-3 rounded-xl bg-muted/30 p-3"><p className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />العنوان</p><p className="font-bold mt-1">{client.address}</p></div>}
              {client.notes && <div className="mt-3 rounded-xl border border-border p-3"><p className="text-[11px] text-muted-foreground">ملاحظات الملف</p><p className="text-sm leading-7 mt-1 whitespace-pre-wrap">{client.notes}</p></div>}
            </Card>

            <Card className="p-5">
              <h3 className="font-black flex items-center gap-2 mb-4"><Activity className="h-4 w-4 text-primary" />المتابعة السريعة</h3>
              <div className="space-y-3">
                <div className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                  <div><p className="font-bold">أقرب جلسة</p><p className="text-xs text-muted-foreground mt-1">{upcomingSessions[0] ? `${dateLabel(upcomingSessions[0].session_date)} · ${upcomingSessions[0].case_title || upcomingSessions[0].court || "جلسة"}` : "لا توجد جلسة قادمة"}</p></div>
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                  <div><p className="font-bold">الفواتير المتأخرة</p><p className="text-xs text-muted-foreground mt-1">{finance.overdue} فاتورة تحتاج متابعة</p></div>
                  <Receipt className="h-5 w-5 text-amber-500" />
                </div>
                <div className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                  <div><p className="font-bold">المهام المفتوحة</p><p className="text-xs text-muted-foreground mt-1">{data.tasks.filter((task) => task.status !== "مكتملة").length} مهمة</p></div>
                  <CheckSquare className="h-5 w-5 text-cyan-500" />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cases">
          {data.cases.length === 0 ? <SectionEmpty label="قضايا" /> : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {data.cases.map((item) => (
                <Card key={item.id} className="p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h4 className="font-black">{item.title}</h4><StatusBadge status={item.status} /></div>
                      <p className="text-xs text-muted-foreground mt-1">{item.case_number ? `#${item.case_number} · ` : ""}{item.case_type || "قضية"}{item.court ? ` · ${item.court}` : ""}</p>
                      {item.next_session_date && <p className="text-xs mt-2 flex items-center gap-1 text-primary"><CalendarDays className="h-3 w-3" />الجلسة القادمة: {dateLabel(item.next_session_date)}</p>}
                    </div>
                    <Scale className="h-5 w-5 text-primary shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices">
          {data.invoices.length === 0 ? <SectionEmpty label="فواتير" /> : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {data.invoices.map((item) => {
                const totals = getInvoiceTotals(item);
                return (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><h4 className="font-black">فاتورة {item.invoice_number || "بدون رقم"}</h4><p className="text-xs text-muted-foreground mt-1">{item.case_title || "بدون قضية مرتبطة"} · {dateLabel(item.issue_date)}</p></div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="rounded-xl bg-muted/30 p-2"><p className="font-black">{money(totals.total)}</p><p className="text-[10px] text-muted-foreground">الإجمالي</p></div>
                      <div className="rounded-xl bg-emerald-500/10 p-2"><p className="font-black text-emerald-500">{money(totals.paid)}</p><p className="text-[10px] text-muted-foreground">المدفوع</p></div>
                      <div className="rounded-xl bg-rose-500/10 p-2"><p className="font-black text-rose-500">{money(totals.remaining)}</p><p className="text-[10px] text-muted-foreground">المتبقي</p></div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          {data.documents.length === 0 ? <SectionEmpty label="مستندات" /> : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {data.documents.map((item) => (
                <Card key={item.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0"><h4 className="font-black truncate">{item.title || item.file_name || "مستند"}</h4><p className="text-xs text-muted-foreground mt-1">{item.doc_type || "مستند"}{item.case_title ? ` · ${item.case_title}` : ""}</p></div>
                  {item.file_url ? <a href={item.file_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="gap-1"><ExternalLink className="h-3.5 w-3" />فتح</Button></a> : <FileText className="h-5 w-5 text-muted-foreground" />}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          {data.sessions.length === 0 ? <SectionEmpty label="جلسات" /> : (
            <div className="space-y-3">
              {data.sessions.map((item) => (
                <Card key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div><h4 className="font-black">{item.case_title || item.case_number || "جلسة"}</h4><p className="text-xs text-muted-foreground mt-1">{dateLabel(item.session_date)}{item.court ? ` · ${item.court}` : ""}{item.hall ? ` · قاعة ${item.hall}` : ""}</p>{item.result && <p className="text-sm mt-2">{item.result}</p>}</div>
                  <StatusBadge status={item.status} />
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          {data.tasks.length === 0 ? <SectionEmpty label="مهام" /> : (
            <div className="space-y-3">
              {data.tasks.map((item) => (
                <Card key={item.id} className="p-4 flex items-center justify-between gap-3">
                  <div><h4 className="font-black">{item.title}</h4><p className="text-xs text-muted-foreground mt-1">{item.case_title || "مهمة عامة"}{item.due_date ? ` · الاستحقاق ${dateLabel(item.due_date)}` : ""}</p></div>
                  <div className="flex items-center gap-2"><Badge variant="outline">{item.priority || "عادية"}</Badge><StatusBadge status={item.status} /></div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <Metric icon={Banknote} label="إجمالي الأتعاب المفوترة" value={`${money(finance.total)} د.إ`} />
            <Metric icon={ShieldCheck} label="إجمالي المحصل" value={`${money(finance.paid)} د.إ`} tone="success" />
            <Metric icon={Wallet} label="الرصيد المتبقي" value={`${money(finance.remaining)} د.إ`} tone="danger" />
            <Metric icon={Receipt} label="المصروفات" value={`${money(finance.expenses)} د.إ`} tone="warning" />
          </div>
          <Card className="p-5">
            <h3 className="font-black flex items-center gap-2 mb-4"><Wallet className="h-4 w-4 text-primary" />المصروفات المرتبطة</h3>
            {data.expenses.length === 0 ? <SectionEmpty label="مصروفات" /> : (
              <div className="space-y-2">
                {data.expenses.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                    <div><p className="font-bold">{item.title || "مصروف"}</p><p className="text-xs text-muted-foreground mt-1">{item.category || "أخرى"} · {dateLabel(item.expense_date)}</p></div>
                    <p className="font-black text-rose-500">{money(item.amount)} د.إ</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-muted/20 border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="font-black">الوصول السريع للأقسام</p><p className="text-xs text-muted-foreground mt-1">الملف الحالي يعرض الارتباطات مباشرة، ويمكن فتح القسم الكامل عند الحاجة.</p></div>
          <div className="flex flex-wrap gap-2">
            {[
              ["Cases", "القضايا", Briefcase],
              ["Invoices", "الفواتير", Receipt],
              ["Documents", "المستندات", FileText],
              ["Sessions", "الجلسات", CalendarDays],
              ["Tasks", "المهام", CheckSquare],
              ["Expenses", "المصروفات", Wallet],
            ].map(([page, label, Icon]) => <Link key={page} to={createPageUrl(page)}><Button variant="outline" size="sm" className="gap-1.5"><Icon className="h-3.5 w-3.5" />{label}</Button></Link>)}
          </div>
        </div>
      </Card>
    </div>
  );
}
