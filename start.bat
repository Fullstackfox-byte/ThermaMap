@echo off
title Smart Urban Heat Island Mitigation & Microclimate Platform
cd /d "%~dp0"

echo =========================================================================
echo    Smart Urban Heat Island Mitigation ^& Microclimate Mapping Platform
echo                              (MERN Stack)
echo =========================================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js paoya jayni. https://nodejs.org theke install koro, tarpor abar chalao.
  pause
  exit /b 1
)

if not exist "node_modules" call npm install
if not exist "server\node_modules" call npm install --prefix server
if not exist "client\node_modules" call npm install --prefix client

echo.
echo Starting Backend API Server (Port 5000) and React Frontend (Port 5173)...
echo.
call npm run dev
pause