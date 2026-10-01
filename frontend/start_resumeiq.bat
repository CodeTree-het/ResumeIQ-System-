@echo off
title ResumeIQ Launcher

echo ==========================================
echo        Starting ResumeIQ Project
echo ==========================================
echo.

cd /d E:\ResumeIQ

REM ---------------------------------------------------------
REM Check Virtual Environment
REM ---------------------------------------------------------

if not exist "E:\ResumeIQ\venv\Scripts\python.exe" (
    echo ERROR: Python virtual environment not found.
    echo Expected:
    echo E:\ResumeIQ\venv\Scripts\python.exe
    echo.
    pause
    exit /b
)

echo [1/3] Starting FastAPI Backend...

start "ResumeIQ Backend" cmd /k ^
"cd /d E:\ResumeIQ && E:\ResumeIQ\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"


echo [2/3] Starting Frontend Server...

start "ResumeIQ Frontend" cmd /k ^
"cd /d E:\ResumeIQ && E:\ResumeIQ\venv\Scripts\python.exe -m http.server 5500 --bind 127.0.0.1"


echo [3/3] Opening ResumeIQ Login Page...

timeout /t 3 /nobreak >nul


start "" "http://127.0.0.1:5500/frontend/auth/login.html"


echo.
echo ==========================================
echo ResumeIQ Started Successfully
echo ==========================================
echo.
echo Backend:
echo http://127.0.0.1:8000
echo.
echo Swagger:
echo http://127.0.0.1:8000/docs
echo.
echo Frontend:
echo http://127.0.0.1:5500/frontend/auth/login.html
echo.
echo You can close this launcher window.
echo Keep Backend and Frontend windows running.
echo.

timeout /t 3 /nobreak >nul

exit