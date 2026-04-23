@echo off
echo ======================================
echo  Starting DeltaTradeHub Backend
echo ======================================
cd /d "%~dp0server"
npm run dev
pause
