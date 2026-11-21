/**
 * Render the Arabic public legal library into crawlable static HTML.
 * The data source remains src/lib/publicLegalLibrary.js so the app and SEO page stay in sync.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PUBLIC_LEGAL_LIBRARY, PUBLIC_LEGAL_NOTICE } from '../src/lib/publicLegalLibrary.js'

const root = process.cwd()
const output = join(root, 'dist', 'seo', 'PublicLegalLibrary.html')
const site = 'https://helm-protal.vercel.app'
const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const guideLinks = {
  'whatsapp-bank-transfer-evidence': ['/whatsapp-bank-transfer-evidence-uae', 'قراءة دليل الإثبات الكامل'],
  'financial-claim-route-guide': ['/uae-financial-claim-route', 'كيف تختار مسار المطالبة؟'],
  'contract-breach-evidence-guide': ['/uae-contract-breach-evidence', 'قراءة دليل إخلال العقد'],
  'uae-civil-procedure': ['/civil-commercial-disputes-uae', 'قراءة دليل المنازعات المدنية والتجارية'],
  'uae-criminal-complaint': ['/uae-criminal-guides', 'فتح أدلة القضايا الجزائية'],
  'uae-labour-claims': ['/labour-dispute-uae', 'قراءة دليل النزاعات العمالية'],
  'uae-commercial-debts': ['/payment-order-uae', 'متى يصلح طريق أمر الأداء؟'],
  'uae-contract-review': ['/contracts-uae', 'قراءة دليل مراجعة العقود'],
  'uae-execution': ['/judgment-execution-uae', 'قراءة دليل تنفيذ الأحكام'],
  'uae-appeal': ['/civil-appeal-uae', 'قراءة دليل الاستئناف المدني'],
  'uae-evidence-documents': ['/electronic-evidence-uae', 'قراءة دليل الإثبات الإلكتروني'],
  'uae-legal-notices': ['/contract-enforcement-uae', 'قراءة دليل الالتزامات التعاقدية'],
  'uae-urgent-files': ['/uae-legal-guides', 'استعراض الأدلة القانونية'],
}
const categories = [...new Set(PUBLIC_LEGAL_LIBRARY.map((item) => item.category))]
const options = categories.map((category) => '<option value="' + esc(category) + '">' + esc(category) + '</option>').join('')
const cards = PUBLIC_LEGAL_LIBRARY.map((item, index) => {
  const search = [item.title, item.category, item.summary, ...item.points].join(' ')
  const points = item.points.map((point) => '<li>' + esc(point) + '</li>').join('')
  const guide = guideLinks[item.id]
  const link = guide ? '<p><a class="guide-link" href="' + esc(guide[0]) + '">' + esc(guide[1]) + '</a></p>' : ''
  return '<article class="card" id="topic-' + (index + 1) + '" data-category="' + esc(item.category) + '" data-search="' + esc(search.toLowerCase()) + '">'
    + '<span class="eyebrow">' + esc(item.category) + '</span><h2>' + esc(item.title) + '</h2>'
    + '<p>' + esc(item.summary) + '</p><ul>' + points + '</ul>' + link + '</article>'
}).join('\n')
const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'المكتبة القانونية العامة | HELM Legal',
  url: site + '/PublicLegalLibrary',
  inLanguage: 'ar-AE',
  isPartOf: { '@type': 'WebSite', name: 'HELM Legal', url: site + '/' },
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: PUBLIC_LEGAL_LIBRARY.length,
    itemListElement: PUBLIC_LEGAL_LIBRARY.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: site + '/PublicLegalLibrary#topic-' + (index + 1),
    })),
  },
}).replace(/</g, '\\u003c')
const html = '<!doctype html>\n<html lang="ar-AE" dir="rtl"><head>\n'
  + '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n'
  + '<title>المكتبة القانونية العامة | أدلة قانونية في الإمارات | HELM Legal</title>\n'
  + '<meta name="description" content="تصفح المكتبة القانونية العامة من HELM Legal: أدلة عملية في الإثبات والعقود والعمل والمطالبات والتنفيذ والاستئناف، مع تنبيه واضح إلى حدود المعلومات العامة.">\n'
  + '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">\n'
  + '<meta name="google-adsense-account" content="ca-pub-1562512316677578">\n'
  + '<link rel="canonical" href="' + site + '/PublicLegalLibrary">\n'
  + '<link rel="stylesheet" href="/seo/seo.css">\n'
  + '<meta property="og:type" content="website"><meta property="og:site_name" content="HELM Legal">\n'
  + '<meta property="og:title" content="المكتبة القانونية العامة | HELM Legal"><meta property="og:description" content="أدلة قانونية عامة منظمة في موضوعات الإمارات والإجراءات والمستندات.">\n'
  + '<meta property="og:url" content="' + site + '/PublicLegalLibrary">\n'
  + '<script type="application/ld+json">' + jsonLd + '</script>\n'
  + '<style>.library-tools{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;margin:1.5rem 0;padding:1rem;background:#f5f7fa;border-radius:14px}.library-tools input,.library-tools select{font:inherit;min-height:44px;padding:.6rem .8rem;border:1px solid #aab4c2;border-radius:9px;background:#fff;max-width:100%}.library-tools input{flex:1;min-width:220px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:1rem}.card{padding:1.25rem;border:1px solid #dce2ea;border-radius:18px;background:#fff}.card h2{font-size:1.22rem;line-height:1.6;margin:.65rem 0}.card p,.card li{line-height:1.9}.card ul{padding-right:1.35rem}.guide-link{font-weight:700;color:#15335c;text-decoration:underline;text-underline-offset:3px}.disclaimer{padding:1rem;border-right:4px solid #c89c43;background:#fff8e8;border-radius:10px}</style>\n'
  + '</head><body dir="rtl"><header class="top"><div class="wrap"><div class="brand">HELM Legal<small>أحمد حلمي للاستشارات القانونية</small></div>'
  + '<nav class="nav" aria-label="التنقل الرئيسي"><a href="/">الرئيسية</a><a href="/uae-legal-guides">الأدلة القانونية</a><a href="/en/PublicLegalLibrary" lang="en" dir="ltr">English</a><a href="/portal">بوابة الموكلين</a></nav></div></header>'
  + '<section class="hero"><div class="wrap"><span class="eyebrow">مكتبة عامة للتوعية القانونية</span>'
  + '<h1>مكتبة قانونية منظمة لفهم موضوع الملف والمستندات والخطوة التالية</h1>'
  + '<p>' + esc(PUBLIC_LEGAL_NOTICE) + '</p>'
  + '<p><strong>' + PUBLIC_LEGAL_LIBRARY.length + ' موضوعًا قانونيًا عامًا</strong> في ' + categories.length + ' تصنيفات.</p></div></section>'
  + '<main class="section"><div class="wrap"><p class="disclaimer"><strong>تنبيه:</strong> المعلومات عامة ولا تحل محل فحص الوقائع والمستندات والنصوص الرسمية النافذة. لا تتضمن المكتبة ملفات موكلين أو بيانات قضايا خاصة.</p>'
  + '<h2>ابحث داخل المكتبة</h2><div class="library-tools"><label for="library-search">كلمة البحث</label>'
  + '<input id="library-search" type="search" placeholder="ابحث في العناوين والموضوعات والإرشادات" autocomplete="off">'
  + '<label for="library-category">التصنيف</label><select id="library-category"><option value="">كل التصنيفات</option>' + options + '</select>'
  + '<span id="library-count" aria-live="polite">' + PUBLIC_LEGAL_LIBRARY.length + ' موضوعًا</span></div>'
  + '<div class="grid" id="public-library">' + cards + '</div>'
  + '<p id="library-empty" hidden>لا توجد نتيجة مطابقة. جرّب كلمة بحث أبسط أو اختر كل التصنيفات.</p>'
  + '<section class="article"><h2>مصادر رسمية وروابط أساسية</h2><ul><li><a href="https://uaelegislation.gov.ae/ar/" target="_blank" rel="noopener noreferrer">بوابة تشريعات الإمارات الرسمية</a></li><li><a href="/editorial-policy">سياسة التحرير والمراجعة</a></li><li><a href="/privacy">سياسة الخصوصية</a></li><li><a href="/terms">شروط الاستخدام</a></li><li><a href="/contact">التواصل مع المكتب</a></li></ul></section>'
  + '</div></main><footer class="footer"><div class="wrap">HELM Legal — محتوى قانوني عام. <a href="/about">عن المكتب</a> · <a href="/contact">التواصل</a> · <a href="/privacy">الخصوصية</a></div></footer>'
  + '<script>(function(){var q=document.getElementById("library-search"),c=document.getElementById("library-category"),cards=Array.from(document.querySelectorAll("#public-library .card")),count=document.getElementById("library-count"),empty=document.getElementById("library-empty");function update(){var term=q.value.trim().toLowerCase(),category=c.value,shown=0;cards.forEach(function(card){var match=(!term||card.dataset.search.indexOf(term)!==-1)&&(!category||card.dataset.category===category);card.hidden=!match;if(match)shown++;});count.textContent=shown+" من "+cards.length+" موضوعًا";empty.hidden=shown!==0;}q.addEventListener("input",update);c.addEventListener("change",update);})();</script></body></html>\n'
mkdirSync(join(root, 'dist', 'seo'), { recursive: true })
writeFileSync(output, html, 'utf8')
console.log('Generated crawlable Arabic public legal library: ' + PUBLIC_LEGAL_LIBRARY.length + ' topics across ' + categories.length + ' categories.')
