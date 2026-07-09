import { supabase } from '@/integrations/supabase/client'

const RETRY_ATTR = 'data-helm-img-retried'
const PLACEHOLDER_ATTR = 'data-helm-img-placeholder'
const SIGN_EXPIRES_SECONDS = 60 * 60 * 24 * 7

function isImageElement(target) {
  return target && target.tagName === 'IMG'
}

function cleanPath(value = '') {
  return decodeURIComponent(String(value || '').split('?')[0]).replace(/^\/+/, '')
}

function parseStorageReference(value) {
  if (!value || typeof value !== 'string') return null
  const raw = value.trim()

  if (raw.startsWith('storage://')) {
    const tail = raw.replace(/^storage:\/\//, '')
    const idx = tail.indexOf('/')
    if (idx <= 0) return null
    return { bucket: tail.slice(0, idx), path: cleanPath(tail.slice(idx + 1)) }
  }

  try {
    const url = new URL(raw, window.location.origin)
    const patterns = [
      '/storage/v1/object/sign/',
      '/storage/v1/object/public/',
      '/storage/v1/object/authenticated/',
    ]
    const matched = patterns.find((pattern) => url.pathname.includes(pattern))
    if (!matched) return null
    const tail = url.pathname.split(matched)[1] || ''
    const parts = tail.split('/').filter(Boolean)
    if (parts.length < 2) return null
    const bucket = parts.shift()
    return { bucket, path: cleanPath(parts.join('/')) }
  } catch {
    return null
  }
}

async function getRecoveredStorageUrl(ref) {
  if (!ref?.bucket || !ref?.path) return null
  try {
    const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, SIGN_EXPIRES_SECONDS)
    if (!error && data?.signedUrl) return data.signedUrl
  } catch {}
  try {
    const { data } = supabase.storage.from(ref.bucket).getPublicUrl(ref.path)
    if (data?.publicUrl) return data.publicUrl
  } catch {}
  return null
}

function fallbackSvg(label = 'HELM') {
  const safe = String(label || 'HELM').slice(0, 18)
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0f172a"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs>
      <rect width="640" height="420" rx="36" fill="url(#g)"/>
      <circle cx="320" cy="165" r="58" fill="rgba(255,255,255,.16)"/>
      <path d="M210 286h220" stroke="rgba(255,255,255,.55)" stroke-width="16" stroke-linecap="round"/>
      <text x="320" y="355" text-anchor="middle" font-family="Arial" font-size="28" font-weight="800" fill="white">${safe}</text>
    </svg>`)} `
}

async function recoverImage(img) {
  if (!isImageElement(img)) return
  if (img.getAttribute(PLACEHOLDER_ATTR) === 'true') return
  const retryCount = Number(img.getAttribute(RETRY_ATTR) || 0)
  if (retryCount >= 3) {
    img.setAttribute(PLACEHOLDER_ATTR, 'true')
    img.src = img.dataset?.fallbackSrc || fallbackSvg(img.alt || 'HELM')
    img.style.objectFit = img.style.objectFit || 'contain'
    return
  }
  img.setAttribute(RETRY_ATTR, String(retryCount + 1))

  const src = img.currentSrc || img.src || img.getAttribute('src') || ''
  const declared = img.getAttribute('data-storage-ref') || img.getAttribute('data-original-src') || src
  const ref = parseStorageReference(declared) || parseStorageReference(src)
  if (ref) {
    const recovered = await getRecoveredStorageUrl(ref)
    if (recovered && recovered !== src) {
      img.src = recovered
      return
    }
  }

  if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/') && !src.startsWith('blob:')) {
    img.src = `/${src}`
    return
  }

  if (/icon|logo|favicon/i.test(src) || /شعار|logo/i.test(img.alt || '')) {
    img.src = `/icon-192.png?v=${Date.now()}`
    return
  }

  img.setAttribute(PLACEHOLDER_ATTR, 'true')
  img.src = img.dataset?.fallbackSrc || fallbackSvg(img.alt || 'HELM')
}

export function installGlobalImageRecovery() {
  if (typeof window === 'undefined' || window.__HELM_IMAGE_RECOVERY_INSTALLED__) return
  window.__HELM_IMAGE_RECOVERY_INSTALLED__ = true

  document.addEventListener('error', (event) => {
    const img = event.target
    if (!isImageElement(img)) return
    recoverImage(img)
  }, true)

  window.addEventListener('online', () => {
    document.querySelectorAll('img').forEach((img) => {
      if (!img.complete || img.naturalWidth === 0) recoverImage(img)
    })
  })
}
