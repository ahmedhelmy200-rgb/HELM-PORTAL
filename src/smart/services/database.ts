import { base44 } from '@/api/base44Client';
import { supabase } from '@/integrations/supabase/client';
import { Client, LegalCase, CaseStatus, CaseCategory, Invoice, Expense, ExpenseCategory, FutureDebt, LegalDocument } from '../types';

/**
 * قاعدة بيانات Smart بعد الدمج النهائي:
 * - لا تستخدم جداول payload الخاصة بالنسخة القديمة.
 * - مصدر الحقيقة هو نفس جداول Portal: clients/cases/invoices/documents/expenses.
 * - التخزين يتم عبر bucket uploads من خلال base44.integrations.Core.UploadFile.
 * - الصلاحيات/RLS مصدرها Supabase migrations في مجلد supabase/migrations.
 */

type AnyRow = Record<string, any>;

type MemoryStore = Record<string, string>;
const memoryStore: MemoryStore = (globalThis as any).__HELM_MEMORY_STORE__ || ((globalThis as any).__HELM_MEMORY_STORE__ = {} as MemoryStore);

const clientNameCache = new Map<string, string>();
const caseTitleCache = new Map<string, string>();
const caseNumberCache = new Map<string, string>();

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return memoryStore[key] ?? null; }
}

function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { memoryStore[key] = value; }
}

function storageKey(table: string): string {
  return `helm_unified_smart_${table}`;
}

function dateOnly(value?: string | null): string {
  if (!value) return new Date().toLocaleDateString('en-CA');
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return raw;
}

function toNumber(value: any, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeCaseStatus(value?: string | null): CaseStatus {
  const raw = String(value || '').trim();
  const values = Object.values(CaseStatus) as string[];
  if (values.includes(raw)) return raw as CaseStatus;
  if (raw.includes('مؤرشف')) return CaseStatus.ARCHIVED;
  if (raw.includes('حكم')) return CaseStatus.JUDGMENT;
  if (raw.includes('استئناف')) return CaseStatus.APPEAL;
  if (raw.includes('مغلق') || raw.includes('منته')) return CaseStatus.CLOSED;
  if (raw.includes('تحضير')) return CaseStatus.PREP;
  return CaseStatus.ACTIVE;
}

function normalizeCaseCategory(value?: string | null): CaseCategory {
  const raw = String(value || '').trim();
  const values = Object.values(CaseCategory) as string[];
  if (values.includes(raw)) return raw as CaseCategory;
  if (raw.includes('جز')) return CaseCategory.CRIMINAL;
  if (raw.includes('عمال')) return CaseCategory.LABOR;
  if (raw.includes('تجار')) return CaseCategory.COMMERCIAL;
  if (raw.includes('أحوال') || raw.includes('أسرة')) return CaseCategory.FAMILY;
  if (raw.includes('إيجار')) return CaseCategory.RENTAL;
  if (raw.includes('تنفيذ')) return CaseCategory.EXECUTION;
  if (raw.includes('إدار')) return CaseCategory.ADMINISTRATIVE;
  return CaseCategory.CIVIL;
}

function normalizeDocCategory(value?: string | null): LegalDocument['category'] {
  const raw = String(value || '').trim();
  const allowed = ['Contract', 'Judgment', 'Memo', 'Receipt', 'Other', 'EmiratesID', 'Passport', 'License'];
  if (allowed.includes(raw)) return raw as LegalDocument['category'];
  if (raw.includes('عقد')) return 'Contract';
  if (raw.includes('حكم')) return 'Judgment';
  if (raw.includes('مذكرة')) return 'Memo';
  if (raw.includes('إيصال') || raw.includes('فاتورة')) return 'Receipt';
  if (raw.includes('هوية')) return 'EmiratesID';
  if (raw.includes('جواز')) return 'Passport';
  if (raw.includes('رخصة')) return 'License';
  return 'Other';
}

function isDataUrl(value?: string | null): boolean {
  return typeof value === 'string' && value.startsWith('data:');
}

function dataUrlMime(value: string): string {
  const match = value.match(/^data:([^;,]+)[;,]/);
  return match?.[1] || 'application/octet-stream';
}

async function dataUrlToFile(dataUrl: string, fileName = 'upload.bin', mimeType?: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType || blob.type || dataUrlMime(dataUrl) });
}

