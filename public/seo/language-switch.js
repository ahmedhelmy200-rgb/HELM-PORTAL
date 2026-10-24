/* HELM public-page language links. Never run on client/account pages. */
(() => {
  'use strict'
  const current = window.location.pathname.replace(/\/$/, '') || '/'
  if (current === '/portal' || /^\/(?:Dashboard|Clients|Cases|Invoices|Documents|Payment|Settings|ClientOnboarding)(?:\/|$)/i.test(current)) return
  const pairs = {"/":"/en","/about":"/en/about","/contact":"/en/contact","/privacy":"/en/privacy","/terms":"/en/terms","/editorial-policy":"/en/editorial-policy","/uae-legal-guides":"/en/uae-legal-guides","/legal-services-uae":"/en/uae-legal-services","/uae-financial-claim-route":"/en/financial-claim-uae","/payment-order-uae":"/en/payment-order-uae","/judgment-execution-uae":"/en/judgment-execution-uae","/whatsapp-bank-transfer-evidence-uae":"/en/whatsapp-bank-transfer-evidence-uae","/international-contracts":"/en/cross-border-contracts","/international-debt-recovery":"/en/international-debt-recovery","/legal-consultant-egypt":"/en/egypt-legal-services","/international-legal-services":"/en/international-legal-services","/contracts-uae":"/en/contracts-uae","/civil-commercial-disputes-uae":"/en/civil-commercial-disputes-uae","/labour-dispute-uae":"/en/labour-dispute-uae","/civil-appeal-uae":"/en/civil-appeal-uae","/electronic-evidence-uae":"/en/electronic-evidence-uae","/uae-contract-breach-evidence":"/en/uae-contract-breach-evidence","/travel-ban-debt-uae":"/en/travel-ban-debt-uae","/cheque-execution-uae":"/en/cheque-execution-uae","/end-of-service-benefits-uae":"/en/end-of-service-benefits-uae","/arbitration-uae-guide":"/en/arbitration-uae-guide","/legal-consultant-dubai":"/en/legal-consultant-dubai","/legal-consultant-abu-dhabi":"/en/legal-consultant-abu-dhabi","/legal-consultant-ajman":"/en/legal-consultant-ajman","/uae-criminal-guides":"/en/uae-criminal-guides","/criminal-appeal-uae":"/en/criminal-appeal-uae","/bail-provisional-release-uae":"/en/bail-provisional-release-uae","/deportation-uae-guide":"/en/deportation-uae-guide","/judicial-deportation-uae":"/en/judicial-deportation-uae","/administrative-deportation-uae":"/en/administrative-deportation-uae","/legal-consultation-uae":"/en/legal-consultation-uae","/execution-uae":"/en/execution-uae","/labour-law-uae":"/en/labour-law-uae","/foreign-judgments-uae":"/en/foreign-judgments-uae","/electronic-signature-uae":"/en/electronic-signature-uae","/contract-enforcement-uae":"/en/contract-enforcement-uae","/contract-termination-damages-uae":"/en/contract-termination-damages-uae","/commercial-companies-uae-guide":"/en/commercial-companies-uae-guide","/mediation-conciliation-uae":"/en/mediation-conciliation-uae","/legal-consultant-uae-locations":"/en/legal-consultant-uae-locations","/legal-consultant-sharjah":"/en/legal-consultant-sharjah","/legal-consultant-al-ain":"/en/legal-consultant-al-ain","/legal-consultant-ras-al-khaimah":"/en/legal-consultant-ras-al-khaimah","/legal-consultant-fujairah":"/en/legal-consultant-fujairah","/legal-consultant-umm-al-quwain":"/en/legal-consultant-umm-al-quwain","/global-legal-services":"/en/global-legal-services","/global-legal-topics":"/en/global-legal-topics","/PublicLegalLibrary":"/en/PublicLegalLibrary","/egypt-legal-guides":"/en/egypt-legal-guides","/egypt-debt-claims":"/en/egypt-debt-claims","/egypt-contracts-guide":"/en/egypt-contracts-guide","/egypt-labour-law-2025":"/en/egypt-labour-law-2025","/egypt-cassation-principles":"/en/egypt-cassation-principles","/egypt-economic-courts-guide":"/en/egypt-economic-courts-guide","/uae-egypt-legal-services":"/en/uae-egypt-legal-services","/egyptian-clients-uae":"/en/egyptian-clients-uae","/uae-egypt-contracts":"/en/uae-egypt-contracts","/uae-egypt-cross-border-disputes":"/en/uae-egypt-cross-border-disputes","/uae-egypt-judgments":"/en/uae-egypt-judgments","/egypt-uae-business-legal":"/en/egypt-uae-business-legal","/international-commercial-disputes":"/en/international-commercial-disputes","/foreign-judgment-recognition":"/en/foreign-judgment-recognition","/gcc-legal-coordination":"/en/gcc-legal-coordination","/middle-east-legal-services":"/en/middle-east-legal-services","/international-power-of-attorney":"/en/international-power-of-attorney","/document-attestation-cross-border":"/en/document-attestation-cross-border","/cross-border-inheritance-estates":"/en/cross-border-inheritance-estates","/international-arbitration":"/en/international-arbitration","/cross-border-shareholder-company-disputes":"/en/cross-border-shareholder-company-disputes","/international-real-estate-property":"/en/international-real-estate-property","/cross-border-family-personal-status":"/en/cross-border-family-personal-status","/cross-border-employment":"/en/cross-border-employment","/deportation-mercy-request-egypt-uae":"/en/deportation-mercy-request-egypt-uae","/mercy-request-uae-criminal-case":"/en/mercy-request-uae-criminal-case","/entry-ban-vs-deportation-uae":"/en/entry-ban-vs-deportation-uae","/return-to-uae-after-deportation":"/en/return-to-uae-after-deportation","/deportation-after-sentence-uae":"/en/deportation-after-sentence-uae","/deportation-request-documents-uae":"/en/deportation-request-documents-uae","/cancel-deportation-abu-dhabi":"/en/cancel-deportation-abu-dhabi","/deportation-mercy-request-dubai":"/en/deportation-mercy-request-dubai","/deportation-authority-uae":"/en/deportation-authority-uae","/rehabilitation-uae":"/en/rehabilitation-uae","/seized-items-return-uae":"/en/seized-items-return-uae","/criminal-pardon-uae":"/en/criminal-pardon-uae","/criminal-case-status-uae":"/en/criminal-case-status-uae","/criminal-travel-ban-uae":"/en/criminal-travel-ban-uae","/egypt-uae-criminal-case-help":"/en/egypt-uae-criminal-case-help"}
  const reverse = Object.fromEntries(Object.entries(pairs).map(([ar, en]) => [en, ar]))
  const isEnglish = current === '/en' || current.startsWith('/en/')
  const arabicUrl = reverse[current] || (isEnglish ? '/' : current)
  const exactEnglishUrl = isEnglish ? current : pairs[current]
  const englishUrl = exactEnglishUrl || '/en/directory'
  const bar = document.createElement('nav')
  bar.setAttribute('aria-label', 'Language selection')
  bar.className = 'helm-languages'
  bar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #d5b36c;border-radius:12px;background:#173458;color:white;flex-wrap:wrap'
  const arabic = document.createElement('a')
  arabic.href = arabicUrl
  arabic.lang = 'ar'
  arabic.hreflang = 'ar-AE'
  arabic.dir = 'rtl'
  arabic.textContent = 'العربية'
  const english = document.createElement('a')
  english.href = englishUrl
  english.lang = 'en'
  english.hreflang = 'en'
  english.dir = 'ltr'
  english.textContent = exactEnglishUrl ? 'English' : 'English topics'
  if (!exactEnglishUrl) english.title = 'English directory — the complete translation of this article is being prepared'
  const label = document.createElement('span')
  label.textContent = isEnglish ? 'Language' : 'اللغة'
  label.className = 'helm-language-label'
  if (isEnglish) english.setAttribute('aria-current', 'page')
  else arabic.setAttribute('aria-current', 'page')
  arabic.style.cssText = 'color:white;padding:6px;border:1px solid #e8d4a9;border-radius:6px'
  english.style.cssText = 'color:white;padding:6px;border:1px solid #e8d4a9;border-radius:6px'
  bar.append(label, arabic, english)
  const render = () => {
    if (document.querySelector('.helm-languages')) return
    const header = document.querySelector('.top .wrap')
    if (header) header.appendChild(bar)
    else document.body.prepend(bar)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true })
  else render()
})()
