import { BADAYAT_APPROVED_LOGO_DATA_URI } from "@/lib/badayatLogoData";

export const PORTAL_SCOPE_HELM = "helm_portal";
export const PORTAL_SCOPE_BADAYAT = "badayat_al_khair";

const BADAYAT_TERMS = [
  "بداية الخير",
  "بدايه الخير",
  "badayat",
  "bidayat",
  "badayat al khair",
  "bidayat al khair",
];

export const PORTAL_SCOPES = {
  HELM: {
    id: PORTAL_SCOPE_HELM,
    businessUnit: PORTAL_SCOPE_HELM,
    label: "حلمي بروتال",
    officeName: "أحمد حلمي للاستشارات القانونية",
    officeNameEn: "HELM Legal Consultancy",
    slogan: "بوابة حلمي بروتال القانونية",
    signatureText: "أحمد حلمي",
    initials: "HL",
    defaultPrimary: "#0f172a",
    defaultSecondary: "#1d4ed8",
    logoUrl: null,
  },
  BADAYAT: {
    id: PORTAL_SCOPE_BADAYAT,
    businessUnit: PORTAL_SCOPE_BADAYAT,
    label: "بوابة بداية الخير",
    officeName: "شركة بداية الخير",
    officeNameEn: "BADAYAT AL KHAIR",
    slogan: "للسيارات وإدارة المعاملات والخدمات",
    signatureText: "بداية الخير",
    initials: "BK",
    defaultPrimary: "#0f172a",
    defaultSecondary: "#b45309",
    logoUrl: BADAYAT_APPROVED_LOGO_DATA_URI,
  },
};

export function normalizePortalScope(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (!raw) return "";
  if ([PORTAL_SCOPE_BADAYAT, "badayat", "bidayat", "badayat_alkhair", "bidayat_alkhair", "badayat_al_khair", "bidayat_al_khair"].includes(raw)) {
    return PORTAL_SCOPE_BADAYAT;
  }
  if ([PORTAL_SCOPE_HELM, "helm", "helmy", "helmy_portal", "helm_legal", "helm_smart"].includes(raw)) {
    return PORTAL_SCOPE_HELM;
  }
  return raw;
}

export function getInvoicePortalScope(invoice = {}) {
  const directScope = normalizePortalScope(invoice.portal_scope || invoice.business_unit || invoice.scope || invoice.portalScope);
  if (directScope === PORTAL_SCOPE_BADAYAT) return PORTAL_SCOPE_BADAYAT;
  if (directScope === PORTAL_SCOPE_HELM) return PORTAL_SCOPE_HELM;

  const haystack = [
    invoice.office_name,
    invoice.client_name,
    invoice.case_title,
    invoice.case_number,
    invoice.notes,
    invoice.description,
  ].filter(Boolean).join(" ").toLowerCase();

  if (BADAYAT_TERMS.some((term) => haystack.includes(term))) return PORTAL_SCOPE_BADAYAT;
  return PORTAL_SCOPE_HELM;
}

export function isBadayatInvoice(invoice = {}) {
  return getInvoicePortalScope(invoice) === PORTAL_SCOPE_BADAYAT;
}

export function isHelmPortalInvoice(invoice = {}) {
  return getInvoicePortalScope(invoice) === PORTAL_SCOPE_HELM;
}

export function invoiceScopeFields(scopeId = PORTAL_SCOPE_HELM) {
  const scope = normalizePortalScope(scopeId) === PORTAL_SCOPE_BADAYAT ? PORTAL_SCOPE_BADAYAT : PORTAL_SCOPE_HELM;
  return {
    portal_scope: scope,
    business_unit: scope,
  };
}

export function getInvoiceBrand(invoice = {}, settings = {}) {
  const scopeId = getInvoicePortalScope(invoice);
  const isBadayat = scopeId === PORTAL_SCOPE_BADAYAT;
  const base = isBadayat ? PORTAL_SCOPES.BADAYAT : PORTAL_SCOPES.HELM;

  return {
    scopeId,
    isBadayat,
    label: base.label,
    officeName: isBadayat ? base.officeName : (invoice.office_name || settings.office_name || base.officeName),
    officeNameEn: isBadayat ? base.officeNameEn : (settings.office_name_en || base.officeNameEn),
    slogan: isBadayat ? base.slogan : (settings.invoice_header_text || settings.lawyer_name || base.slogan),
    signatureText: isBadayat ? base.signatureText : (settings.signature_text || settings.lawyer_name || base.signatureText),
    initials: base.initials,
    logoUrl: isBadayat ? base.logoUrl : (settings.logo_url || null),
    stampUrl: settings.stamp_url || null,
    signatureUrl: !isBadayat ? (settings.signature_url || null) : null,
    primaryColor: settings.primary_color || base.defaultPrimary,
    secondaryColor: settings.secondary_color || base.defaultSecondary,
    phone: settings.phone || invoice.office_phone || "",
    email: settings.email || "",
    address: settings.address || invoice.office_address || "الإمارات العربية المتحدة",
    website: settings.website || "",
    currency: settings.currency || "د.إ",
    footerText: settings.invoice_footer_text || "شكراً لثقتكم بنا",
    bankName: settings.bank_name || "",
    bankAccount: settings.bank_account || "",
    iban: settings.iban || "",
    vatNumber: settings.vat_number || "",
  };
}
