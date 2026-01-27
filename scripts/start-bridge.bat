@echo off
title 🚀 IBT Bridge - Start All Services
color 0A
echo.
echo ========================================
echo      IBT Bridge - Pornire Servicii
echo ========================================
echo.

REM Verifică dacă scriptul rulează din rădăcina proiectului
if not exist "backend" (
    echo ERROR: Te rog ruleaza scriptul din directorul bridge-project
    pause
    exit /b 1
)

REM ===============================
echo [1/4] Pornire Ethereum Localnet (Anvil)...
start "Anvil" cmd /k "cd contracts\ethereum && anvil"
timeout /t 10 /nobreak >nul

REM ===============================
echo [2/4] Pornire Sui Network...
start "Sui" cmd /k "cd contracts\sui && sui start"
timeout /t 10 /nobreak >nul

REM ===============================
echo [3/4] Pornire Backend Node.js...
start "Backend" cmd /k "cd backend && npm install && node server.js"
timeout /t 5 /nobreak >nul

REM ===============================
echo [4/4] Pornire Frontend React (Vite)...
REM Deschide automat Chrome
start "" "chrome.exe" "http://localhost:5173"
REM Pornește terminalul frontend
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ========================================
echo ✅ Toate serviciile ar trebui să fie pornite!
echo ========================================
echo Servicii active:
echo   - Ethereum Localnet (Anvil):  http://127.0.0.1:8545
echo   - Sui Network:                http://127.0.0.1:9000 (default Sui port)
echo   - Backend Node.js:           http://localhost:3001
echo   - Frontend React:            http://localhost:5173
echo.

echo Apasa orice tasta pentru a OPRI toate serviciile...
pause >nul

echo.
echo 🔴 Se opresc serviciile...
taskkill /FI "WINDOWTITLE eq Anvil" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Sui" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend" /F >nul 2>&1

echo ✅ Toate serviciile au fost oprite.
pause
