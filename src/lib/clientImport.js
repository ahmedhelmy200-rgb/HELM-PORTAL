const BADAYAT_STORAGE_KEY = 'helm_badayat_al_khair_module_v2';
const IMPORT_BATCH_SIZE = 25;

const BADAYAT_TERMS = [
  /بداية\s*الخير/gi,
  /بدايه\s*الخير/gi,
  /badayat\s*al\s*khair/gi,
  /bidayat\s*al\s*khair/gi,
  /badayat/gi,
  /bidayat/gi,
];

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function stripRemovedBusinessTerms(value = '') {
  let next = cleanText(value);
  BADAYAT_TERMS.forEach((pattern) => {
    next = next.replace(pattern, '').replace(/\s{2,}/g, ' ').trim();
  });
  return next;
}

function normalizePhone(value = '') {
  return String(value || '').replace(/[^0-9+]/g, '').replace(/^00/, '+');
}

function normalizeEmail(value = '') {
  return cleanText(value).toLowerCase();
}

function uniqueValues(values = []) {
  return [...new Set(values.map(cleanText).filter(Boolean))];
}

function keyOfClient(client = {}) {
  const phones = [client.phone, client.mobile, client.phone_number].map(normalizePhone).filter(Boolean);
  const emails = [client.email].map(normalizeEmail).filter(Boolean);
  const idNumber = cleanText(client.id_number || client.emiratesId || client.emirates_id);
  const name = cleanText(client.full_name || client.name).toLowerCase();
  return { phones, emails, idNumber, name };
}

function buildExistingIndex(existingClients = []) {
  const index = new Set();
  existingClients.forEach((client) => {
    const key = keyOfClient(client);
    key.phones.forEach((phone) => index.add(`p:${phone}`));
    key.emails.forEach((email) => index.add(`e:${email}`));
    if (key.idNumber) index.add(`id:${key.idNumber}`);
    if (key.name) index.add(`n:${key.name}`);
  });
  return index;
}

function hasDuplicate(index, client = {}) {
  const key = keyOfClient(client);
  return (
    key.phones.some((phone) => index.has(`p:${phone}`)) ||
    key.emails.some((email) => index.has(`e:${email}`)) ||
    (key.idNumber && index.has(`id:${key.idNumber}`)) ||
    (key.name && index.has(`n:${key.name}`))
  );
}

function addToIndex(index, client = {}) {
  const key = keyOfClient(client);
  key.phones.forEach((phone) => index.add(`p:${phone}`));
  key.emails.forEach((email) => index.add(`e:${email}`));
  if (key.idNumber) index.add(`id:${key.idNumber}`);
  if (key.name) index.add(`n:${key.name}`);
}

function parseCsv(text = '') {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += ch;
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = (rows.shift() || []).map(cleanText);
  return rows
    .filter((r) => r.some((v) => cleanText(v)))
    .map((r) => Object.fromEntries(headers.map((h, idx) => [h, r[idx] || ''])));
}

function googleContactToClient(row = {}) {
  const name = cleanText([
    row['First Name'],
    row['Middle Name'],
    row['Last Name'],
  ].filter(Boolean).join(' ')) || cleanText(row['File As']) || cleanText(row['Nickname']) || 'جهة اتصال بدون اسم';

  const phones = uniqueValues([
    row['Phone 1 - Value'],
    row['Phone 2 - Value'],
    row['Phone 3 - Value'],
    row['Phone 4 - Value'],
  ]);
  const emails = uniqueValues([
    row['E-mail 1 - Value'],
    row['E-mail 2 - Value'],
    row['E-mail 3 - Value'],
  ]);
  const organization = cleanText(row['Organization Name']);
  const title = cleanText(row['Organization Title']);
  const department = cleanText(row['Organization Department']);
  const address = cleanText(row['Address 1 - Formatted'] || row['Address 1 - Street']);
  const sourceNotes = uniqueValues([
    organization && `الجهة: ${organization}`,
    title && `الصفة/المسمى: ${title}`,
    department && `القسم: ${department}`,
    row['Labels'] && `تصنيف جهة الاتصال: ${row['Labels']}`,
    phones.length > 1 && `أرقام إضافية: ${phones.slice(1).join(' / ')}`,
    emails.length > 1 && `بريد إضافي: ${emails.slice(1).join(' / ')}`,
    row['Notes'] && `ملاحظات أصلية: ${row['Notes']}`,
  ]).join('\n');

  return {
    full_name: name,
    client_type: organization ? 'مؤسسة' : 'فرد',
    id_number: '',
    phone: phones[0] || '',
    email: emails[0] || '',
    address,
    nationality: '',
    notes: sourceNotes,
    status: 'نشط',
  };
}

