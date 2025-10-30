@echo off
echo ===================================
echo   RESTARTING BACKEND SERVER
echo ===================================
echo.

echo Stopping old backend process...
taskkill /F /FI "WINDOWTITLE eq Backend*" 2>nul
taskkill /F /FI "IMAGENAME eq python.exe" /FI "COMMANDLINE eq *main.py*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend with new config...
cd /d "%~dp0"
start "Backend Server" python main.py

echo.
echo ===================================
echo   Backend restarted!
echo   Check the new window for logs
echo ===================================
pause

