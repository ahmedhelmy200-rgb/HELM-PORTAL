import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ChoiceInput from "@/components/shared/ChoiceInput";
import DateSmartInput from "@/components/shared/DateSmartInput";
import { PORTAL_SCOPE_HELM, PORTAL_SCOPE_BADAYAT, getInvoicePortalScope, invoiceScopeFields } from "@/lib/portalScopes";
import { findInvoiceDuplicates } from "@/lib/dataIntegrity";
import { getInvoiceTotals } from "@/lib/invoiceMath";

const emptyForm = {
  invoice_number: "",
  client_id: null,
  client_name: "",
  case_id: "",
  case_title: "",
  case_number: "",
  issue_date: new Date().toISOString().split("T")[0],
  due_date: "",
  total_fees: "",
  paid_amount: "",
  discount: "",
  vat_rate: "5",
  status: "مسودة",
  items: [],
  notes: "",
  payment_method: "",
  office_name: "",
  office_phone: "",
  office_address: "",
  portal_scope: PORTAL_SCOPE_HELM,
  business_unit: PORTAL_SCOPE_HELM,
};

const STATUSES = ["مسودة", "صادرة", "مدفوعة جزئياً", "مدفوعة", "متأخرة", "ملغاة"];
const PAYMENT_METHODS = ["نقداً", "تحويل بنكي", "شيك", "بطاقة ائتمان", "رابط دفع", "أخرى"];
const PORTAL_SCOPE_OPTIONS = [
  { value: PORTAL_SCOPE_HELM, label: "حلمي بروتال" },
  { value: PORTAL_SCOPE_BADAYAT, label: "بداية الخير" },
];

function stripScopeFields(payload) {
  const { portal_scope, business_unit, ...rest } = payload;
  return rest;
}

function isMissingScopeColumn(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("portal_scope") || message.includes("business_unit") || message.includes("schema cache");
}

