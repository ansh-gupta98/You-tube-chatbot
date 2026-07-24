@echo off
REM ============================================================
REM  YouTube Chatbot Pro - Windows Launcher
REM  Starts both backend (FastAPI) and frontend (React) servers
REM ============================================================

echo ============================================
echo   YouTube Chatbot Pro - Starting...
echo ============================================
echo.

REM ---- Start backend in new window ----
echo [1/2] Starting backend (FastAPI on port 8000)...
start "YouTubeChatbot-Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --reload --host 127.0.0.1 --port 8000"

REM ---- Wait a moment for backend to start ----
timeout /t 3 /nobreak >nul

REM ---- Start frontend in new window ----
echo [2/2] Starting frontend (React on port 5173)...
start "YouTubeChatbot-Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo   Both servers are starting!
echo.
echo   Backend:  http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/docs
echo   Frontend: http://localhost:5173
echo ============================================
echo.
echo Close this window when done. Backend and frontend
echo will keep running in their own windows.
echo.
pause
