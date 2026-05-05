@echo off
chcp 65001 >nul
cd /d %~dp0
if not exist node_modules (
  npm install
)
npm run build
pause
