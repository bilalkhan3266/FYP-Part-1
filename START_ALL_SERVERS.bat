@echo off
REM Complete Server Startup Script for Part_3_Library

echo.
echo ======================================
echo  Part 3 Library - Complete Startup
echo ======================================
echo.

REM Kill any existing Node processes
echo [1/5] Stopping any existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak

REM Start MongoDB
echo.
echo [2/5] Starting MongoDB...
start /B mongod --dbpath "C:\Users\%USERNAME%\AppData\Local\MongoDB\data"
timeout /t 3 /nobreak

REM Start Backend
echo.
echo [3/5] Starting Backend Server...
cd /d "g:\Part_3_Library\my-app\backend"
start "Backend Server" cmd /k npm start

REM Wait for backend to start
timeout /t 5 /nobreak

REM Test Backend Connection
echo.
echo [4/5] Testing Backend Connection...
curl http://localhost:5000/api/health
echo.

REM Start Frontend
echo.
echo [5/5] Starting Frontend...
cd /d "g:\Part_3_Library\my-app"
start "Frontend Server" cmd /k npm start

echo.
echo ======================================
echo  ✅ All servers started!
echo ======================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo MongoDB:  mongodb://localhost:27017
echo.
echo Press any key to close this window...
pause

