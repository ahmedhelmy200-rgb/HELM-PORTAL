/**
 * Build a public English navigation directory from actual sitemap URLs.
 * Do not misrepresent untranslated articles as full English translations.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const domain = 'https://helm-protal.vercel.app'
const sitemap = readFileSync(join(root, 'public/sitemap.xml'), 'utf8')
const pairs = JSON.parse(readFileSync(join(root, 'public/seo/bilingual-routes.json'), 'utf8')).pairs
const labels = {
  "/": "HELM Legal home",
  "legal-services-uae": "Legal consultancy services in the UAE",
  "legal-consultation-uae": "Legal consultations in the UAE",
  "civil-commercial-disputes-uae": "Civil and commercial disputes",
  "execution-uae": "Execution-related legal consultations",
  "labour-law-uae": "UAE labour law",
  "contracts-uae": "Contracts and legal agreements",
  "PublicLegalLibrary": "Public legal library",
  "uae-legal-guides": "UAE legal guide collection",
  "travel-ban-debt-uae": "Travel bans related to debts",
  "payment-order-uae": "Payment orders in the UAE",
  "judgment-execution-uae": "Enforcement of judgments",
  "foreign-judgments-uae": "Recognition of foreign judgments in the UAE",
  "civil-appeal-uae": "Civil appeals in the UAE",
  "electronic-evidence-uae": "Electronic and digital evidence",
  "electronic-signature-uae": "Electronic signature evidence",
  "cheque-execution-uae": "Cheque enforcement procedures",
  "labour-dispute-uae": "UAE employment disputes",
  "end-of-service-benefits-uae": "End-of-service benefits",
  "contract-enforcement-uae": "Enforcement of contractual obligations",
  "contract-termination-damages-uae": "Termination of contracts and compensation",
  "arbitration-uae-guide": "Arbitration in the UAE",
  "commercial-companies-uae-guide": "UAE commercial companies law",
  "mediation-conciliation-uae": "Mediation and conciliation in the UAE",
  "legal-consultant-uae-locations": "Legal consultancy by UAE city",
  "legal-consultant-dubai": "Legal consultancy in Dubai",
  "legal-consultant-abu-dhabi": "Legal consultancy in Abu Dhabi",
  "legal-consultant-sharjah": "Legal consultancy in Sharjah",
  "legal-consultant-ajman": "Legal consultancy in Ajman",
  "legal-consultant-al-ain": "Legal consultancy in Al Ain",
  "legal-consultant-ras-al-khaimah": "Legal consultancy in Ras Al Khaimah",
  "legal-consultant-fujairah": "Legal consultancy in Fujairah",
  "legal-consultant-umm-al-quwain": "Legal consultancy in Umm Al Quwain",
  "international-legal-services": "International legal consultancy",
  "global-legal-services": "International legal service overview",
  "global-legal-topics": "Cross-border legal topics",
  "legal-consultant-egypt": "Egypt-related legal consultancy",
  "egypt-legal-guides": "Legal guides relating to Egypt",
  "egypt-debt-claims": "Financial claims and debts involving Egypt",
  "egypt-contracts-guide": "Contracts involving Egypt",
  "egypt-labour-law-2025": "Egyptian labour law developments",
  "egypt-cassation-principles": "Egyptian Court of Cassation principles",
  "egypt-economic-courts-guide": "Egyptian economic courts",
  "uae-egypt-legal-services": "Legal matters connecting the UAE and Egypt",
  "egyptian-clients-uae": "Egyptian clients in the UAE",
  "uae-egypt-contracts": "Contracts between the UAE and Egypt",
  "uae-egypt-cross-border-disputes": "Disputes involving the UAE and Egypt",
  "uae-egypt-judgments": "Judgments between Egypt and the UAE",
  "egypt-uae-business-legal": "Business matters between the UAE and Egypt",
  "international-contracts": "International contracts",
  "international-debt-recovery": "International debt recovery",
  "international-commercial-disputes": "International commercial disputes",
  "foreign-judgment-recognition": "Foreign judgment recognition",
  "gcc-legal-coordination": "Legal coordination across GCC countries",
  "middle-east-legal-services": "Middle East legal coordination",
  "international-power-of-attorney": "International powers of attorney",
  "document-attestation-cross-border": "Cross-border document attestation",
  "cross-border-inheritance-estates": "International inheritance and estates",
  "international-arbitration": "International arbitration",
  "cross-border-shareholder-company-disputes": "Cross-border shareholder disputes",
  "international-real-estate-property": "International property and real estate",
  "cross-border-family-personal-status": "Cross-border family and personal status",
  "cross-border-employment": "International employment relationships",
  "deportation-uae-guide": "Guide to deportation in the UAE",
  "judicial-deportation-uae": "Judicial deportation in the UAE",
  "administrative-deportation-uae": "Administrative deportation in the UAE",
  "deportation-mercy-request-egypt-uae": "Deportation mercy requests involving Egypt and UAE",
  "mercy-request-uae-criminal-case": "Mercy requests in UAE criminal matters",
  "entry-ban-vs-deportation-uae": "Entry bans and deportation compared",
  "return-to-uae-after-deportation": "Returning to the UAE after deportation",
  "deportation-after-sentence-uae": "Deportation after a criminal sentence",
  "deportation-request-documents-uae": "Documents for deportation requests",
  "cancel-deportation-abu-dhabi": "Deportation cancellation requests in Abu Dhabi",
  "deportation-mercy-request-dubai": "Deportation mercy requests in Dubai",
  "deportation-authority-uae": "Authorities involved in deportation matters",
  "uae-criminal-guides": "UAE criminal legal guides",
  "bail-provisional-release-uae": "Bail and provisional release",
  "criminal-appeal-uae": "Criminal appeals in the UAE",
  "rehabilitation-uae": "Legal rehabilitation in the UAE",
  "seized-items-return-uae": "Requests for return of seized items",
  "criminal-pardon-uae": "Criminal pardon procedures",
  "criminal-case-status-uae": "Checking UAE criminal case status",
  "criminal-travel-ban-uae": "Criminal travel restrictions",
  "egypt-uae-criminal-case-help": "Criminal cases involving Egypt and the UAE",
  "about": "About HELM Legal",
  "contact": "Contact HELM Legal",
  "privacy": "Privacy policy",
  "terms": "Terms of use",
  "editorial-policy": "Editorial and legal review policy",
  "whatsapp-bank-transfer-evidence-uae": "WhatsApp and bank transfer evidence",
  "uae-financial-claim-route": "Choosing a UAE financial claim route",
  "uae-contract-breach-evidence": "Proving contractual breaches"
}
const entries = [...sitemap.matchAll(/<loc>https:\/\/helm-protal\.vercel\.app([^<]*)<\/loc>/g)]
  .map((match) => match[1])
  .filter((pathname) => !pathname.startsWith('/en'))
  .map((pathname) => pathname === '' ? '/' : pathname)

const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const title = (pathname) => {
  const slug = pathname.replace(/^\//, '') || '/'
  return labels[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
const topic = (url) => {
  if (/deportation|criminal|bail|rehabilitation|seized-items|mercy-request|entry-ban/.test(url)) return 'Criminal and immigration-related legal information'
  if (/egypt|international|cross-border|global|gcc|middle-east|foreign-judgment/.test(url)) return 'Egypt and international legal matters'
  if (/consultant|consultation|services|about|contact|privacy|terms|editorial-policy/.test(url)) return 'About, services and legal consultancy'
  if (/labour|employment|end-of-service/.test(url)) return 'Employment and labour'
  if (/contract|arbitration|companies|mediation/.test(url)) return 'Contracts and commercial matters'
  return 'UAE civil, evidence and enforcement guides'
}
const groups = new Map()
for (const route of entries) {
  const group = topic(route)
  if (!groups.has(group)) groups.set(group, [])
  groups.get(group).push(route)
}
const cards = [...groups.entries()].map(([category, routes]) => {
  const items = routes.map((route) => {
    const en = pairs[route]
    const heading = escape(title(route))
    const full = en
      ? '<a href="' + escape(en) + '" lang="en">Read in English</a> · '
      : '<span class="muted">Full English translation pending review</span> · '
    return '<li><strong>' + heading + '</strong><span>' + full +
      '<a href="' + escape(route) + '" lang="ar">العربية · Original Arabic article</a></span></li>'
  }).join('')
  return '<section class="article" style="margin:20px 0"><h2>' + escape(category) + '</h2><ul class="directory-list">' + items + '</ul></section>'
}).join('')

const html = '<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>All HELM Legal Public Topics | English Directory</title>' +
  '<meta name="description" content="Complete English-language directory to all public HELM Legal topics, showing reviewed English versions and Arabic original articles.">' +
  '<meta name="robots" content="noindex,follow">' +
  '<link rel="canonical" href="' + domain + '/en/directory">' +
  '<link rel="stylesheet" href="/seo/seo.css">' +
  '<style>.directory-list{padding-left:20px}.directory-list li{margin:12px 0;padding:12px;border-bottom:1px solid #e5eaf1}.directory-list li span{display:block;font-size:.92rem}.directory-list a{font-weight:bold}</style>' +
  '</head><body dir="ltr"><header class="top"><div class="wrap"><div class="brand">HELM Legal<small>English Topic Directory</small></div>' +
  '<nav class="nav"><a href="/en">English Home</a><a href="/en/uae-legal-guides">UAE Legal Guides</a><a href="/">العربية</a></nav></div></header>' +
  '<section class="hero"><div class="wrap"><h1>Every public HELM Legal topic, without missing links</h1>' +
  '<p>English translations are being reviewed. Where a full version has been published, the English link opens it; otherwise the original Arabic article remains accessible.</p></div></section>' +
  '<main class="section"><div class="wrap"><p><strong>' + entries.length + ' public Arabic routes.</strong> ' +
  Object.keys(pairs).length + ' currently have a reviewed English counterpart. ' +
  'This navigation directory does not claim to translate the legal text of the remaining pages.</p>' + cards + '</div></main>' +
  '<footer class="footer"><div class="wrap">HELM Legal — General legal information. <a href="/en/editorial-policy">Editorial Policy</a></div></footer></body></html>'

writeFileSync(join(root, 'dist/seo/en-directory.html'), html, 'utf8')
console.log('HELM English directory generated with ' + entries.length + ' source routes and ' + Object.keys(pairs).length + ' reviewed language pairs.')
