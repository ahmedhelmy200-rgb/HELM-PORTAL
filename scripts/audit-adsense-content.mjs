/**
 * Internal quality triage for public editorial pages.
 * This is NOT a Google AdSense approval test and Google sets no word-count minimum.
 * Run: npm run audit:adsense
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (p) => readFileSync(join(root, p), 'utf8')
const pagesDir = join(root, 'public/seo')
const sitemap = read('public/sitemap.xml')
const vercel = JSON.parse(read('vercel.json'))
const domain = 'https://helm-protal.vercel.app'
const warnings = []
const errors = []
const siteUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
const routes = new Set(siteUrls.map((url) => {
  try { return new URL(url).pathname } catch { errors.push('Invalid sitemap URL: ' + url); return '' }
}))
const rewrites = (vercel.rewrites || []).filter((route) => typeof route.source === 'string' && typeof route.destination === 'string')
const toPage = new Map(rewrites.filter((route) => route.destination.startsWith('/seo/')).map((route) => [route.source, route.destination]))
const pageFiles = readdirSync(pagesDir).filter((name) => name.endsWith('.html'))
// These files are built from maintained source data after Vite copies public/.
// Audit the generated result because it is the file the rewrite serves in production.
const generatedPages = new Map([
  ['/seo/en-directory.html', join(root, 'dist', 'seo', 'en-directory.html')],
  ['/seo/PublicLegalLibrary.html', join(root, 'dist', 'seo', 'PublicLegalLibrary.html')],
])
// The English directory is navigation only and intentionally uses noindex,follow.
// It must not be added to the XML sitemap as an indexable editorial page.
const excludedFromSitemap = new Set(['/en/directory'])
const publicPagePath = (destination) => generatedPages.get(destination)
  || join(root, 'public', destination.replace(/^\//, ''))
const auditFiles = [
  ...pageFiles.map((name) => 'public/seo/' + name),
  ...[...generatedPages.values()].filter((path) => existsSync(path)).map((path) => path.slice(root.length + 1)),
]
const titles = new Map()
const normalize = (value) => value.replace(/&[^;]+;/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const words = (value) => normalize(value).split(/\s+/).filter(Boolean).length

for (const [route, destination] of toPage) {
  if (!existsSync(publicPagePath(destination))) {
    errors.push('Mapped content file missing for ' + route + ': ' + destination)
  }
  if (!routes.has(route) && !excludedFromSitemap.has(route)) warnings.push('Public article missing from sitemap: ' + route)
}
for (const file of auditFiles) {
  const html = read(file)
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
  const h1 = html.match(/<h1(?:\s[^>]*)?>/i)
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]
  if (!title) errors.push(file + ': missing title')
  if (!h1) errors.push(file + ': missing H1')
  if (!description) warnings.push(file + ': missing meta description')
  if (!canonical) errors.push(file + ': missing canonical')
  if (canonical) {
    const canonicalPath = canonical.startsWith(domain + '/') ? new URL(canonical).pathname : null
    if (!canonicalPath || (!routes.has(canonicalPath) && !excludedFromSitemap.has(canonicalPath))) {
      warnings.push(file + ': canonical not represented in sitemap: ' + canonical)
    }
    if (canonicalPath && excludedFromSitemap.has(canonicalPath)
      && !/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) {
      errors.push(file + ': intentionally excluded canonical must use noindex: ' + canonical)
    }
  }
  if (title) {
    const previous = titles.get(title)
    if (previous) warnings.push('Identical title: ' + previous + ' / ' + file)
    titles.set(title, file)
  }
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html
  const count = words(main.replace(/<(script|style|nav|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' '))
  // Internal editorial triage ONLY; not a Google policy threshold.
  if (count < 200) warnings.push(file + ': short primary text (' + count + ' tokens; editorial review suggested)')
}
for (const url of siteUrls) {
  if (!url.startsWith(domain + '/')) warnings.push('Sitemap URL on unexpected domain: ' + url)
}
console.log('HELM public-site content audit')
console.log('Sitemap URLs: ' + siteUrls.length + ', audited SEO pages: ' + auditFiles.length + ', mapped SEO routes: ' + toPage.size)
console.log('Errors: ' + errors.length + ', editorial warnings: ' + warnings.length)
if (errors.length) console.error('\nStructural errors:\n' + errors.map((s) => '- ' + s).join('\n'))
if (warnings.length) console.warn('\nEditorial triage:\n' + warnings.map((s) => '- ' + s).join('\n'))
console.log('\nNote: these heuristics do not determine eligibility for AdSense. Review article accuracy, originality, user experience and real live URLs manually.')
if (errors.length) process.exitCode = 1
