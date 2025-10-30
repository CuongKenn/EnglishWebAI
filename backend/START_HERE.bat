@echo off
echo ========================================
echo   EnglishWebAI Backend Startup
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)

echo.
echo Starting backend server...
echo Backend will run on: http://localhost:8000
echo API docs: http://localhost:8000/api/v1/docs
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python start_backend.py

pause

