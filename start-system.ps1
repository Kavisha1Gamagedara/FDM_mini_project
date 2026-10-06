Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   OSTRO Salento - Luxury Cliff Hotel & AI Cancellation Platform" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process cmd -ArgumentList '/k', 'python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000' -WorkingDirectory $PSScriptRoot

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process cmd -ArgumentList '/k', 'cd frontend && npm run dev' -WorkingDirectory $PSScriptRoot

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   SYSTEM IS STARTING UP!" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "   [FRONTEND URL]: http://localhost:5173" -ForegroundColor Green
Write-Host "   [BACKEND API ]: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "   [API DOCS    ]: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Opening frontend in your default browser in 3 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
Write-Host "System is running!" -ForegroundColor Green
