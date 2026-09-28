function normalizeBucketName(value, fallback) {
  const raw = String(value || '').trim()
  if (!raw) return fallback

  // VITE_SUPABASE_STORAGE_BUCKET must contain a bucket id/name only.
  // If someone pastes the S3 endpoint (or any URL/path) by mistake,
  // fall back to the known safe bucket instead of sending an invalid name
  // to supabase.storage.from(...).
  const looksLikeUrlOrPath =
    /^https?:\/\//i.test(raw) ||
    raw.includes('/storage/v1/') ||
    raw.includes('\\') ||
    raw.includes('/')

  return looksLikeUrlOrPath ? fallback : raw
}

const rawStorageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET
const rawBrandBucket = import.meta.env.VITE_SUPABASE_BRAND_BUCKET

export const appParams = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  storageBucketRaw: rawStorageBucket || '',
  storageBucket: normalizeBucketName(rawStorageBucket, 'uploads'),
  storageBucketWasCorrected:
    Boolean(rawStorageBucket) && normalizeBucketName(rawStorageBucket, 'uploads') !== String(rawStorageBucket).trim(),
  brandBucketRaw: rawBrandBucket || '',
  brandBucket: normalizeBucketName(rawBrandBucket, 'AHMED HELMY'),
  googleRedirectUrl: import.meta.env.VITE_SUPABASE_GOOGLE_REDIRECT_URL || window.location.origin,
  ocrEdgeFunction: import.meta.env.VITE_OCR_EDGE_FUNCTION || 'extract-ocr',
  appName: import.meta.env.VITE_APP_NAME || 'HELM',
}
