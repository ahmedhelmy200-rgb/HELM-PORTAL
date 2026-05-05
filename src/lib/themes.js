// ── نظام الثيمات — HELM v10 ────────────────────────────────────────────────

export const THEMES = [
  {
    id: 'midnight', label: 'منتصف الليل', desc: 'أزرق داكن — الافتراضي', icon: '🌙',
    preview: { bg:'#03070f', primary:'#3b82f6', accent:'#06b6d4', sidebar:'#040a1c' },
    dark: true,
    vars: { '--primary':'213 96% 62%', '--accent':'183 96% 50%', '--accent-foreground':'220 40% 8%', '--ring':'213 96% 62%' },
    body: 'radial-gradient(ellipse at 20% 20%,rgba(37,99,235,.18),transparent 45%),radial-gradient(ellipse at 80% 80%,rgba(6,182,212,.12),transparent 45%),hsl(222 55% 6%)',
  },
  {
    id: 'emerald', label: 'زمردي', desc: 'أخضر داكن — طابع قانوني', icon: '💚',
    preview: { bg:'#030f0a', primary:'#10b981', accent:'#34d399', sidebar:'#041209' },
    dark: true,
    vars: { '--primary':'160 84% 39%', '--primary-foreground':'0 0% 100%', '--accent':'152 70% 55%', '--accent-foreground':'158 55% 6%', '--ring':'160 84% 39%' },
    body: 'radial-gradient(ellipse at 20% 20%,rgba(16,185,129,.16),transparent 45%),radial-gradient(ellipse at 80% 80%,rgba(52,211,153,.1),transparent 45%),hsl(222 55% 6%)',
  },
  {
    id: 'crimson', label: 'قرمزي', desc: 'أحمر داكن جريء', icon: '🔴',
    preview: { bg:'#0f0306', primary:'#ef4444', accent:'#f97316', sidebar:'#0c0204' },
    dark: true,
    vars: { '--primary':'0 84% 60%', '--primary-foreground':'0 0% 100%', '--accent':'25 95% 55%', '--accent-foreground':'350 55% 6%', '--ring':'0 84% 60%' },
    body: 'radial-gradient(ellipse at 20% 20%,rgba(239,68,68,.16),transparent 45%),radial-gradient(ellipse at 80% 80%,rgba(249,115,22,.1),transparent 45%),hsl(222 55% 6%)',
  },
  {
    id: 'violet', label: 'بنفسجي', desc: 'ملكي فاخر', icon: '💜',
    preview: { bg:'#08040f', primary:'#8b5cf6', accent:'#a78bfa', sidebar:'#060212' },
    dark: true,
    vars: { '--primary':'262 83% 65%', '--primary-foreground':'0 0% 100%', '--accent':'258 90% 75%', '--accent-foreground':'270 55% 6%', '--ring':'262 83% 65%' },
    body: 'radial-gradient(ellipse at 20% 20%,rgba(139,92,246,.18),transparent 45%),radial-gradient(ellipse at 80% 80%,rgba(167,139,250,.1),transparent 45%),hsl(222 55% 6%)',
  },
  {
    id: 'gold', label: 'ذهبي', desc: 'فخامة ورسمية', icon: '🥇',
    preview: { bg:'#0a0700', primary:'#f59e0b', accent:'#fbbf24', sidebar:'#080500' },
    dark: true,
    vars: { '--primary':'38 92% 50%', '--primary-foreground':'0 0% 0%', '--accent':'45 96% 58%', '--accent-foreground':'38 55% 5%', '--ring':'38 92% 50%' },
    body: 'radial-gradient(ellipse at 20% 20%,rgba(245,158,11,.16),transparent 45%),radial-gradient(ellipse at 80% 80%,rgba(251,191,36,.1),transparent 45%),hsl(222 55% 6%)',
  },
  {
    id: 'ocean', label: 'محيطي', desc: 'أزرق محيطي هادئ', icon: '🌊',
    preview: { bg:'#030d18', primary:'#0ea5e9', accent:'#38bdf8', sidebar:'#020b14' },
    dark: true,
    vars: { '--primary':'199 89% 48%', '--primary-foreground':'0 0% 100%', '--accent':'198 93% 60%', '--accent-foreground':'210 60% 6%', '--ring':'199 89% 48%' },
    body: 'radial-gradient(ellipse at 20% 20%,rgba(14,165,233,.18),transparent 45%),radial-gradient(ellipse at 80% 80%,rgba(56,189,248,.12),transparent 45%),hsl(222 55% 6%)',
  },
  {
    id: 'rose', label: 'وردي', desc: 'عصري مميز', icon: '🌸',
    preview: { bg:'#0f030a', primary:'#ec4899', accent:'#f472b6', sidebar:'#0c0208' },
    dark: true,
    vars: { '--primary':'330 81% 60%', '--primary-foreground':'0 0% 100%', '--accent':'340 90% 65%', '--accent-foreground':'330 55% 6%', '--ring':'330 81% 60%' },
    body: 'radial-gradient(ellipse at 20% 20%,rgba(236,72,153,.16),transparent 45%),radial-gradient(ellipse at 80% 80%,rgba(244,114,182,.1),transparent 45%),hsl(222 55% 6%)',
  },
  {
    id: 'light', label: 'نهاري فاتح', desc: 'وضع نهاري واضح', icon: '☀️',
    preview: { bg:'#f8fafc', primary:'#1d4ed8', accent:'#0891b2', sidebar:'#0f1f4b' },
    dark: false,
    vars: { '--primary':'216 95% 44%', '--primary-foreground':'0 0% 100%', '--accent':'186 92% 38%', '--accent-foreground':'0 0% 100%', '--ring':'216 95% 44%' },
    body: 'hsl(220 30% 97%)',
  },
]

const THEME_KEY = 'helm_active_theme'

export function getActiveThemeId() {
  try { return localStorage.getItem(THEME_KEY) || 'midnight' } catch { return 'midnight' }
}

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const root  = document.documentElement

  // Apply only primary/accent color overrides — don't touch background/card vars
  // This prevents conflicts with the base dark/light theme system
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))

  // Set theme mode
  if (theme.dark) {
    root.classList.add('theme-dark')
    root.classList.remove('theme-light')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.add('theme-light')
    root.classList.remove('theme-dark')
    root.setAttribute('data-theme', 'light')
  }

  // Apply body background
  document.body.style.background = theme.body || ''

  try { localStorage.setItem(THEME_KEY, themeId) } catch {}
  return theme
}

export function initTheme() {
  const id = getActiveThemeId()
  applyTheme(id)
}
