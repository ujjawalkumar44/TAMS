@echo off
echo Starting SDMS Backend...
cd /d "%~dp0backend"
call venv\Scripts\activate
start "SDMS Backend" cmd /k uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
echo.
echo Backend started at http://127.0.0.1:8000
echo API Docs: http://127.0.0.1:8000/api/docs
echo.
echo To start frontend, open a new terminal and run:
echo   cd frontend
echo   npm install
echo   npm run dev
pause
