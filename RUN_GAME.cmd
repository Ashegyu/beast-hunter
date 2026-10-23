@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js가 필요합니다. Node.js 설치 후 다시 실행하세요.
  pause
  exit /b 1
)
node serve-local.mjs
pause
