@echo off
echo ======================================================================
echo Starting AuraStay AI - Hotel Cancellation Risk Intelligence Platform
echo ======================================================================
echo.
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "AuraStay Backend (FastAPI)" cmd /k "python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "AuraStay Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo Launching browser in 4 seconds...
timeout /t 4 >nul
start http://localhost:5173
echo System is running!
