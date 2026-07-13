@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   SpecForge - starting local dev server
echo ========================================
echo.

if not exist "node_modules" (
    echo Installing dependencies for the first time - this may take a minute...
    call npm install
    echo.
)

if not exist ".env.local" (
    echo WARNING: .env.local not found.
    echo Copy .env.example to .env.local and add your OPENROUTER_API_KEY before continuing.
    echo See SETUP.md for details.
    echo.
    pause
    exit /b 1
)

echo Starting the dev server in a new window...
start "SpecForge Dev Server" cmd /k npm run dev

echo Waiting for it to boot...
timeout /t 6 /nobreak >nul

start "" http://localhost:3000

echo.
echo SpecForge should now be open in your browser at http://localhost:3000
echo Close the "SpecForge Dev Server" window to stop the server.
echo.
pause
