@echo off
REM Complete Project Startup Script
REM This script sets up and runs both frontend and backend

setlocal enabledelayedexpansion

echo.
echo ============================================
echo     FYP PROJECT - Complete Startup
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version

REM Check MongoDB
echo.
echo Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB is running
) else (
    echo [WARN] MongoDB is not running
    echo Attempting to start MongoDB...
    net start MongoDB >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] MongoDB started successfully
    ) else (
        echo [WARN] Could not start MongoDB. Please start it manually or use MongoDB Atlas
    )
)

REM Create environment files if they don't exist
echo.
echo Setting up environment variables...

if not exist backend\.env (
    echo [CREATE] backend\.env
    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/fypproject
        echo NODE_ENV=development
        echo JWT_SECRET=your_jwt_secret_key_here
        echo JWT_EXPIRE=7d
        echo CORS_ORIGIN=http://localhost:3000
    ) > backend\.env
    echo [OK] backend\.env created
) else (
    echo [OK] backend\.env exists
)

if not exist frontend\.env.local (
    echo [CREATE] frontend\.env.local
    (
        echo REACT_APP_API_URL=http://localhost:5000/api
        echo REACT_APP_ENV=development
    ) > frontend\.env.local
    echo [OK] frontend\.env.local created
) else (
    echo [OK] frontend\.env.local exists
)

REM Install dependencies
echo.
echo Installing dependencies...

if not exist backend\node_modules (
    echo [INSTALL] Backend dependencies...
    cd backend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Backend dependencies installed
) else (
    echo [OK] Backend dependencies already installed
)

if not exist frontend\node_modules (
    echo [INSTALL] Frontend dependencies...
    cd frontend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies already installed
)

REM Display startup instructions
echo.
echo ============================================
echo     STARTUP COMPLETE - NEXT STEPS
echo ============================================
echo.
echo You need to start TWO separate terminals:
echo.
echo Terminal 1 - Backend Server:
echo   cd backend
echo   npm start
echo.
echo Terminal 2 - Frontend App:
echo   cd frontend
echo   npm start
echo.
echo Access the application:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000/api
echo.
echo Database:
echo   Local MongoDB: mongodb://localhost:27017/fypproject
echo   Or use MongoDB Atlas: Update MONGODB_URI in backend\.env
echo.
echo ============================================
echo.

REM Ask user if they want to open file explorer
echo Do you want to open the project folder? (Y/N)
set /p OPEN_FOLDER=
if /i "%OPEN_FOLDER%"=="Y" (
    start explorer .
)

pause
