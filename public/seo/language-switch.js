/* HELM public-page language links. Never run on client/account pages. */
(() => {
  'use strict'
  const current = window.location.pathname.replace(/\/$/, '') || '/'
  if (current === '/portal' || /^\/(?:Dashboard|Clients|Cases|Invoices|Documents|Payment|Settings|ClientOnboarding)(?:\/|$)/i.test(current)) return
  const pairs = {"/":"/en","/about":"/en/about","/contact":"/en/contact","/privacy":"/en/privacy","/terms":"/en/terms","/editorial-policy":"/en/editorial-policy","/uae-legal-guides":"/en/uae-legal-guides","/legal-services-uae":"/en/uae-legal-services","/uae-financial-claim-route":"/en/financial-claim-uae","/payment-order-uae":"/en/payment-order-uae","/judgment-execution-uae":"/en/judgment-execution-uae","/whatsapp-bank-transfer-evidence-uae":"/en/whatsapp-bank-transfer-evidence-uae","/international-contracts":"/en/cross-border-contracts","/international-debt-recovery":"/en/international-debt-recovery","/legal-consultant-egypt":"/en/egypt-legal-services","/international-legal-services":"/en/international-legal-services"}
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
