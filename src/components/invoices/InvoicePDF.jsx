import React from "react";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { getInvoiceTotals } from "@/lib/invoiceMath";

const FIXED_LOGO_URL = "/badayat-logo.svg?v=approved-accf2f75";
const FIXED_OFFICE_NAME = "شركة بداية الخير";
const FIXED_OFFICE_NAME_EN = "BADAYAT AL KHAIR";
const FIXED_OFFICE_SLOGAN = "للسيارات وإدارة المعاملات والخدمات";
const FIXED_SIGNATURE_TEXT = "بداية الخير";

function safeDate(value) {
  if (!value) return "---";
  try { return format(new Date(value), "yyyy/MM/dd"); } catch { return String(value); }
}

function money(value, currency = "د.إ") {
  const n = Number(value || 0);
  return `${n.toLocaleString()} ${currency}`;
}

function markLogoFailed(event) {
  const img = event.currentTarget;
  img.style.display = "none";
  if (img.parentElement) img.parentElement.setAttribute("data-logo-failed", "true");
}

export default function InvoicePDF({ invoice, officeSettings }) {
  const { appPublicSettings } = useAuth();
  const settings = { ...(appPublicSettings || {}), ...(officeSettings || {}) };

  const primaryColor = settings?.primary_color || "#0f172a";
  const secondaryColor = settings?.secondary_color || "#b45309";
  const currency = settings?.currency || "د.إ";
  const totals = getInvoiceTotals(invoice || {});
  const subtotal = Number(totals.subtotal ?? invoice?.total_fees ?? invoice?.amount ?? 0);
  const total = Number(totals.total ?? subtotal);
  const paid = Number(totals.paid ?? invoice?.paid_amount ?? 0);
  const remaining = Number(totals.remaining ?? Math.max(0, total - paid));
  const vat = Number(totals.vat ?? 0);

  const officeName = FIXED_OFFICE_NAME;
  const officeNameEn = FIXED_OFFICE_NAME_EN;
  const officePhone = settings?.phone || invoice?.office_phone || "";
  const officeEmail = settings?.email || "";
  const officeAddress = settings?.address || invoice?.office_address || "الإمارات العربية المتحدة";
  const officeWebsite = settings?.website || "";
  const logoUrl = FIXED_LOGO_URL;
  const stampUrl = settings?.stamp_url || null;
  const bankName = settings?.bank_name || "";
  const bankAccount = settings?.bank_account || "";
  const iban = settings?.iban || "";
  const vatNumber = settings?.vat_number || "";
  const footerText = settings?.invoice_footer_text || "شكراً لثقتكم بنا";
  const headerText = FIXED_OFFICE_SLOGAN;

  const statusColors = {
    "مدفوعة": "#16a34a",
    "مدفوعة جزئياً": "#f59e0b",
    "متأخرة": "#dc2626",
    "صادرة": primaryColor,
    "مسودة": "#6b7280",
    "ملغاة": "#6b7280",
  };
  const statusColor = statusColors[invoice?.status] || primaryColor;

  const items = Array.isArray(invoice?.items) && invoice.items.length
    ? invoice.items
    : [{ description: invoice?.description || "خدمات ومعاملات", amount: invoice?.total_fees || invoice?.amount || total }];

  return (
    <div id="invoice-print-area" dir="rtl" className="helm-invoice-print-root">
      <style>{`
        .helm-invoice-print-root, .helm-invoice-print-root * { box-sizing: border-box; }
        .helm-invoice-sheet {
          font-family: 'Cairo', 'Arial', sans-serif;
          width: 100%;
          max-width: 794px;
          min-height: 1123px;
          margin: 0 auto;
          background: #fff;
          color: #0f172a;
          position: relative;
          overflow: visible;
          border: 1px solid #e5e7eb;
        }
        .helm-letterhead {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}e6 100%);
          color: #fff;
          padding: 26px 34px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          border-bottom: 6px solid ${secondaryColor};
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .helm-office-block { display:flex; align-items:center; gap:14px; min-width:0; }
        .helm-logo-box {
          width:92px;
          height:92px;
          border-radius:22px;
          background:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:4px;
          flex-shrink:0;
          box-shadow:0 14px 30px rgba(0,0,0,.18);
          border:2px solid rgba(180,83,9,.55);
          position:relative;
          overflow:hidden;
        }
        .helm-logo-box img { width:100%; height:100%; object-fit:contain; display:block; }
        .helm-logo-box::after {
          content:'BK';
          display:none;
          align-items:center;
          justify-content:center;
          position:absolute;
          inset:0;
          font-size:34px;
          font-weight:900;
          color:#92400e;
          background:#fff;
          font-family:Georgia,serif;
        }
        .helm-logo-box[data-logo-failed="true"]::after { display:flex; }
        .helm-contact-line { display:flex; gap:10px; flex-wrap:wrap; margin-top:7px; color:rgba(255,255,255,.82); font-size:11px; line-height:1.7; }
        .helm-invoice-label { text-align:left; flex-shrink:0; }
        .helm-invoice-label-card { border:1px solid rgba(255,255,255,.35); background:rgba(255,255,255,.13); border-radius:16px; padding:12px 18px; text-align:center; min-width:170px; }
        .helm-body { padding: 24px 34px 18px; position:relative; z-index:1; }
        .helm-watermark { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; opacity:.065; transform:rotate(-28deg); z-index:0; }
        .helm-watermark-inner { display:flex; flex-direction:column; align-items:center; gap:18px; }
        .helm-watermark img { width:330px; max-width:62%; filter:grayscale(1); object-fit:contain; }
        .helm-watermark span { font-size:40px; font-weight:900; color:${primaryColor}; letter-spacing:.03em; white-space:nowrap; }
        .helm-info-grid { display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:18px; break-inside:avoid; page-break-inside:avoid; }
        .helm-info-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:14px; }
        .helm-info-card small { display:block; color:#64748b; font-size:10px; font-weight:900; margin-bottom:6px; letter-spacing:.04em; }
        .helm-table { width:100%; border-collapse:collapse; margin:14px 0 18px; table-layout:fixed; }
        .helm-table thead { display:table-header-group; }
        .helm-table tr { break-inside:avoid; page-break-inside:avoid; }
        .helm-table th { background:${primaryColor}; color:#fff; padding:11px 12px; font-size:12px; text-align:right; }
        .helm-table td { border-bottom:1px solid #e2e8f0; padding:10px 12px; font-size:12px; vertical-align:top; overflow-wrap:anywhere; }
        .helm-summary-row { display:grid; grid-template-columns: 1fr 300px; gap:18px; align-items:start; break-inside:avoid; page-break-inside:avoid; }
        .helm-payment-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:16px; padding:13px; font-size:12px; line-height:1.8; }
        .helm-notes-box { background:#fffbeb; border:1px solid #fde68a; border-radius:16px; padding:13px; font-size:12px; line-height:1.8; margin-top:10px; }
        .helm-total-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:13px; }
        .helm-total-line { display:flex; justify-content:space-between; gap:10px; padding:7px 0; border-bottom:1px solid #e2e8f0; font-size:12px; }
        .helm-total-final { display:flex; justify-content:space-between; gap:10px; padding:11px 0; border-bottom:2px solid ${primaryColor}; font-size:15px; font-weight:900; color:${primaryColor}; }
        .helm-remaining { display:flex; justify-content:space-between; gap:10px; margin-top:9px; padding:12px; border-radius:12px; font-weight:900; background:${remaining > 0 ? "#fef2f2" : "#f0fdf4"}; color:${remaining > 0 ? "#dc2626" : "#16a34a"}; }
        .helm-footer { border-top:4px solid ${secondaryColor}; background:linear-gradient(135deg, ${primaryColor}0f 0%, #fff 100%); padding:16px 34px 20px; position:relative; z-index:1; break-inside:avoid; page-break-inside:avoid; }
        .helm-footer-content { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; }
        .helm-official-images { display:flex; align-items:flex-end; gap:16px; flex-shrink:0; min-width:220px; justify-content:flex-end; }
        .helm-official-images img { object-fit:contain; display:block; }
        .helm-stamp-img { max-width:100px; max-height:88px; opacity:.9; }
        .helm-signature-box { min-width:170px; text-align:center; transform:rotate(-5deg); }
        .helm-signature-text { font-family:'Noto Nastaliq Urdu','Aref Ruqaa','Diwani Letter','Amiri','Scheherazade New','Cairo',serif; font-size:34px; font-weight:900; color:#111827; line-height:1.25; letter-spacing:-1px; }
        .helm-signature-line { width:150px; height:2px; margin:0 auto 3px; background:linear-gradient(90deg, transparent, #111827, transparent); opacity:.78; }
        .helm-signature-label { font-size:10px; color:#64748b; font-weight:800; margin-top:2px; text-align:center; transform:rotate(5deg); }
        @page { size: A4; margin: 10mm; }
        @media print {
          html, body { width:auto !important; min-height:auto !important; margin:0 !important; padding:0 !important; background:#fff !important; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; overflow:visible !important; }
          .helm-invoice-sheet { width:100% !important; max-width:none !important; min-height:auto !important; border:0 !important; box-shadow:none !important; overflow:visible !important; }
          .helm-letterhead { padding:16px 0 14px !important; margin-bottom:8px !important; }
          .helm-body { padding:14px 0 10px !important; }
          .helm-footer { padding:12px 0 0 !important; }
          .helm-watermark { opacity:.05 !important; }
          .helm-logo-box { print-color-adjust:exact !important; -webkit-print-color-adjust:exact !important; }
        }
        @media screen and (max-width: 760px) {
          .helm-invoice-sheet { max-width:100%; min-height:auto; border:0; }
          .helm-letterhead { flex-direction:column; align-items:stretch; padding:20px; }
          .helm-invoice-label { text-align:right; }
          .helm-invoice-label-card { width:100%; }
          .helm-body { padding:18px; }
          .helm-info-grid, .helm-summary-row { grid-template-columns:1fr; }
          .helm-footer { padding:16px 18px; }
          .helm-footer-content { flex-direction:column; align-items:stretch; }
          .helm-official-images { justify-content:flex-start; }
        }
      `}</style>

      <div className="helm-invoice-sheet">
        <div className="helm-watermark">
          <div className="helm-watermark-inner">
            <img src={logoUrl} alt="watermark" onError={(event) => { event.currentTarget.style.display = "none"; }} />
            <span>{officeName}</span>
          </div>
        </div>

        <header className="helm-letterhead">
          <div className="helm-office-block">
            <div className="helm-logo-box"><img src={logoUrl} alt="شعار بداية الخير" onError={markLogoFailed} /></div>
            <div>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900 }}>{officeName}</h1>
              <div style={{ marginTop: 3, color: "rgba(255,255,255,.82)", fontSize: 12, fontWeight: 700 }}>{officeNameEn}</div>
              <div style={{ marginTop: 4, color: "rgba(255,255,255,.78)", fontSize: 11 }}>{headerText}</div>
              <div className="helm-contact-line">
                {officePhone && <span>هاتف: {officePhone}</span>}
                {officeEmail && <span>بريد: {officeEmail}</span>}
                {officeWebsite && <span>موقع: {officeWebsite}</span>}
                {officeAddress && <span>العنوان: {officeAddress}</span>}
              </div>
            </div>
          </div>

          <div className="helm-invoice-label">
            <div className="helm-invoice-label-card">
              <div style={{ fontSize: 11, opacity: .84, fontWeight: 800 }}>فاتورة رقم</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 3 }}>{invoice?.invoice_number || "---"}</div>
              <div style={{ fontSize: 11, marginTop: 7, opacity: .8 }}>تاريخ الإصدار: {safeDate(invoice?.issue_date || invoice?.created_date)}</div>
              {invoice?.due_date && <div style={{ fontSize: 11, marginTop: 2, opacity: .8 }}>الاستحقاق: {safeDate(invoice.due_date)}</div>}
            </div>
          </div>
        </header>

        <main className="helm-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: primaryColor }}>فاتورة</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>Invoice</p>
            </div>
            <div style={{ padding: "7px 17px", borderRadius: 999, fontSize: 13, fontWeight: 900, color: statusColor, background: `${statusColor}14`, border: `2px solid ${statusColor}33` }}>{invoice?.status || "صادرة"}</div>
          </div>

          <section className="helm-info-grid">
            <div className="helm-info-card">
              <small>بيانات العميل</small>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{invoice?.client_name || "—"}</div>
            </div>
            <div className="helm-info-card">
              <small>الملف / البيان</small>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{invoice?.case_title || invoice?.title || "—"}</div>
              {invoice?.case_number && <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>رقم: {invoice.case_number}</div>}
            </div>
          </section>

          <table className="helm-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>البيان</th>
                <th style={{ width: 160, textAlign: "left" }}>المبلغ ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} style={{ background: index % 2 ? "#f8fafc" : "#fff" }}>
                  <td>{index + 1}</td>
                  <td>{item.description || "خدمات ومعاملات"}</td>
                  <td style={{ textAlign: "left", fontWeight: 800 }}>{Number(item.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className="helm-summary-row">
            <div>
              {(bankName || bankAccount || iban || vatNumber) && (
                <div className="helm-payment-box">
                  <div style={{ color: "#0369a1", fontWeight: 900, marginBottom: 5 }}>بيانات الدفع البنكي</div>
                  {bankName && <div>البنك: <b>{bankName}</b></div>}
                  {bankAccount && <div>رقم الحساب: <b>{bankAccount}</b></div>}
                  {iban && <div dir="ltr" style={{ textAlign: "right" }}>IBAN: <b>{iban}</b></div>}
                  {vatNumber && <div>الرقم الضريبي: <b>{vatNumber}</b></div>}
                </div>
              )}
              {invoice?.notes && (
                <div className="helm-notes-box">
                  <div style={{ color: "#92400e", fontWeight: 900, marginBottom: 5 }}>ملاحظات</div>
                  {invoice.notes}
                </div>
              )}
            </div>

            <div className="helm-total-box">
              <div className="helm-total-line"><span>المجموع الفرعي</span><b>{money(subtotal, currency)}</b></div>
              {(invoice?.discount || 0) > 0 && <div className="helm-total-line"><span>الخصم</span><b style={{ color: "#16a34a" }}>- {money(invoice.discount, currency)}</b></div>}
              {vat > 0 && <div className="helm-total-line"><span>ضريبة القيمة المضافة</span><b>{money(vat, currency)}</b></div>}
              <div className="helm-total-final"><span>الإجمالي</span><span>{money(total, currency)}</span></div>
              <div className="helm-total-line"><span>المدفوع</span><b style={{ color: "#16a34a" }}>{money(paid, currency)}</b></div>
              <div className="helm-remaining"><span>المتبقي</span><span>{money(remaining, currency)}</span></div>
            </div>
          </section>
        </main>

        <footer className="helm-footer">
          <div className="helm-footer-content">
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, color: primaryColor, fontWeight: 900, whiteSpace: "pre-line", lineHeight: 1.7 }}>{footerText}</p>
              {invoice?.payment_method && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b" }}>طريقة الدفع: {invoice.payment_method}</p>}
              {(officePhone || officeEmail || officeWebsite) && <p style={{ margin: "5px 0 0", fontSize: 11, color: "#64748b" }}>{[officePhone, officeEmail, officeWebsite].filter(Boolean).join(" · ")}</p>}
            </div>
            <div className="helm-official-images">
              {stampUrl && <img src={stampUrl} alt="ختم الشركة" className="helm-stamp-img" />}
              <div className="helm-signature-box">
                <div className="helm-signature-text">{FIXED_SIGNATURE_TEXT}</div>
                <div className="helm-signature-line" />
                <div className="helm-signature-label">التوقيع الثابت</div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
