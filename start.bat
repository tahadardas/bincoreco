@echo off
cd /d "%~dp0"
title Banco Ricco - Startup

:: Check if API server is already running
call :check_port 4000
if "%PORT_OPEN%"=="1" (
    echo [^>] API server already running on port 4000
) else (
    echo [*] Starting API server on port 4000...
    start "Banco Ricco API" cmd /c "cd /d "%~dp0apps\api" && node dist\src\main.js"
    timeout /t 5 /nobreak >nul
)

echo [*] Starting Website on port 3000...
start "Banco Ricco Website" cmd /c "cd /d "%~dp0apps\website" && npx next dev --port 3000"

echo [*] Starting Admin Panel on port 3001...
start "Banco Ricco Admin" cmd /c "cd /d "%~dp0apps\admin" && npx next dev --port 3001"

echo.
echo ============================================================
echo  Banco Ricco Digital Platform - Startup Complete
echo ============================================================
echo.
echo  Website:  http://localhost:3000/ar
echo  Admin:    http://localhost:3001/login
echo  API:      http://localhost:4000/api
echo  Swagger:  http://localhost:4000/api/docs
echo.
echo  Admin login: maestro@banco-ricco.com / admin123
echo  Customer:    customer@example.com / customer123
echo.
echo ============================================================
echo.
echo Press any key to open Website in browser...
pause >nul
start http://localhost:3000/ar

echo Press any key to open Admin Panel...
pause >nul
start http://localhost:3001/login

echo.
echo All services are running in background windows.
echo Close them to stop the services.
pause
exit /b

:check_port
set "PORT_OPEN=0"
netstat -ano 2>nul | findstr ":%1 " >nul 2>&1
if errorlevel 1 (
    set "PORT_OPEN=0"
) else (
    set "PORT_OPEN=1"
)
exit /b
