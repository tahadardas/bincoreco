@echo off
cd /d "%~dp0"
title Banco Ricco - Production Startup

:: --------------------------------------------------------
echo ============================================================
echo  Banco Ricco Digital Platform - Production Build & Start
echo ============================================================
echo.

:: --------------------------------------------------------
:: Step 0: Pre-checks
:: --------------------------------------------------------
echo [*] Checking dependencies...
where node >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)
where npx >nul 2>&1
if errorlevel 1 (
    echo [X] npx not found. Please install npm first.
    pause
    exit /b 1
)

:: --------------------------------------------------------
:: Step 1: Build validators package
:: --------------------------------------------------------
echo [*] Building validators package...
cd /d "%~dp0packages\validators"
call npm run build
if errorlevel 1 (
    echo [X] Validators build failed!
    pause
    exit /b 1
)
echo [>] Validators built successfully.
echo.

:: --------------------------------------------------------
:: Step 2: Build API
:: --------------------------------------------------------
echo [*] Building API...
cd /d "%~dp0apps\api"
call npm run build
if errorlevel 1 (
    echo [X] API build failed!
    pause
    exit /b 1
)
echo [>] API built successfully.
echo.

:: --------------------------------------------------------
:: Step 3: Build Website
:: --------------------------------------------------------
echo [*] Building Website...
cd /d "%~dp0apps\website"
call npm run build
if errorlevel 1 (
    echo [X] Website build failed!
    pause
    exit /b 1
)
echo [>] Website built successfully.
echo.

:: --------------------------------------------------------
:: Step 4: Build Admin Panel
:: --------------------------------------------------------
echo [*] Building Admin Panel...
cd /d "%~dp0apps\admin"
call npm run build
if errorlevel 1 (
    echo [X] Admin build failed!
    pause
    exit /b 1
)
echo [>] Admin panel built successfully.
echo.

:: --------------------------------------------------------
:: Step 5: Start API server (production)
:: --------------------------------------------------------
call :check_port 4000
if "%PORT_OPEN%"=="1" (
    echo [>] API server already running on port 4000
) else (
    echo [*] Starting API server on port 4000...
    start "Banco Ricco API" cmd /c "cd /d "%~dp0apps\api" && node dist\src\main.js"
    
    :: Health check loop (wait up to 30s)
    set "API_READY=0"
    for /l %%i in (1,1,30) do (
        timeout /t 1 /nobreak >nul
        curl -s -f http://localhost:4000/api/health >nul 2>&1
        if not errorlevel 1 (
            set "API_READY=1"
            goto :api_ready
        )
    )
    :api_ready
    if "%API_READY%"=="0" (
        echo [X] API failed to start within 30 seconds!
        pause
        exit /b 1
    )
    echo [>] API server is healthy.
)

:: --------------------------------------------------------
:: Step 6: Start Website (production)
:: --------------------------------------------------------
echo [*] Starting Website on port 3000...
start "Banco Ricco Website" cmd /c "cd /d "%~dp0apps\website" && npx next start -p 3000"

:: --------------------------------------------------------
:: Step 7: Start Admin Panel (production)
:: --------------------------------------------------------
echo [*] Starting Admin Panel on port 3001...
start "Banco Ricco Admin" cmd /c "cd /d "%~dp0apps\admin" && npx next start -p 3001"

:: --------------------------------------------------------
:: Done
:: --------------------------------------------------------
echo.
echo ============================================================
echo  Banco Ricco Digital Platform - Ready
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
echo [i] All services are running in background windows.
echo [i] To stop all services, run:  stop.bat
pause
exit /b

:: --------------------------------------------------------
:: Port check subroutine
:: --------------------------------------------------------
:check_port
set "PORT_OPEN=0"
netstat -ano 2>nul | findstr ":%1 " >nul 2>&1
if errorlevel 1 (
    set "PORT_OPEN=0"
) else (
    set "PORT_OPEN=1"
)
exit /b