async function uploadDataUrlIfNeeded(uri?: string | null, fileName?: string, mimeType?: string, folder = 'smart-documents'): Promise<string | null> {
  if (!uri) return null;
  if (!isDataUrl(uri)) return uri;
  const file = await dataUrlToFile(uri, fileName || `document-${Date.now()}`, mimeType);
  const uploaded = await base44.integrations.Core.UploadFile({ file, folder });
  return uploaded?.storage_ref || uploaded?.file_url || uri;
}

async function resolveFileUrl(value?: string | null): Promise<string> {
  if (!value) return '';
  if (isDataUrl(value)) return value;
  try {
    const resolved = await base44.integrations.Core.ResolveFileUrl({ file_url: value });
    return resolved?.file_url || value;
  } catch {
    return value;
  }
}

function fromPortalClient(row: AnyRow): Client {
  const id = String(row.id || '');
  const name = row.full_name || row.name || '';
  if (id && name) clientNameCache.set(id, name);
  return {
    id,
    name,
    email: row.email || '',
    phone: row.phone || '',
    emiratesId: row.id_number || row.emirates_id || '',
    address: row.address || '',
    type: String(row.client_type || '').includes('شركة') || row.type === 'Corporate' ? 'Corporate' : 'Individual',
    createdAt: dateOnly(row.created_date || row.createdAt),
    documents: Array.isArray(row.documents) ? row.documents : [],
    totalCases: toNumber(row.totalCases, 0),
    profileImage: row.avatar_url || row.profileImage || undefined,
    balance: toNumber(row.balance, 0),
  };
}

function toPortalClient(data: Partial<Client>): AnyRow {
  const payload: AnyRow = {
    full_name: data.name || (data as any).full_name || 'موكل بدون اسم',
    client_type: data.type === 'Corporate' ? 'شركة' : 'فرد',
    id_number: data.emiratesId || (data as any).id_number || null,
    phone: data.phone || '',
    email: data.email || null,
    address: data.address || null,
    status: 'نشط',
    documents: Array.isArray(data.documents) ? data.documents : [],
    balance: toNumber(data.balance, 0),
  };
  if (data.profileImage && !isDataUrl(data.profileImage)) payload.avatar_url = data.profileImage;
  return payload;
}

function fromPortalCase(row: AnyRow): LegalCase {
  const id = String(row.id || '');
  const title = row.title || row.case_title || 'قضية بدون عنوان';
  const caseNumber = row.case_number || row.caseNumber || '';
  if (id) {
    caseTitleCache.set(id, title);
    caseNumberCache.set(id, caseNumber);
  }
  return {
    id,
    caseNumber,
    title,
    category: normalizeCaseCategory(row.case_type || row.category),
    subCategory: row.sub_category || row.subCategory || undefined,
    clientId: row.client_id ? String(row.client_id) : '',
    clientName: row.client_name || '',
    opponentName: row.opponent_name || '',
    court: row.court || '',
    status: normalizeCaseStatus(row.status),
    totalFee: toNumber(row.fees ?? row.totalFee, 0),
    paidAmount: toNumber(row.paid_amount ?? row.paidAmount, 0),
    createdAt: dateOnly(row.created_date || row.createdAt),
    nextHearingDate: row.next_session_date ? dateOnly(row.next_session_date) : undefined,
    isArchived: Boolean(row.is_archived || String(row.status || '').includes('مؤرشف')),
    documents: Array.isArray(row.documents) ? row.documents : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    activities: Array.isArray(row.activities) ? row.activities : [],
    assignedLawyer: row.assigned_lawyer || undefined,
  };
}

