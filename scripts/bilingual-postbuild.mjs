/**
 * After Vite copies public/, attach language links to static editorial HTML.
 * Authentication and client portal files are not touched.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const site = 'https://helm-protal.vercel.app'
const distSeo = join(process.cwd(), 'dist', 'seo')
const pairs = JSON.parse(readFileSync(join(process.cwd(), 'public', 'seo', 'bilingual-routes.json'), 'utf8')).pairs
const inverse = Object.fromEntries(Object.entries(pairs).map(([ar, en]) => [en, ar]))

if (!existsSync(distSeo)) throw new Error('Vite did not copy the SEO folder')
const files = readdirSync(distSeo).filter((name) => name.endsWith('.html'))
let paired = 0
let unpaired = 0

for (const file of files) {
  const pathname = join(distSeo, file)
  let html = readFileSync(pathname, 'utf8')
  if (!html.includes('</head>')) throw new Error('Missing head in ' + file)
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]
  const slug = canonical?.startsWith(site) ? canonical.slice(site.length).replace(/\/$/, '') || '/' : null
  if (!slug) console.warn('HELM bilingual: canonical not found, language bar only: ' + file)
  const ar = inverse[slug] || (pairs[slug] ? slug : null)
  const en = pairs[slug] || (inverse[slug] ? slug : null)
  if (ar && en) {
    // Keep one reciprocal set of alternates and preserve self-canonical URLs.
    html = html.replace(/<link\s+rel=["']alternate["']\s+hreflang=["'][^"']+["']\s+href=["'][^"']+["']\s*\/?\s*>/gi, '')
    const alternate = '<link rel="alternate" hreflang="ar-AE" href="' + site + (ar === '/' ? '/' : ar) + '">\n'
      + '<link rel="alternate" hreflang="en" href="' + site + en + '">\n'
    html = html.replace('</head>', alternate + '</head>')
    paired++
  } else {
    unpaired++
  }
  if (!html.includes('src="/seo/language-switch.js"')) {
    html = html.replace('</head>', '<script defer src="/seo/language-switch.js"></script>\n</head>')
  }
  writeFileSync(pathname, html, 'utf8')
}

console.log('HELM bilingual postbuild: ' + files.length + ' public HTML pages, '
  + paired + ' with verified English/Arabic counterparts, '
  + unpaired + ' linked to the English directory without false translation claims.')
