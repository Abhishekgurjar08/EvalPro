@echo off
echo ====================================================
echo Starting Pariksha AI Examination & Evaluation System
echo ====================================================

echo 1. Starting Backend Server on port 5000...
start cmd /k "cd server && npm start"

timeout /t 3 >nul

echo 2. Starting Frontend Client on port 5173...
start cmd /k "cd client && npm run dev"

echo.
echo Both servers started!
echo Open your browser at: http://localhost:5173
echo ====================================================
pause