function toPortalCase(data: Partial<LegalCase>): AnyRow {
  const clientName = data.clientName || (data.clientId ? clientNameCache.get(String(data.clientId)) : '') || 'موكل غير محدد';
  return {
    case_number: data.caseNumber || '',
    title: data.title || 'قضية بدون عنوان',
    client_id: data.clientId || null,
    client_name: clientName,
    case_type: data.category || CaseCategory.CIVIL,
    court: data.court || null,
    status: data.status || CaseStatus.ACTIVE,
    next_session_date: data.nextHearingDate || null,
    description: (data as any).description || null,
    fees: toNumber(data.totalFee, 0),
    paid_amount: toNumber(data.paidAmount, 0),
    opponent_name: data.opponentName || null,
    assigned_lawyer: data.assignedLawyer || null,
    sub_category: data.subCategory || null,
    is_archived: Boolean(data.isArchived),
    documents: Array.isArray(data.documents) ? data.documents : [],
    comments: Array.isArray(data.comments) ? data.comments : [],
    activities: Array.isArray(data.activities) ? data.activities : [],
  };
}

function invoiceStatus(row: AnyRow): Invoice['status'] {
  const raw = String(row.status || '').trim();
  if (raw === 'Paid' || raw.includes('مدفوع')) return 'Paid';
  if (raw === 'Partially Paid' || raw.includes('جزئ')) return 'Partially Paid';
  return 'Unpaid';
}

function fromPortalInvoice(row: AnyRow): Invoice {
  const id = String(row.id || '');
  const total = toNumber(row.total_fees ?? row.amount, 0);
  const paid = toNumber(row.paid_amount ?? row.paidAmount, 0);
  let status: Invoice['status'] = invoiceStatus(row);
  if (!row.status) status = paid >= total && total > 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Unpaid';
  const clientId = row.client_id ? String(row.client_id) : '';
  if (clientId && row.client_name) clientNameCache.set(clientId, row.client_name);
  return {
    id,
    clientId,
    caseId: row.case_id ? String(row.case_id) : undefined,
    amount: total,
    paidAmount: paid,
    status,
    date: dateOnly(row.issue_date || row.date || row.created_date),
    description: row.notes || row.invoice_number || row.description || '',
    branch: row.branch || undefined,
  };
}

function toPortalInvoice(data: Partial<Invoice>): AnyRow {
  const clientId = data.clientId ? String(data.clientId) : '';
  const caseId = data.caseId ? String(data.caseId) : '';
  const amount = toNumber(data.amount, 0);
  const paid = toNumber(data.paidAmount, 0);
  const status = paid >= amount && amount > 0 ? 'مدفوعة' : paid > 0 ? 'مدفوعة جزئياً' : 'غير مدفوعة';
  return {
    invoice_number: (data as any).invoiceNumber || `INV-${Date.now()}`,
    client_id: clientId || null,
    client_name: clientNameCache.get(clientId) || (data as any).clientName || 'موكل غير محدد',
    case_id: caseId || null,
    case_title: caseTitleCache.get(caseId) || null,
    case_number: caseNumberCache.get(caseId) || null,
    issue_date: dateOnly(data.date),
    due_date: null,
    total_fees: amount,
    paid_amount: paid,
    status,
    notes: data.description || null,
    branch: data.branch || null,
    items: [{ description: data.description || 'أتعاب قانونية', amount }],
  };
}

function normalizeExpenseCategory(value?: string | null): ExpenseCategory {
  const raw = String(value || '').trim();
  const values = Object.values(ExpenseCategory) as string[];
  if (values.includes(raw)) return raw as ExpenseCategory;
  if (raw.includes('قضية')) return ExpenseCategory.CASE_RELATED;
  if (raw.includes('شخص')) return ExpenseCategory.PERSONAL;
  if (raw.includes('تشغيل')) return ExpenseCategory.GENERAL_OPERATIONAL;
  return ExpenseCategory.OFFICE;
}

function fromPortalExpense(row: AnyRow): Expense {
  return {
    id: String(row.id || ''),
    amount: toNumber(row.amount, 0),
    category: normalizeExpenseCategory(row.category),
    description: row.title || row.notes || row.description || '',
    date: dateOnly(row.expense_date || row.date || row.created_date),
    caseId: row.case_id ? String(row.case_id) : undefined,
    branch: row.branch || undefined,
  };
}

function toPortalExpense(data: Partial<Expense>): AnyRow {
  const caseId = data.caseId ? String(data.caseId) : '';
  return {
    title: data.description || 'مصروف',
    amount: toNumber(data.amount, 0),
    category: data.category || ExpenseCategory.OFFICE,
    expense_date: dateOnly(data.date),
    case_id: caseId || null,
    case_title: caseTitleCache.get(caseId) || null,
    notes: data.description || null,
    status: 'مدفوع',
    branch: data.branch || null,
  };
}

