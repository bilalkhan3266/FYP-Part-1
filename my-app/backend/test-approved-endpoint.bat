@echo off
REM Test Script for Approved Records Endpoint
REM This script tests if the backend is returning approved clearances

echo.
echo ====================================================
echo Testing /api/clearance/department Endpoint
echo ====================================================
echo.
echo NOTE: You need a valid JWT token for this to work
echo.
echo Step 1: Login to get a token
echo   - Open http://localhost:3000 in your browser
echo   - Login as library@example.com / password123
echo   - Open DevTools (F12) -> Application -> LocalStorage
echo   - Copy the 'token' value
echo.
echo Step 2: Set your token below and run this script
echo.

REM YOU NEED TO REPLACE THIS WITH YOUR ACTUAL TOKEN
set TOKEN=your_jwt_token_here

if "%TOKEN%"=="your_jwt_token_here" (
    echo ERROR: Please set your JWT token in this script first!
    echo.
    goto :EOF
)

echo Testing with token: %TOKEN:~0,20%...
echo.

REM Test the endpoint
curl -X GET http://localhost:5000/api/clearance/department ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -w "\n\nResponse Status: %%{http_code}\n"

echo.
echo ====================================================
echo Test Complete!
echo ====================================================
echo.
echo Expected Response Structure:
echo {
echo   "success": true,
echo   "phaseName": "Library",
echo   "phaseIndex": 1,
echo   "pending": [...],
echo   "rejected": [...],
echo   "approved": [...]  ^<-- Should have completed records here
echo }
echo.
