$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "HELM Portal - Windows Desktop Build" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js is not installed or not available in PATH.'
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'npm is not installed or not available in PATH.'
}

$envFile = Join-Path $PSScriptRoot '.env.local'
if (-not (Test-Path $envFile)) {
  if (Test-Path (Join-Path $PSScriptRoot '.env.example')) {
    Copy-Item (Join-Path $PSScriptRoot '.env.example') $envFile
  }
  Write-Host "`nCreated .env.local. Add the real Supabase URL and anon key, then run this script again." -ForegroundColor Yellow
  Start-Process notepad.exe $envFile
  exit 1
}

$envText = Get-Content $envFile -Raw
if ($envText -notmatch '(?m)^VITE_SUPABASE_URL=https://[a-z0-9-]+\.supabase\.co\s*$') {
  throw 'VITE_SUPABASE_URL is missing or invalid in .env.local.'
}
if ($envText -notmatch '(?m)^VITE_SUPABASE_ANON_KEY=\S+') {
  throw 'VITE_SUPABASE_ANON_KEY is missing in .env.local.'
}
if ($envText -match 'YOUR_PROJECT|YOUR_SUPABASE_ANON_KEY') {
  throw 'Replace the placeholder Supabase values in .env.local first.'
}

Write-Host "`n[1/4] Installing application dependencies..." -ForegroundColor Cyan
if (Test-Path (Join-Path $PSScriptRoot 'package-lock.json')) {
  npm ci
} else {
  npm install
}
if ($LASTEXITCODE -ne 0) { throw 'npm dependency installation failed.' }

Write-Host "`n[2/4] Building the React/Vite application..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Vite build failed.' }

Write-Host "`n[3/4] Installing desktop packaging tools without changing package.json..." -ForegroundColor Cyan
npm install --no-save --package-lock=false electron@39.2.7 electron-builder@26.0.12
if ($LASTEXITCODE -ne 0) { throw 'Electron tooling installation failed.' }

Write-Host "`n[4/4] Creating Setup and Portable EXE..." -ForegroundColor Cyan
npx electron-builder --config electron-builder.yml --win nsis portable
if ($LASTEXITCODE -ne 0) { throw 'Windows packaging failed.' }

Write-Host "`nBuild completed successfully." -ForegroundColor Green
Write-Host "Output folder: $PSScriptRoot\release" -ForegroundColor Green
Get-ChildItem (Join-Path $PSScriptRoot 'release') -Filter '*.exe' | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