async function fromPortalDocument(row: AnyRow): Promise<LegalDocument> {
  const clientId = row.client_id ? String(row.client_id) : '';
  if (clientId && row.client_name) clientNameCache.set(clientId, row.client_name);
  const caseId = row.case_id ? String(row.case_id) : undefined;
  return {
    id: String(row.id || ''),
    title: row.title || row.file_name || 'مستند',
    category: normalizeDocCategory(row.doc_type || row.category),
    uri: await resolveFileUrl(row.file_url || row.uri),
    uploadDate: dateOnly(row.created_date || row.uploadDate),
    caseId,
    clientId,
    fileName: row.file_name || row.fileName || undefined,
    mimeType: row.file_type || row.mimeType || undefined,
    clientName: row.client_name || (clientId ? clientNameCache.get(clientId) : undefined),
    caseTitle: row.case_title || (caseId ? caseTitleCache.get(caseId) : undefined),
  };
}

async function toPortalDocument(data: Partial<LegalDocument>): Promise<AnyRow> {
  const clientId = data.clientId ? String(data.clientId) : '';
  const caseId = data.caseId ? String(data.caseId) : '';
  const fileUrl = await uploadDataUrlIfNeeded(data.uri, data.fileName, data.mimeType, 'smart-documents');
  return {
    title: data.title || data.fileName || 'مستند',
    client_id: clientId || null,
    client_name: data.clientName || clientNameCache.get(clientId) || 'موكل غير محدد',
    case_id: caseId || null,
    case_title: data.caseTitle || caseTitleCache.get(caseId) || null,
    case_number: caseNumberCache.get(caseId) || null,
    doc_type: data.category || 'Other',
    file_url: fileUrl,
    file_name: data.fileName || null,
    file_type: data.mimeType || null,
    status: 'مرفوع',
    folder: 'حلم سمارت',
  };
}

function fromPortalFutureDebt(row: AnyRow): FutureDebt {
  return {
    id: String(row.id || ''),
    clientName: row.client_name || row.clientName || '',
    clientId: row.client_id ? String(row.client_id) : undefined,
    amount: toNumber(row.amount, 0),
    dueDate: dateOnly(row.due_date || row.dueDate),
    description: row.description || '',
    isReminded: Boolean(row.is_reminded || row.isReminded),
  };
}

function toPortalFutureDebt(data: Partial<FutureDebt>): AnyRow {
  const clientId = data.clientId ? String(data.clientId) : '';
  return {
    client_id: clientId || null,
    client_name: data.clientName || clientNameCache.get(clientId) || 'موكل غير محدد',
    amount: toNumber(data.amount, 0),
    due_date: dateOnly(data.dueDate),
    description: data.description || '',
    is_reminded: Boolean(data.isReminded),
  };
}

const tableAdapters: Record<string, {
  entity?: string;
  from: (row: AnyRow) => any | Promise<any>;
  to: (row: any) => AnyRow | Promise<AnyRow>;
}> = {
  clients: { entity: 'Client', from: fromPortalClient, to: toPortalClient },
  cases: { entity: 'Case', from: fromPortalCase, to: toPortalCase },
  invoices: { entity: 'Invoice', from: fromPortalInvoice, to: toPortalInvoice },
  expenses: { entity: 'Expense', from: fromPortalExpense, to: toPortalExpense },
  documents: { entity: 'Document', from: fromPortalDocument, to: toPortalDocument },
  future_debts: { entity: 'FutureDebt', from: fromPortalFutureDebt, to: toPortalFutureDebt },
};

async function mapRows(adapter: typeof tableAdapters[string], rows: AnyRow[]): Promise<any[]> {
  const mapped = await Promise.all((rows || []).map((row) => adapter.from(row)));
  if (adapter === tableAdapters.clients) {
    for (const client of mapped) if (client.id && client.name) clientNameCache.set(client.id, client.name);
  }
  if (adapter === tableAdapters.cases) {
    for (const item of mapped) {
      if (item.id) {
        caseTitleCache.set(item.id, item.title || '');
        caseNumberCache.set(item.id, item.caseNumber || '');
      }
    }
  }
  return mapped;
}

