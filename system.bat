@echo off
title OSTRO Salento - System Launcher
cls
echo ======================================================================
echo    OSTRO Salento - Luxury Cliff Hotel & AI Cancellation Platform
echo ======================================================================
echo.
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "OSTRO Backend (FastAPI)" cmd /k "python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "OSTRO Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================================================
echo    SYSTEM IS STARTING UP!
echo ======================================================================
echo.
echo    [FRONTEND URL]: http://localhost:5173
echo    [BACKEND API ]: http://127.0.0.1:8000
echo    [API DOCS    ]: http://127.0.0.1:8000/docs
echo.
echo ======================================================================
echo Opening the frontend in your default browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:5173
echo.
echo You can open or refresh http://localhost:5173 anytime.
echo Both services are now running in their respective background windows.
echo ======================================================================
