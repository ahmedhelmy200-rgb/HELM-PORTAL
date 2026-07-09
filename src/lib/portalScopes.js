export const PORTAL_SCOPE_HELM = "helm_portal";

// Legacy alias retained only to prevent old records/imports from breaking.
// All rendering and new writes are forced back to HELM Portal.
export const PORTAL_SCOPE_BADAYAT = "badayat_al_khair";

const HELM_SCOPE = {
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
};

export const PORTAL_SCOPES = {
  HELM: HELM_SCOPE,
  BADAYAT: {
    ...HELM_SCOPE,
    id: PORTAL_SCOPE_BADAYAT,
    businessUnit: PORTAL_SCOPE_HELM,
  },
};

export function normalizePortalScope(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (!raw) return "";
  return PORTAL_SCOPE_HELM;
}

export function getInvoicePortalScope() {
  return PORTAL_SCOPE_HELM;
}

export function isBadayatInvoice() {
  return false;
}

export function isHelmPortalInvoice(invoice = {}) {
  return getInvoicePortalScope(invoice) === PORTAL_SCOPE_HELM;
}

export function invoiceScopeFields() {
  return {
    portal_scope: PORTAL_SCOPE_HELM,
    business_unit: PORTAL_SCOPE_HELM,
  };
}

export function getInvoiceBrand(invoice = {}, settings = {}) {
  const base = PORTAL_SCOPES.HELM;

  return {
    scopeId: PORTAL_SCOPE_HELM,
    isBadayat: false,
    label: base.label,
    officeName: invoice.office_name || settings.office_name || base.officeName,
    officeNameEn: settings.office_name_en || base.officeNameEn,
    slogan: settings.invoice_header_text || settings.lawyer_name || base.slogan,
    signatureText: settings.signature_text || settings.lawyer_name || base.signatureText,
    initials: base.initials,
    logoUrl: settings.logo_url || null,
    stampUrl: settings.stamp_url || null,
    signatureUrl: settings.signature_url || null,
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