async function fetchViaBase44(table: string): Promise<any[]> {
  const adapter = tableAdapters[table];
  if (!adapter?.entity) return [];
  const entityApi = (base44.entities as any)[adapter.entity];
  if (!entityApi?.list) return [];
  const sortField = table === 'future_debts' ? '-created_date' : '-created_date';
  const rows = await entityApi.list(sortField, 1000);
  return mapRows(adapter, rows || []);
}

async function saveViaBase44(table: string, row: any): Promise<any> {
  const adapter = tableAdapters[table];
  if (!adapter?.entity) return row;
  const entityApi = (base44.entities as any)[adapter.entity];
  if (!entityApi?.create) return row;
  const payload = await adapter.to(row);
  const saved = await entityApi.create(payload);
  return adapter.from(saved);
}

async function updateViaBase44(table: string, id: string, row: any): Promise<any> {
  const adapter = tableAdapters[table];
  if (!adapter?.entity) return row;
  const entityApi = (base44.entities as any)[adapter.entity];
  if (!entityApi?.update) return row;
  const payload = await adapter.to(row);
  const saved = await entityApi.update(id, payload);
  return adapter.from(saved);
}

async function deleteViaBase44(table: string, id: string): Promise<boolean> {
  const adapter = tableAdapters[table];
  if (!adapter?.entity) return true;
  const entityApi = (base44.entities as any)[adapter.entity];
  if (!entityApi?.delete) return true;
  await entityApi.delete(id);
  return true;
}

function localFetch(table: string): any[] {
  const saved = safeGet(storageKey(table));
  if (!saved) return [];
  try { return JSON.parse(saved); } catch { return []; }
}

function localSave(table: string, row: any): any {
  const current = localFetch(table);
  const id = row?.id || Math.random().toString(36).slice(2);
  const next = { ...row, id };
  safeSet(storageKey(table), JSON.stringify([next, ...current.filter((item: any) => item?.id !== id)]));
  return next;
}

function localUpdate(table: string, id: string, row: any): any {
  const current = localFetch(table);
  const next = { ...row, id };
  safeSet(storageKey(table), JSON.stringify(current.map((item: any) => item?.id === id ? next : item)));
  return next;
}

function localRemove(table: string, id: string): boolean {
  const current = localFetch(table);
  safeSet(storageKey(table), JSON.stringify(current.filter((item: any) => item?.id !== id)));
  return true;
}

export const db = {
  setOffice(_officeId: string | null) {
    // محفوظ للتوافق فقط. النسخة الموحدة لا تستخدم مكتب Smart منفصل.
  },

  async fetchAll(table: string) {
    await new Promise(resolve => setTimeout(resolve, 60));
    try {
      return await fetchViaBase44(table);
    } catch (error) {
      console.warn(`[Smart DB] Supabase/Base44 fetch failed for ${table}; using local fallback.`, error);
      return localFetch(table);
    }
  },

  async save(table: string, data: any) {
    try {
      return await saveViaBase44(table, data);
    } catch (error) {
      console.error(`[Smart DB] save failed for ${table}; using local fallback.`, error);
      return localSave(table, data);
    }
  },

  async update(table: string, id: string, updatedData: any) {
    try {
      return await updateViaBase44(table, id, updatedData);
    } catch (error) {
      console.error(`[Smart DB] update failed for ${table}; using local fallback.`, error);
      return localUpdate(table, id, updatedData);
    }
  },

  async remove(table: string, id: string) {
    try {
      return await deleteViaBase44(table, id);
    } catch (error) {
      console.error(`[Smart DB] delete failed for ${table}; using local fallback.`, error);
      return localRemove(table, id);
    }
  },

  async replaceAll(table: string, rows: any[]) {
    // استيراد كامل لا يستخدم حاليًا في الواجهة؛ نحتفظ به للتوافق.
    safeSet(storageKey(table), JSON.stringify(rows || []));
    return true;
  },
};

export async function smartUploadFile(file: File, folder = 'smart-documents') {
  return base44.integrations.Core.UploadFile({ file, folder });
}

export { supabase };
