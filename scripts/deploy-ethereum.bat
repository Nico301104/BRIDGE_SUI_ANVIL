@echo off
echo ========================================
echo   Deploy Ethereum IBT Contract
echo ========================================
echo.

cd contracts\ethereum

echo Verific daca Anvil ruleaza...
curl -s http://127.0.0.1:8545 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Anvil nu ruleaza!
    echo Te rog porneste Anvil mai intai: anvil
    pause
    exit /b 1
)

echo [OK] Anvil ruleaza
echo.

set PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

echo Deploy contract...
forge script script\Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

echo.
echo ========================================
echo   Deployment Complet!
echo ========================================
echo.
echo IMPORTANT: Copiaza adresa contractului de mai sus
echo si actualizeaz-o in:
echo   - backend\server.js
echo   - backend\.env
echo   - frontend\src\App.jsx
echo.
pause