import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Search, FileText, TrendingUp, DollarSign, AlertCircle, MessageCircle, Mail, Send, Building2, Scale, AlertTriangle, Copy } from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import EmptyState from "../components/helm/EmptyState";
import InvoiceCard from "../components/invoices/InvoiceCard";
import InvoiceFormDialog from "../components/invoices/InvoiceFormDialog";
import InvoicePDF from "../components/invoices/InvoicePDF";
import { useAuth } from "@/lib/AuthContext";
import { searchInFields } from "@/lib/search";
import { getInvoiceTotals } from "@/lib/invoiceMath";
import { buildInvoiceDuplicateGroups } from "@/lib/dataIntegrity";
import { PageErrorState } from "@/components/app/AppStatusBar";
import PaginationControls from "@/components/shared/PaginationControls";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { PORTAL_SCOPE_HELM, PORTAL_SCOPE_BADAYAT, getInvoicePortalScope } from "@/lib/portalScopes";

export default function Invoices() {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [officeSettings, setOfficeSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [portalFilter, setPortalFilter] = useState(PORTAL_SCOPE_HELM);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const searchRef = useRef(null);

  const STATUSES = ["مسودة", "صادرة", "مدفوعة جزئياً", "مدفوعة", "متأخرة", "ملغاة"];

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [{ data: pageRows, total: totalRows }, allRows, clientRows, officeRows] = await Promise.all([
        base44.entities.Invoice.listPage("-created_date", { page, pageSize }),
        base44.entities.Invoice.list("-created_date", 3000),
        base44.entities.Client.list("full_name", 2000),
        base44.entities.OfficeSettings.list(),
      ]);
      setInvoices(pageRows || []);
      setAllInvoices(allRows || []);
      setClients(clientRows || []);
      setOfficeSettings(officeRows?.[0] || null);
      setTotal(totalRows || 0);
    } catch (error) {
      setLoadError(error.message || "تعذر تحميل الفواتير.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);
  usePageRefresh(loadInvoices, ["invoices", "clients", "office_settings"]);

  useEffect(() => {
    const offNew = subscribeAppEvent(APP_SHORTCUT_NEW, ({ page: current }) => !isClient && current === "Invoices" && handleCreate());
    const offSearch = subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page: current }) => current === "Invoices" && searchRef.current?.focus());
    return () => { offNew(); offSearch(); };
  }, [isClient]);

  const clientLookup = useMemo(() => Object.fromEntries(clients.map((client) => [client.full_name, client])), [clients]);
  const duplicateGroups = useMemo(() => buildInvoiceDuplicateGroups(allInvoices, getInvoiceTotals), [allInvoices]);
  const duplicateInvoiceIds = useMemo(() => new Set(duplicateGroups.flatMap((group) => group.records.map((record) => record.id))), [duplicateGroups]);

  const portalCounts = useMemo(() => allInvoices.reduce((acc, invoice) => {
    const scope = getInvoicePortalScope(invoice);
    acc[scope] = (acc[scope] || 0) + 1;
    return acc;
  }, { [PORTAL_SCOPE_HELM]: 0, [PORTAL_SCOPE_BADAYAT]: 0 }), [allInvoices]);

  const handleEdit = (invoice) => { setEditing(invoice); setShowForm(true); };
  const handleCreate = () => { setEditing(null); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;
    await base44.entities.Invoice.delete(id);
    await loadInvoices();
  };

  const handleMarkPaid = async (invoice) => {
    const { total: invoiceTotal } = getInvoiceTotals(invoice);
    await base44.entities.Invoice.update(invoice.id, { paid_amount: invoiceTotal, status: "مدفوعة" });
    await loadInvoices();
  };

  const handlePrint = (invoice) => setPreviewInvoice(invoice);

  const buildInvoiceMessage = (invoice) => {
    const { total: invoiceTotal, remaining, paid } = getInvoiceTotals(invoice);
    return `مرحباً ${invoice.client_name || ""},\n\nبخصوص الفاتورة رقم ${invoice.invoice_number || ""}:\nإجمالي الفاتورة: ${invoiceTotal.toLocaleString()} د.إ\nالمدفوع: ${paid.toLocaleString()} د.إ\nالمتبقي: ${remaining.toLocaleString()} د.إ\n${invoice.due_date ? `تاريخ الاستحقاق: ${invoice.due_date}\n` : ""}\nنرجو السداد أو التواصل معنا عند الحاجة.`;
  };

  const handleSendWhatsApp = (invoice) => {
    const client = clientLookup[invoice.client_name] || {};
    const phone = String(client.phone || "").replace(/\D+/g, "");
    const text = encodeURIComponent(buildInvoiceMessage(invoice));
    window.open(phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`, "_blank");
  };

  const handleSendEmail = (invoice) => {
    const client = clientLookup[invoice.client_name] || {};
    const subject = encodeURIComponent(`فاتورة ${invoice.invoice_number || ""}`);
    const body = encodeURIComponent(`${buildInvoiceMessage(invoice)}\n\n${officeSettings?.office_name || ""}\n${officeSettings?.phone || ""}`);
    window.location.href = `mailto:${client.email || ""}?subject=${subject}&body=${body}`;
  };

  const handleSendReminder = async (invoice) => {
    const officeEmail = officeSettings?.email;
    if (officeEmail) {
      await base44.entities.Notification.create({
        title: "تذكير متابعة فاتورة",
        message: `متابعة الفاتورة ${invoice.invoice_number || ""} للموكل ${invoice.client_name || ""}`,
        type: "عام",
        reference_id: invoice.id,
        reference_type: "Invoice",
        user_email: officeEmail,
      });
    }
    handleSendWhatsApp(invoice);
  };

  const printInvoice = () => {
    const printContent = document.querySelector(".helm-invoice-print-root");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=980,height=1200,scrollbars=yes");
    if (!win) return alert("تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.");
    win.document.open();
    win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>فاتورة ${previewInvoice?.invoice_number || ""}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"><style>html,body{margin:0;padding:0;background:#fff;direction:rtl;overflow:visible;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:'Cairo',Arial,sans-serif}.print-actions{padding:12px;background:#0f172a;color:#fff;display:flex;justify-content:center;gap:8px;position:sticky;top:0;z-index:99999}.print-actions button{border:0;border-radius:12px;padding:10px 16px;font-weight:900;cursor:pointer}@page{size:A4;margin:9mm}@media print{.print-actions{display:none!important}html,body{width:auto!important;height:auto!important;overflow:visible!important}}</style></head><body><div class="print-actions"><button onclick="window.print()">طباعة / حفظ PDF</button><button onclick="window.close()">إغلاق</button></div>${printContent.outerHTML}<script>window.onload=function(){setTimeout(function(){window.focus();window.print()},450)}</script></body></html>`);
    win.document.close();
  };

  const totalsSource = isClient ? allInvoices : allInvoices.filter((invoice) => getInvoicePortalScope(invoice) === portalFilter);
  const totals = totalsSource.reduce((acc, invoice) => {
    const { total: invoiceTotal, paid, remaining } = getInvoiceTotals(invoice);
    acc.totalFees += invoiceTotal;
    acc.totalPaid += paid;
    acc.totalRemaining += remaining;
    if (invoice.status === "متأخرة") acc.overdueCount += 1;
    return acc;
  }, { totalFees: 0, totalPaid: 0, totalRemaining: 0, overdueCount: 0 });

  const sourceRows = statusFilter === "مكررة" ? allInvoices.filter((invoice) => duplicateInvoiceIds.has(invoice.id)) : invoices;
  const scopedInvoices = isClient ? sourceRows : sourceRows.filter((invoice) => getInvoicePortalScope(invoice) === portalFilter);
  const filtered = scopedInvoices.filter((invoice) => {
    const matchSearch = searchInFields(invoice, ["client_name", "invoice_number", "case_title", "office_name"], search);
    const matchStatus = statusFilter === "الكل" || statusFilter === "مكررة" || invoice.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader title={isClient ? "فواتيري" : "الفواتير"} subtitle={`${filtered.length} فاتورة ظاهرة من أصل ${total}`} action={!isClient ? <Button onClick={handleCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" /> إنشاء فاتورة</Button> : undefined} />

      {!isClient && duplicateGroups.length > 0 && (
        <Card className="border-red-300 bg-red-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" /><div><h3 className="font-black text-red-950">تم اكتشاف {duplicateGroups.length} مجموعة فواتير محتملة التكرار</h3><p className="mt-1 text-sm font-bold leading-7 text-red-800">لا تُحذف تلقائياً حفاظاً على القيود المالية. راجع كل مجموعة، احتفظ بالفاتورة الصحيحة، ثم انقل أو صحح المدفوعات قبل حذف النسخة الزائدة.</p><div className="mt-2 flex flex-wrap gap-2">{duplicateGroups.slice(0,5).map((group) => <Badge key={group.key} className="border border-red-200 bg-white text-red-900"><Copy className="h-3 w-3" /> {group.records.map((record) => record.invoice_number || 'بدون رقم').join(' / ')}</Badge>)}</div></div></div>
            <Button variant="outline" onClick={() => { setStatusFilter('مكررة'); setPage(1); }}>عرض المكررات</Button>
          </div>
        </Card>
      )}

      {!isClient && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button type="button" variant={portalFilter === PORTAL_SCOPE_HELM ? "default" : "outline"} onClick={() => setPortalFilter(PORTAL_SCOPE_HELM)} className={`h-14 justify-start gap-3 ${portalFilter === PORTAL_SCOPE_HELM ? "bg-primary text-white" : ""}`}><Scale className="h-5 w-5" /><span className="text-right"><b>حلمي بروتال</b><br /><span className="text-xs opacity-80">{portalCounts[PORTAL_SCOPE_HELM] || 0} فاتورة</span></span></Button>
          <Button type="button" variant={portalFilter === PORTAL_SCOPE_BADAYAT ? "default" : "outline"} onClick={() => setPortalFilter(PORTAL_SCOPE_BADAYAT)} className={`h-14 justify-start gap-3 ${portalFilter === PORTAL_SCOPE_BADAYAT ? "bg-amber-700 text-white hover:bg-amber-800" : "border-amber-200 text-amber-800 hover:bg-amber-50"}`}><Building2 className="h-5 w-5" /><span className="text-right"><b>بداية الخير</b><br /><span className="text-xs opacity-80">{portalCounts[PORTAL_SCOPE_BADAYAT] || 0} فاتورة</span></span></Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">إجمالي الأتعاب</p><p className="text-lg font-bold text-foreground">{totals.totalFees.toLocaleString()} <span className="text-xs font-normal">د.إ</span></p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-muted-foreground">المبالغ المحصلة</p><p className="text-lg font-bold text-green-600">{totals.totalPaid.toLocaleString()} <span className="text-xs font-normal">د.إ</span></p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-red-500" /></div><div><p className="text-xs text-muted-foreground">المبالغ المتبقية</p><p className="text-lg font-bold text-red-500">{totals.totalRemaining.toLocaleString()} <span className="text-xs font-normal">د.إ</span></p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center"><FileText className="h-5 w-5 text-yellow-600" /></div><div><p className="text-xs text-muted-foreground">فواتير متأخرة</p><p className="text-lg font-bold text-yellow-600">{totals.overdueCount}</p></div></div></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input ref={searchRef} placeholder="بحث بالموكل أو رقم الفاتورة أو القضية..." value={search} onChange={(event) => setSearch(event.target.value)} className="pr-10 h-11" /></div>
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}><SelectTrigger className="w-44 h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="الكل">كل الحالات</SelectItem>{!isClient && <SelectItem value="مكررة">المكررات فقط</SelectItem>}{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>
      </div>

      {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div> : loadError ? <PageErrorState message={loadError} onRetry={loadInvoices} /> : filtered.length === 0 ? <EmptyState icon={FileText} title="لا توجد فواتير" description="لا توجد فواتير مطابقة للقسم أو الفلتر الحالي" action={!isClient ? <Button onClick={handleCreate}>إنشاء فاتورة</Button> : undefined} /> : <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filtered.map((invoice) => <div key={invoice.id} className="relative">{duplicateInvoiceIds.has(invoice.id) && !isClient && <Badge className="absolute left-3 top-3 z-10 border-0 bg-red-600 text-white">مكررة محتملة</Badge>}<InvoiceCard invoice={invoice} onEdit={handleEdit} onDelete={handleDelete} onPrint={handlePrint} onMarkPaid={handleMarkPaid} onSendWhatsApp={handleSendWhatsApp} onSendEmail={handleSendEmail} onSendReminder={handleSendReminder} officeSettings={officeSettings} isClient={isClient} /></div>)}</div>
        {statusFilter !== 'مكررة' && <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage} />}
      </>}

      <InvoiceFormDialog open={showForm} onOpenChange={setShowForm} invoice={editing} onSaved={() => { setShowForm(false); loadInvoices(); }} />
      <Dialog open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}><DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none max-h-[95vh] overflow-auto" dir="rtl">{previewInvoice && <div className="space-y-4"><div className="flex items-center justify-end gap-2 px-3 sticky top-0 z-10"><Button onClick={printInvoice}>طباعة / PDF</Button></div><InvoicePDF invoice={previewInvoice} officeSettings={officeSettings} /></div>}</DialogContent></Dialog>
    </div>
  );
}
