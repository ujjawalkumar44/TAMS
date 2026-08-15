@echo off
echo Starting SDMS Frontend...
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
start "SDMS Frontend" cmd /k npm run dev
echo.
echo Frontend will be available at http://localhost:5173
pause
