@echo off
title ViLao AI Chat - Safe Server
echo ===================================================
echo     DANG KHOI DONG VILAO AI CHAT (PROXY & WEB)
echo ===================================================
echo.
cd /d "%~dp0"
echo Dang chay ca Backend (Port 3001) va Frontend (Port 5173)...
echo Link truy cap: http://localhost:5173
echo.
npm run start
pause
