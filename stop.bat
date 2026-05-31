@echo off
cd /d "%~dp0"
title Banco Ricco - Stop Services

echo [*] Stopping Banco Ricco services...

:: Find and kill processes by window title (started by start.bat)
for %%p in ("Banco Ricco API" "Banco Ricco Website" "Banco Ricco Admin") do (
    taskkill /fi "WINDOWTITLE eq %%p" /f >nul 2>&1
)

:: Also kill any lingering node processes on our ports
for %%p in (3000 3001 4000) do (
    for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%%p "') do (
        if not "%%a"=="" (
            taskkill /pid %%a /f >nul 2>&1
        )
    )
)

echo [>] All services stopped.
pause
