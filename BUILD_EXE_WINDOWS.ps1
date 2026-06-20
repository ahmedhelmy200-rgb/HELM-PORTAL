$ErrorActionPreference = 'Stop'

Write-Host '=== HELM Portal Windows EXE Builder ===' -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js غير مثبت. ثبت Node.js 20 أو أحدث ثم أعد التشغيل.'
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'npm غير متاح. تأكد من تثبيت Node.js بشكل صحيح.'
}

$nodeVersion = node -v
Write-Host "Node version: $nodeVersion" -ForegroundColor DarkGray

if (-not (Test-Path '.env.local')) {
  if (Test-Path '.env.example') {
    Copy-Item '.env.example' '.env.local'
  }
  Write-Host ''
  Write-Host 'تم إنشاء ملف .env.local من .env.example.' -ForegroundColor Yellow
  Write-Host 'افتح .env.local وضع قيم Supabase الحقيقية، ثم شغل السكربت مرة أخرى:' -ForegroundColor Yellow
  Write-Host 'VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co' -ForegroundColor Yellow
  Write-Host 'VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY' -ForegroundColor Yellow
  exit 1
}

$envContent = Get-Content '.env.local' -Raw
if ($envContent -notmatch 'VITE_SUPABASE_URL\s*=\s*https://[a-z0-9-]+\.supabase\.co' -or $envContent -notmatch 'VITE_SUPABASE_ANON_KEY\s*=\s*.+') {
  throw 'ملف .env.local موجود لكن قيم Supabase غير مكتملة أو غير صحيحة.'
}

Write-Host 'Installing dependencies...' -ForegroundColor Cyan
npm install

Write-Host 'Building Windows EXE...' -ForegroundColor Cyan
npm run dist:win

Write-Host ''
Write-Host 'تم إنشاء ملفات EXE داخل مجلد release' -ForegroundColor Green
Get-ChildItem 'release' | Format-Table Name, Length, LastWriteTime
