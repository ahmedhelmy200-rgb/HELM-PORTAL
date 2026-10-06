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
if (Test-Path $envFile) {
  $envText = Get-Content $envFile -Raw
  if ($envText -match '(?m)^VITE_SUPABASE_URL=https://[a-z0-9-]+\.supabase\.co\s*$' -and
      $envText -match '(?m)^VITE_SUPABASE_ANON_KEY=\S+' -and
      $envText -notmatch 'YOUR_PROJECT|YOUR_SUPABASE_ANON_KEY') {
    Write-Host "Using Supabase values from .env.local." -ForegroundColor Green
  } else {
    Write-Host "The existing .env.local does not contain complete Supabase values." -ForegroundColor Yellow
    Write-Host "The EXE will still work: Windows first-run setup will ask for the public Supabase URL and Anon key." -ForegroundColor Yellow
  }
} else {
  Write-Host "No .env.local found. Building a configurable Windows EXE." -ForegroundColor Yellow
  Write-Host "On first launch, HELM Portal will ask once for the public Supabase URL and Anon key." -ForegroundColor Yellow
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
