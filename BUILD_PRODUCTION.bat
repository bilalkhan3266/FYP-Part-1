@echo off
REM Production Build Script
REM Builds frontend and prepares backend for production deployment

setlocal enabledelayedexpansion

echo.
echo ============================================
echo    PRODUCTION BUILD PROCESS
echo ============================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    pause
    exit /b 1
)

echo [OK] Node.js version:
node --version

REM Install/update dependencies
echo.
echo [STEP 1] Installing/Updating Dependencies...
echo.

cd backend
echo Installing backend dependencies...
call npm install --production
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed

cd ..\frontend
echo Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

REM Build frontend
echo.
echo [STEP 2] Building Frontend...
echo.

call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed
    cd ..
    pause
    exit /b 1
)
echo [OK] Frontend built successfully

REM Check if build folder exists
if exist build (
    echo [OK] Build folder created: %cd%\build
    for /f %%A in ('dir /b build ^| find /c /v ""') do set COUNT=%%A
    echo [OK] Build contains !COUNT! files/folders
) else (
    echo [ERROR] Build folder not created
    cd ..
    pause
    exit /b 1
)

cd ..

REM Create production .env file
echo.
echo [STEP 3] Environment Configuration...
echo.

if exist backend\.env.production (
    echo [OK] backend\.env.production exists
) else (
    echo [CREATE] backend\.env.production
    (
        echo PORT=5000
        echo MONGODB_URI=CHANGE_THIS_TO_YOUR_PRODUCTION_MONGODB_URI
        echo NODE_ENV=production
        echo JWT_SECRET=CHANGE_THIS_TO_YOUR_PRODUCTION_SECRET
        echo CORS_ORIGIN=https://yourdomain.com
    ) > backend\.env.production
    echo [INFO] Please edit backend\.env.production with your production values
)

REM Display summary
echo.
echo ============================================
echo     BUILD SUMMARY
echo ============================================
echo.
echo [OK] Frontend built and optimized
echo [OK] Backend dependencies installed (production)
echo [OK] Frontend build size: frontend\build\
echo.
echo Next Steps:
echo.
echo 1. Review and update production variables:
echo    - Edit backend\.env.production
echo    - Set MONGODB_URI to your production database
echo    - Set JWT_SECRET to a secure random value
echo    - Update CORS_ORIGIN to your domain
echo.
echo 2. Deploy to cloud platform:
echo    - Heroku: git push heroku master
echo    - Docker: docker-compose up
echo    - AWS EC2: SCP files and run npm start
echo    - Vercel/Railway: Connect GitHub repo
echo.
echo 3. Start production server:
echo    cd backend
echo    NODE_ENV=production npm start
echo.
echo 4. Verify deployment:
echo    - Check http://your-domain/
echo    - Test API endpoints at http://your-domain/api/
echo    - Monitor logs for errors
echo.
echo ============================================
echo.

pause
