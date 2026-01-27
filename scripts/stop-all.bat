@echo off
echo Oprire servicii bridge...

taskkill /FI "WINDOWTITLE eq *Anvil*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq *Sui*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq *Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq *Frontend*" /F >nul 2>&1

echo [OK] Toate serviciile au fost oprite.
timeout /t 2 >nul