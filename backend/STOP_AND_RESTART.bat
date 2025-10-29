@echo off
echo ====================================
echo BACKEND RESTART HELPER
echo ====================================
echo.
echo Current directory: %CD%
echo.
echo This script will help you restart the backend.
echo.
echo INSTRUCTIONS:
echo 1. First, go to the terminal running your backend
echo 2. Press Ctrl+C to stop it
echo 3. Then run: python main.py
echo.
echo Or you can double-click this file to start backend:
echo.
pause
echo.
echo Starting backend...
cd /d "%~dp0"
python main.py