export default function InvoiceFormDialog({ open, onOpenChange, invoice, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [officeSettings, setOfficeSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [caseRows, clientRows, invoiceRows, settings] = await Promise.all([
        base44.entities.Case.list("-created_date", 2000),
        base44.entities.Client.list("full_name", 2000),
        base44.entities.Invoice.list("-created_date", 3000),
        base44.entities.OfficeSettings.list(),
      ]);
      setCases(caseRows || []);
      setClients(clientRows || []);
      setAllInvoices(invoiceRows || []);
      setOfficeSettings(settings?.[0] || null);
    };
    if (open) load();
  }, [open]);

  useEffect(() => {
    if (invoice) {
      const scope = getInvoicePortalScope(invoice);
      setForm({ ...emptyForm, ...invoice, ...invoiceScopeFields(scope), items: invoice.items || [] });
      return;
    }
    setForm({
      ...emptyForm,
      ...invoiceScopeFields(PORTAL_SCOPE_HELM),
      invoice_number: `INV-${Date.now().toString().slice(-8)}`,
      office_name: officeSettings?.office_name || "",
      office_phone: officeSettings?.phone || "",
      office_address: officeSettings?.address || "",
    });
  }, [invoice, open, officeSettings]);

  const setScope = (scope) => {
    setForm((previous) => {
      const nextScope = scope === PORTAL_SCOPE_BADAYAT ? PORTAL_SCOPE_BADAYAT : PORTAL_SCOPE_HELM;
      const scopeFields = invoiceScopeFields(nextScope);
      if (nextScope === PORTAL_SCOPE_BADAYAT) {
        return { ...previous, ...scopeFields, office_name: "شركة بداية الخير", office_phone: previous.office_phone || officeSettings?.phone || "", office_address: previous.office_address || "الإمارات العربية المتحدة" };
      }
      return { ...previous, ...scopeFields, office_name: officeSettings?.office_name || previous.office_name || "أحمد حلمي للاستشارات القانونية", office_phone: officeSettings?.phone || previous.office_phone || "", office_address: officeSettings?.address || previous.office_address || "" };
    });
  };

  const handleClientSelect = (value) => {
    const selected = clients.find((client) => client.id === value || client.full_name === value);
    if (!selected) {
      setForm((previous) => ({ ...previous, client_id: null, client_name: value }));
      return;
    }
    setForm((previous) => ({ ...previous, client_id: selected.id, client_name: selected.full_name }));
  };

  const handleCaseSelect = (caseTitle) => {
    const selected = cases.find((item) => item.title === caseTitle || item.id === caseTitle);
    if (!selected) {
      setForm((previous) => ({ ...previous, case_title: caseTitle, case_id: "" }));
      return;
    }
    const selectedClient = clients.find((client) => client.id === selected.client_id || client.full_name === selected.client_name);
    setForm((previous) => ({
      ...previous,
      case_id: selected.id,
      case_title: selected.title,
      case_number: selected.case_number || "",
      client_id: selected.client_id || selectedClient?.id || previous.client_id || null,
      client_name: selected.client_name || selectedClient?.full_name || previous.client_name,
      total_fees: selected.fees ? String(selected.fees) : previous.total_fees,
      paid_amount: selected.paid_amount ? String(selected.paid_amount) : previous.paid_amount,
    }));
  };

  const addItem = () => setForm((previous) => ({ ...previous, items: [...previous.items, { description: "", amount: "" }] }));
  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: field === "amount" ? (value === "" ? "" : Number(value)) : value };
    setForm((previous) => ({ ...previous, items }));
  };
  const removeItem = (index) => setForm((previous) => ({ ...previous, items: previous.items.filter((_, itemIndex) => itemIndex !== index) }));
  const itemsTotal = form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const previewPayload = useMemo(() => ({
    ...form,
    total_fees: form.items.length > 0 ? itemsTotal : (Number(form.total_fees) || 0),
    paid_amount: Number(form.paid_amount) || 0,
    discount: Number(form.discount) || 0,
    vat_rate: Number(form.vat_rate) || 0,
  }), [form, itemsTotal]);

  const duplicateMatches = useMemo(() => findInvoiceDuplicates(previewPayload, allInvoices, invoice?.id, getInvoiceTotals), [previewPayload, allInvoices, invoice?.id]);

  const handleSave = async () => {
    const scope = form.portal_scope === PORTAL_SCOPE_BADAYAT ? PORTAL_SCOPE_BADAYAT : PORTAL_SCOPE_HELM;
    const payload = {
      ...form,
      ...invoiceScopeFields(scope),
      total_fees: form.items.length > 0 ? itemsTotal : (Number(form.total_fees) || 0),
      paid_amount: Number(form.paid_amount) || 0,
      discount: Number(form.discount) || 0,
      vat_rate: Number(form.vat_rate) || 0,
      items: form.items.map((item) => ({ ...item, amount: Number(item.amount) || 0 })),
    };

    const duplicates = findInvoiceDuplicates(payload, allInvoices, invoice?.id, getInvoiceTotals);
    if (duplicates.length) {
      const details = duplicates.slice(0, 4).map((match) => `${match.record.invoice_number || 'فاتورة بدون رقم'} — ${match.matchedFields.join('، ')}`).join('\n');
      alert(`تم منع الحفظ لوجود فاتورة مطابقة:\n\n${details}\n\nعدّل الفاتورة الموجودة بدل إنشاء نسخة جديدة.`);
      return;
    }

    setSaving(true);
    try {
      try {
        if (invoice) await base44.entities.Invoice.update(invoice.id, payload);
        else await base44.entities.Invoice.create(payload);
      } catch (error) {
        if (!isMissingScopeColumn(error)) throw error;
        const legacyPayload = stripScopeFields(payload);
        if (invoice) await base44.entities.Invoice.update(invoice.id, legacyPayload);
        else await base44.entities.Invoice.create(legacyPayload);
      }
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader><DialogTitle>{invoice ? "تعديل الفاتورة" : "إنشاء فاتورة جديدة"}</DialogTitle></DialogHeader>

        <div className="space-y-5 mt-2">
          {duplicateMatches.length > 0 && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900">
              <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">فاتورة مطابقة موجودة بالفعل</p><p className="mt-1 text-xs font-bold leading-6">سيتم منع الحفظ حتى يتم تغيير رقم الفاتورة أو الموكل أو القضية أو التاريخ أو المبلغ.</p></div></div>
            </div>
          )}

          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
            <Label className="mb-2 block">بوابة الفاتورة</Label>
            <div className="grid grid-cols-2 gap-2">
              {PORTAL_SCOPE_OPTIONS.map((option) => <Button key={option.value} type="button" variant={form.portal_scope === option.value ? "default" : "outline"} className={form.portal_scope === option.value ? "bg-primary text-white" : ""} onClick={() => setScope(option.value)}>{option.label}</Button>)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">يتم فحص رقم الفاتورة داخل القسم المختار لمنع تكراره.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>رقم الفاتورة</Label><Input value={form.invoice_number} onChange={event => setForm(previous => ({ ...previous, invoice_number: event.target.value }))} className="h-11" /></div>
            <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={value => setForm(previous => ({ ...previous, status: value }))} options={STATUSES} listId="invoice-statuses" /></div>
            <div className="space-y-1"><Label>تاريخ الإصدار *</Label><DateSmartInput type="date" value={form.issue_date} onChange={value => setForm(previous => ({ ...previous, issue_date: value }))} /></div>
            <div className="space-y-1"><Label>تاريخ الاستحقاق</Label><DateSmartInput type="date" value={form.due_date} onChange={value => setForm(previous => ({ ...previous, due_date: value }))} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>القضية</Label><ChoiceInput value={form.case_title} onChange={handleCaseSelect} options={cases.map(item => item.title)} listId="invoice-cases" helper="اختيار القضية يربط الفاتورة بالموكل تلقائياً" /></div>
            <div className="space-y-1"><Label>اسم الموكل *</Label><ChoiceInput value={form.client_name} onChange={handleClientSelect} options={clients.map(client => client.full_name)} listId="clients-invoice-list" helper="يُحفظ الربط بالمعرف والاسم معاً" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1"><Label>اسم الجهة المطبوعة</Label><Input value={form.office_name} onChange={event => setForm(previous => ({ ...previous, office_name: event.target.value }))} className="h-11" /></div>
            <div className="space-y-1"><Label>هاتف الجهة</Label><Input value={form.office_phone} onChange={event => setForm(previous => ({ ...previous, office_phone: event.target.value }))} className="h-11" /></div>
            <div className="space-y-1"><Label>عنوان الجهة</Label><Input value={form.office_address} onChange={event => setForm(previous => ({ ...previous, office_address: event.target.value }))} className="h-11" /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2"><Label>بنود الفاتورة</Label><Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1 text-xs"><Plus className="h-3 w-3" /> إضافة بند</Button></div>
            {form.items.length > 0 ? <div className="space-y-2">{form.items.map((item, index) => <div key={index} className="flex gap-2 items-center"><Input placeholder="وصف البند" value={item.description} onChange={event => updateItem(index, "description", event.target.value)} className="flex-1 h-11" /><Input type="number" placeholder="المبلغ" value={item.amount} onChange={event => updateItem(index, "amount", event.target.value)} className="w-36 h-11" /><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-destructive h-11 w-11"><Trash2 className="h-4 w-4" /></Button></div>)}<div className="text-left text-sm font-medium text-primary mt-1">المجموع: {itemsTotal.toLocaleString()} د.إ</div></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1"><Label>إجمالي الأتعاب (درهم) *</Label><Input type="number" value={form.total_fees} onChange={event => setForm(previous => ({ ...previous, total_fees: event.target.value }))} className="h-11" /></div></div>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1"><Label>المبلغ المدفوع</Label><Input type="number" value={form.paid_amount} onChange={event => setForm(previous => ({ ...previous, paid_amount: event.target.value }))} className="h-11" /></div>
            <div className="space-y-1"><Label>الخصم</Label><Input type="number" value={form.discount} onChange={event => setForm(previous => ({ ...previous, discount: event.target.value }))} className="h-11" /></div>
            <div className="space-y-1"><Label>ضريبة القيمة المضافة %</Label><Input type="number" value={form.vat_rate} onChange={event => setForm(previous => ({ ...previous, vat_rate: event.target.value }))} className="h-11" /></div>
          </div>

          <div className="space-y-1"><Label>طريقة الدفع</Label><ChoiceInput value={form.payment_method} onChange={value => setForm(previous => ({ ...previous, payment_method: value }))} options={PAYMENT_METHODS} listId="invoice-payment-methods" /></div>
          <div className="space-y-1"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={event => setForm(previous => ({ ...previous, notes: event.target.value }))} className="min-h-[100px]" /></div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving || !form.client_name || !form.issue_date || duplicateMatches.length > 0} className="bg-primary text-white">{saving ? "جارٍ الفحص والحفظ..." : invoice ? "حفظ التعديلات" : "إنشاء الفاتورة"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
