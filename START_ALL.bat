@echo off
title EnglishWebAI - Launcher
color 0A

echo ========================================
echo    EnglishWebAI - Starting...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking backend...
if not exist "backend\start_backend.py" (
    echo ERROR: backend\start_backend.py not found!
    pause
    exit /b 1
)

echo [2/3] Checking frontend...
if not exist "frontend\package.json" (
    echo ERROR: frontend\package.json not found!
    pause
    exit /b 1
)

echo [3/3] Starting servers...
echo.

echo Starting Backend Server...
start "EnglishWebAI - Backend" cmd /k "cd /d "%~dp0backend" && python start_backend.py"

echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "EnglishWebAI - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo    Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/api/v1/docs
echo.
echo Wait 10-15 seconds for servers to fully start...
echo Then open your browser to: http://localhost:3000
echo.
echo Press any key to close this window...
echo (The servers will continue running)
echo ========================================
pause >nul

