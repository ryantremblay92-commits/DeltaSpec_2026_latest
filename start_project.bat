@echo off
echo ==============================================
echo  DeltaTradeHub Startup Script
echo ==============================================

echo Note: Since you mentioned Redis is running, we'll start the other services.

echo Starting MongoDB (assuming it's installed and in PATH)...
start "MongoDB" cmd /k "mongod"

echo Starting Backend and Frontend Servers...
start "Node Servers" cmd /k "cd /d "%~dp0" && npm run dev"

echo Starting Python Data Collector...
start "Data Collector" cmd /k "cd /d "%~dp0data-collector" && python redis_data_collector.py"

echo.
echo All services have been launched in new command prompt windows.
echo You can view the application at http://localhost:5173
pause
