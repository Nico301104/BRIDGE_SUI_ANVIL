@echo off
echo ========================================
echo   Deploy Sui IBT Contract
echo ========================================
echo.

cd contracts\sui

echo Build pachet Sui...
sui move build

if errorlevel 1 (
    echo.
    echo ERROR: Build esuat!
    pause
    exit /b 1
)

echo [OK] Build reusit
echo.

echo Publish pe retea locala...
sui client publish --gas-budget 100000000

echo.
echo ========================================
echo   Deployment Complet!
echo ========================================
echo.
echo IMPORTANT: Copiaza Package ID si TreasuryCap de mai sus
echo si actualizeaz-o in:
echo   - backend\server.js
echo   - backend\.env
echo.
pause