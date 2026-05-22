import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { BADAYAT_APPROVED_LOGO_DATA_URI } from '@/lib/badayatLogoData'

function escapeHtml(value) {
  return String(value ?? '').replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[ch]))
}

function safeFileName(value) {
  return String(value || 'badayat-document')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90)
}

function buildPdfNode(title, body) {
  const node = document.createElement('div')
  node.dir = 'rtl'
  node.style.position = 'fixed'
  node.style.left = '-100000px'
  node.style.top = '0'
  node.style.width = '794px'
  node.style.background = '#ffffff'
  node.style.color = '#111827'
  node.style.fontFamily = "Arial, Tahoma, 'Segoe UI', sans-serif"
  node.innerHTML = `
    <div style="width:794px;min-height:1123px;background:#fff;position:relative;padding:48px;box-sizing:border-box;overflow:hidden;">
      <div style="position:absolute;inset:22px;border:4px solid #111827;border-radius:24px;"></div>
      <div style="position:absolute;inset:34px;border:2px solid #b45309;border-radius:18px;"></div>
      <div style="position:absolute;top:48%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:54px;font-weight:900;color:rgba(180,83,9,.055);white-space:nowrap;">شركة بداية الخير</div>
      <div style="position:relative;z-index:1;padding:18px;">
        <header style="display:grid;grid-template-columns:110px 1fr 180px;gap:20px;align-items:center;border-bottom:3px solid #111827;padding-bottom:18px;">
          <div style="width:104px;height:104px;border:2px solid #b45309;border-radius:22px;background:#fff;display:flex;align-items:center;justify-content:center;padding:4px;box-sizing:border-box;overflow:hidden;">
            <img src="${BADAYAT_APPROVED_LOGO_DATA_URI}" style="max-width:100%;max-height:100%;object-fit:contain;display:block;" />
          </div>
          <div>
            <h1 style="margin:0;font-size:28px;font-weight:900;color:#111827;">شركة بداية الخير</h1>
            <div style="margin-top:4px;color:#92400e;font-size:13px;font-weight:900;letter-spacing:2px;direction:ltr;text-align:right;">BADAYAT AL KHAIR</div>
            <div style="margin-top:8px;color:#4b5563;font-size:13px;font-weight:700;">إدارة شؤون الموظفين والعهد والنماذج الداخلية</div>
          </div>
          <div style="border:1px solid #d1d5db;border-radius:16px;padding:12px;background:#f9fafb;font-size:12px;line-height:1.8;color:#374151;">
            <div><b>التاريخ:</b> ${new Date().toLocaleDateString('ar-AE')}</div>
            <div><b>النظام:</b> HELM Portal</div>
          </div>
        </header>
        <h2 style="width:fit-content;min-width:260px;margin:30px auto 24px;text-align:center;border:3px solid #111827;border-radius:18px;padding:10px 30px;font-size:26px;font-weight:900;background:#fff;">${escapeHtml(title)}</h2>
        <main style="white-space:pre-wrap;font-size:17px;line-height:2.05;min-height:560px;color:#111827;">${escapeHtml(body)}</main>
        <section style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px;page-break-inside:avoid;">
          <div style="border:2px solid #111827;border-radius:16px;min-height:90px;text-align:center;font-weight:900;padding:14px;">توقيع الموظف<div style="margin-top:34px;border-top:1px solid #111827;padding-top:6px;font-size:12px;color:#374151;">الاسم والتوقيع</div></div>
          <div style="border:2px solid #111827;border-radius:16px;min-height:90px;text-align:center;font-weight:900;padding:14px;">الشؤون الإدارية / القانونية<div style="margin-top:34px;border-top:1px solid #111827;padding-top:6px;font-size:12px;color:#374151;">الاسم والتوقيع</div></div>
          <div style="border:2px solid #111827;border-radius:16px;min-height:90px;text-align:center;font-weight:900;padding:14px;">ختم الشركة<div style="margin-top:34px;border-top:1px solid #111827;padding-top:6px;font-size:12px;color:#374151;">الختم الرسمي</div></div>
        </section>
        <footer style="margin-top:26px;border-top:1px solid #d1d5db;padding-top:10px;display:flex;justify-content:space-between;font-size:11px;color:#6b7280;">
          <span>صادر إلكترونياً من قسم بداية الخير</span>
          <span>${new Date().toLocaleString('ar-AE')}</span>
        </footer>
      </div>
    </div>`
  return node
}

export async function exportBadayatDocumentPdf(title, body) {
  const node = buildPdfNode(title, body)
  document.body.appendChild(node)
  try {
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = 210
    const pageHeight = 297
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const imgData = canvas.toDataURL('image/jpeg', 0.95)

    let y = 0
    let remaining = imgHeight
    pdf.addImage(imgData, 'JPEG', 0, y, imgWidth, imgHeight, undefined, 'FAST')
    remaining -= pageHeight
    while (remaining > 0) {
      y = remaining - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, y, imgWidth, imgHeight, undefined, 'FAST')
      remaining -= pageHeight
    }
    pdf.save(`${safeFileName(title)}.pdf`)
    return true
  } finally {
    node.remove()
  }
}
