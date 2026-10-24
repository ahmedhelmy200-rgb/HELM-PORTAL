/**
 * Public multilingual route audit (read-only).
 * This counts genuinely authored English equivalents, not machine-only previews.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const site = 'https://helm-protal.vercel.app'
const pairs = JSON.parse(readFileSync(join(root, 'public/seo/bilingual-routes.json'), 'utf8')).pairs
const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'))
const sitemap = readFileSync(join(root, 'public/sitemap.xml'), 'utf8')
const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
const rewrites = new Map(vercel.rewrites.map((r) => [r.source, r.destination]))
const errors = []
const english = new Set()
let checked = 0

for (const [ar, en] of Object.entries(pairs)) {
  if (english.has(en)) errors.push('English URL is mapped more than once: ' + en)
  english.add(en)
  const getSource = (route) => route === '/' ? 'index.html' : rewrites.get(route)?.replace(/^\//, 'public/')
  const arFile = getSource(ar)
  const enFile = getSource(en)
  for (const [route, file] of [[ar, arFile], [en, enFile]]) {
    if (!file || !existsSync(join(root, file))) { errors.push('Missing source for ' + route + ' (' + file + ')'); continue }
    if (!locs.has(site + (route === '/' ? '/' : route))) errors.push('Missing sitemap URL: ' + route)
    const html = readFileSync(join(root, file), 'utf8')
    const expected = site + (route === '/' ? '/' : route)
    if (!html.includes('rel="canonical" href="' + expected + '"')) errors.push('Wrong canonical: ' + route)
    if (route === en && html.match(/<meta\s+name=["']robots["']\s+content=["']noindex/i)) errors.push('English page is not indexable: ' + en)
    if (route === en && !/<html\s+lang=["']en["']/i.test(html)) errors.push('English page language marker missing: ' + en)
    checked++
  }
}
const urls = [...locs]
const arPages = urls.filter((u) => u.startsWith(site + '/') && !u.startsWith(site + '/en'))
const remaining = arPages.filter((u) => !(u.slice(site.length) in pairs))
console.log('Bilingual equivalents: ' + Object.keys(pairs).length + ' of ' + arPages.length + ' indexed Arabic routes')
console.log('Linked source documents checked: ' + checked)
console.log('Remaining Arabic routes without authored English counterpart: ' + remaining.length)
console.log('Examples: ' + remaining.slice(0, 12).map((u) => u.slice(site.length)).join(', '))
if (errors.length) {
  console.error(errors.map((e) => '- ' + e).join('\n'))
  process.exitCode = 1
} else {
  console.log('Route/canonical/sitemap audit passed. Full translation coverage has NOT yet been reached.')
}
