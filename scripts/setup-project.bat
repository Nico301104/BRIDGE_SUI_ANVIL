@echo off
echo ========================================
echo   IBT Bridge - Setup Proiect
echo ========================================
echo.

echo Creare structura directoare...
mkdir contracts\ethereum\src 2>nul
mkdir contracts\ethereum\script 2>nul
mkdir contracts\sui\sources 2>nul
mkdir backend 2>nul
mkdir frontend\src 2>nul
mkdir scripts 2>nul

echo [OK] Directoare create
echo.

echo [1/3] Setup Ethereum...
cd contracts\ethereum
call forge init --no-git
cd ..\..
echo [OK] Ethereum initializat
echo.

echo [2/3] Setup Backend...
cd backend
if not exist package.json (
    echo Instalare dependinte backend...
    call npm init -y
    call npm install express cors ethers@6.9.0 @mysten/sui.js dotenv
)
cd ..
echo [OK] Backend configurat
echo.

echo [3/3] Setup Frontend...
cd frontend
if not exist package.json (
    echo Creare aplicatie React...
    call npm create vite@latest . -- --template react
    echo Instalare dependinte...
    call npm install
    call npm install lucide-react
    call npm install -D tailwindcss postcss autoprefixer
    call npx tailwindcss init -p
)
cd ..
echo [OK] Frontend configurat
echo.

echo ========================================
echo   Setup Complet!
echo ========================================
echo.
echo Pasi urmatori:
echo   1. Copiaza fisierele contract in directoarele corespunzatoare
echo   2. Deploy contracte folosind deploy-ethereum.bat si deploy-sui.bat
echo   3. Actualizeaza fisierele de configurare cu adresele
echo   4. Ruleaza start-bridge.bat pentru a porni serviciile
echo.
pause