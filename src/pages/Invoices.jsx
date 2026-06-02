import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Search, FileText, TrendingUp, DollarSign, AlertCircle, MessageCircle, Mail, Send, Building2, Scale } from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import EmptyState from "../components/helm/EmptyState";
import InvoiceCard from "../components/invoices/InvoiceCard";
import InvoiceFormDialog from "../components/invoices/InvoiceFormDialog";
import InvoicePDF from "../components/invoices/InvoicePDF";
import { useAuth } from "@/lib/AuthContext";
import { searchInFields } from "@/lib/search";
import { getInvoiceTotals } from "@/lib/invoiceMath";
import { PageErrorState } from "@/components/app/AppStatusBar";
import PaginationControls from "@/components/shared/PaginationControls";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { PORTAL_SCOPE_HELM, PORTAL_SCOPE_BADAYAT, getInvoicePortalScope } from "@/lib/portalScopes";

export default function Invoices() {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const [invoices, setInvoices] = useState([]);
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
      const [{ data: invoiceRows, total: totalRows }, clientRows, officeRows] = await Promise.all([
        base44.entities.Invoice.listPage("-created_date", { page, pageSize }),
        base44.entities.Client.list("full_name", 300),
        base44.entities.OfficeSettings.list(),
      ]);
      setInvoices(invoiceRows);
      setClients(clientRows);
      setOfficeSettings(officeRows?.[0] || null);
      setTotal(totalRows);
    } catch (error) {
      setLoadError(error.message || "تعذر تحميل الفواتير.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);
  usePageRefresh(loadInvoices, ["invoices", "clients", "office_settings"]);

  useEffect(() => {
    const offNew = subscribeAppEvent(APP_SHORTCUT_NEW, ({ page: p }) => !isClient && p === "Invoices" && handleCreate());
    const offSearch = subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page: p }) => p === "Invoices" && searchRef.current?.focus());
    return () => { offNew(); offSearch(); };
  }, [isClient]);

  const clientLookup = useMemo(() => Object.fromEntries(clients.map((client) => [client.full_name, client])), [clients]);
  const portalCounts = useMemo(() => invoices.reduce((acc, inv) => {
    const scope = getInvoicePortalScope(inv);
    acc[scope] = (acc[scope] || 0) + 1;
    return acc;
  }, { [PORTAL_SCOPE_HELM]: 0, [PORTAL_SCOPE_BADAYAT]: 0 }), [invoices]);

  const handleEdit = (inv) => { setEditing(inv); setShowForm(true); };
  const handleCreate = () => { setEditing(null); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;
    await base44.entities.Invoice.delete(id);
    await loadInvoices();
  };

  const handleMarkPaid = async (inv) => {
    const { total } = getInvoiceTotals(inv);
    await base44.entities.Invoice.update(inv.id, { paid_amount: total, status: "مدفوعة" });
    await loadInvoices();
  };

  const handlePrint = (inv) => setPreviewInvoice(inv);

  const buildInvoiceMessage = (invoice) => {
    const { total, remaining, paid } = getInvoiceTotals(invoice);
    return `مرحباً ${invoice.client_name || ""},\n\nبخصوص الفاتورة رقم ${invoice.invoice_number || ""}:\nإجمالي الفاتورة: ${total.toLocaleString()} د.إ\nالمدفوع: ${paid.toLocaleString()} د.إ\nالمتبقي: ${remaining.toLocaleString()} د.إ\n${invoice.due_date ? `تاريخ الاستحقاق: ${invoice.due_date}\n` : ""}\nنرجو السداد أو التواصل معنا عند الحاجة.`;
  };

  const handleSendWhatsApp = (invoice) => {
    const client = clientLookup[invoice.client_name] || {};
    const phone = String(client.phone || "").replace(/\D+/g, "");
    const text = encodeURIComponent(buildInvoiceMessage(invoice));
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
      return;
    }
    window.open(`https://wa.me/?text=${text}`, "_blank");
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
    win.document.write(`
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>فاتورة ${previewInvoice?.invoice_number || ""}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            html, body { margin:0; padding:0; background:#fff; direction:rtl; overflow:visible; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
            body { font-family:'Cairo', Arial, sans-serif; }
            .print-actions { padding:12px; background:#0f172a; color:#fff; display:flex; justify-content:center; gap:8px; position:sticky; top:0; z-index:99999; }
            .print-actions button { border:0; border-radius:12px; padding:10px 16px; font-weight:900; cursor:pointer; }
            @page { size:A4; margin:9mm; }
            @media print { .print-actions { display:none !important; } html, body { width:auto !important; height:auto !important; overflow:visible !important; } }
          </style>
        </head>
        <body>
          <div class="print-actions">
            <button onclick="window.print()">طباعة / حفظ PDF</button>
            <button onclick="window.close()">إغلاق</button>
          </div>
          ${printContent.outerHTML}
          <script>
            window.onload = function(){ setTimeout(function(){ window.focus(); window.print(); }, 450); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const scopedInvoices = invoices.filter((inv) => getInvoicePortalScope(inv) === portalFilter);
  const filtered = scopedInvoices.filter(inv => {
    const matchSearch = searchInFields(inv, ["client_name", "invoice_number", "case_title", "office_name"], search);
    const matchStatus = statusFilter === "الكل" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = scopedInvoices.reduce((acc, inv) => {
    const { total, paid, remaining } = getInvoiceTotals(inv);
    acc.totalFees += total;
    acc.totalPaid += paid;
    acc.totalRemaining += remaining;
    if (inv.status === "متأخرة") acc.overdueCount += 1;
    return acc;
  }, { totalFees: 0, totalPaid: 0, totalRemaining: 0, overdueCount: 0 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="الفواتير"
        subtitle={`${filtered.length} فاتورة ظاهرة من أصل ${total}`}
        action={!isClient ? <Button onClick={handleCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4" /> إنشاء فاتورة</Button> : undefined}
      />

      {!isClient && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            variant={portalFilter === PORTAL_SCOPE_HELM ? "default" : "outline"}
            onClick={() => setPortalFilter(PORTAL_SCOPE_HELM)}
            className={`h-14 justify-start gap-3 ${portalFilter === PORTAL_SCOPE_HELM ? "bg-primary text-white" : ""}`}
          >
            <Scale className="h-5 w-5" />
            <span className="text-right"><b>حلمي بروتال</b><br /><span className="text-xs opacity-80">{portalCounts[PORTAL_SCOPE_HELM] || 0} فاتورة</span></span>
          </Button>
          <Button
            type="button"
            variant={portalFilter === PORTAL_SCOPE_BADAYAT ? "default" : "outline"}
            onClick={() => setPortalFilter(PORTAL_SCOPE_BADAYAT)}
            className={`h-14 justify-start gap-3 ${portalFilter === PORTAL_SCOPE_BADAYAT ? "bg-amber-700 text-white hover:bg-amber-800" : "border-amber-200 text-amber-800 hover:bg-amber-50"}`}
          >
            <Building2 className="h-5 w-5" />
            <span className="text-right"><b>بداية الخير</b><br /><span className="text-xs opacity-80">{portalCounts[PORTAL_SCOPE_BADAYAT] || 0} فاتورة</span></span>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">إجمالي الأتعاب</p><p className="text-lg font-bold text-foreground">{totals.totalFees.toLocaleString()} <span className="text-xs font-normal">د.إ</span></p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-muted-foreground">المبالغ المحصلة</p><p className="text-lg font-bold text-green-600">{totals.totalPaid.toLocaleString()} <span className="text-xs font-normal">د.إ</span></p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-red-500" /></div><div><p className="text-xs text-muted-foreground">المبالغ المتبقية</p><p className="text-lg font-bold text-red-500">{totals.totalRemaining.toLocaleString()} <span className="text-xs font-normal">د.إ</span></p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center"><FileText className="h-5 w-5 text-yellow-600" /></div><div><p className="text-xs text-muted-foreground">فواتير متأخرة</p><p className="text-lg font-bold text-yellow-600">{totals.overdueCount}</p></div></div></Card>
      </div>

      {!isClient && (
        <Card className="p-4 border-primary/10 bg-primary/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">إرسال سريع للموكلين</h3>
              <p className="text-sm text-muted-foreground">الأزرار مفعّلة على كل فاتورة: واتساب، بريد، وتذكير متابعة. الفلترة الحالية لا تخلط بين حلمي بروتال وبداية الخير.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2"><MessageCircle className="h-4 w-4" /> واتساب</Button>
              <Button variant="outline" className="gap-2"><Mail className="h-4 w-4" /> بريد</Button>
              <Button variant="outline" className="gap-2"><Send className="h-4 w-4" /> تذكير</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input ref={searchRef} placeholder="بحث بالموكل أو رقم الفاتورة أو القضية..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-11" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل">كل الحالات</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadInvoices} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد فواتير" description="لا توجد فواتير مطابقة لهذا القسم أو الفلتر الحالي" action={!isClient ? <Button onClick={handleCreate}>إنشاء فاتورة</Button> : undefined} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(inv => (
              <InvoiceCard key={inv.id} invoice={inv} onEdit={handleEdit} onDelete={handleDelete} onPrint={handlePrint} onMarkPaid={handleMarkPaid} onSendWhatsApp={handleSendWhatsApp} onSendEmail={handleSendEmail} onSendReminder={handleSendReminder} officeSettings={officeSettings} isClient={isClient} />
            ))}
          </div>
          <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      <InvoiceFormDialog open={showForm} onOpenChange={setShowForm} invoice={editing} onSaved={() => { setShowForm(false); loadInvoices(); }} />

      <Dialog open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none max-h-[95vh] overflow-auto" dir="rtl">
          {previewInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-end gap-2 px-3 sticky top-0 z-10">
                <Button onClick={printInvoice}>طباعة / PDF</Button>
              </div>
              <InvoicePDF invoice={previewInvoice} officeSettings={officeSettings} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
