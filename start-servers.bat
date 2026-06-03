@echo off
REM Start backend and frontend servers for Module 5

echo Starting backend server on port 5000...
start cmd /k "cd /d c:\Users\Obède NIZIGIYIMANA\communium\backend && npm start"

timeout /t 5

echo Starting frontend server on port 3001...
start cmd /k "cd /d c:\Users\Obède NIZIGIYIMANA\communium\frontend && npm run dev"

echo.
echo ====================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
echo ====================================
echo.
echo Servers are starting. Check the windows that appeared.
pause