function employeeToClient(emp = {}) {
  const extra = uniqueValues([
    emp.jobTitle && `المسمى السابق: ${stripRemovedBusinessTerms(emp.jobTitle)}`,
    emp.department && `القسم السابق: ${stripRemovedBusinessTerms(emp.department)}`,
    emp.contractType && `نوع العقد السابق: ${stripRemovedBusinessTerms(emp.contractType)}`,
    emp.residencyStatus && `حالة الإقامة/التصريح: ${stripRemovedBusinessTerms(emp.residencyStatus)}`,
    emp.residencyExpiry && `انتهاء الإقامة: ${emp.residencyExpiry}`,
    emp.workPermitExpiry && `انتهاء تصريح العمل: ${emp.workPermitExpiry}`,
    emp.passportNo && `رقم الجواز: ${emp.passportNo}`,
    emp.notes && `ملاحظات ملف الموظف السابق: ${stripRemovedBusinessTerms(emp.notes)}`,
  ]).join('\n');

  return {
    full_name: stripRemovedBusinessTerms(emp.fullName || emp.name || 'موظف سابق'),
    client_type: 'فرد',
    id_number: cleanText(emp.emiratesId || emp.passportNo || ''),
    phone: cleanText(emp.phone || ''),
    email: normalizeEmail(emp.email || ''),
    address: '',
    nationality: cleanText(emp.nationality || ''),
    notes: extra,
    status: 'نشط',
  };
}

async function createMissingClients({ base44, incomingClients, existingClients = [], onProgress }) {
  const index = buildExistingIndex(existingClients);
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < incomingClients.length; i += 1) {
    const client = incomingClients[i];
    if (!cleanText(client.full_name) || hasDuplicate(index, client)) {
      skipped += 1;
      continue;
    }

    try {
      await base44.entities.Client.create(client);
      addToIndex(index, client);
      created += 1;
    } catch (error) {
      console.error('[client-import] failed row:', client, error);
      failed += 1;
    }

    if ((created + failed) % IMPORT_BATCH_SIZE === 0) {
      onProgress?.({ created, skipped, failed, current: i + 1, total: incomingClients.length });
      await delay(50);
    }
  }

  onProgress?.({ created, skipped, failed, current: incomingClients.length, total: incomingClients.length });
  return { created, skipped, failed, total: incomingClients.length };
}

export async function importContactsCsvFile({ file, base44, existingClients = [], onProgress }) {
  if (!file) throw new Error('اختر ملف CSV أولًا.');
  const text = await file.text();
  const rows = parseCsv(text);
  const incomingClients = rows.map(googleContactToClient).filter((client) => cleanText(client.full_name));
  return createMissingClients({ base44, incomingClients, existingClients, onProgress });
}

export async function importFormerEmployeesFromLocalData({ base44, existingClients = [], onProgress }) {
  let employees = [];
  try {
    const saved = JSON.parse(localStorage.getItem(BADAYAT_STORAGE_KEY) || 'null');
    employees = Array.isArray(saved?.employees) ? saved.employees : [];
  } catch {
    employees = [];
  }

  const incomingClients = employees.map(employeeToClient).filter((client) => cleanText(client.full_name));
  const result = await createMissingClients({ base44, incomingClients, existingClients, onProgress });

  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) || '';
      if (/badayat|bidayat|بداية\s*الخير|بدايه\s*الخير/i.test(key)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {}

  return { ...result, sourceEmployees: employees.length };
}
